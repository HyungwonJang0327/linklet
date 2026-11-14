import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { loadEnvFiles } from '../prisma/lib/load-env-files.mts'
import { isLocalDatabaseUrl, nonLocalDatabaseMessage } from '../prisma/lib/local-db.mts'

// `pnpm db:migrate {이름} [--create-only]` — 마이그레이션 + 역방향 down.sql 을 한 번에 만든다 (decisions/db-migration.md M1·M2, FEATURES F02)
//
// 순서(M2, 2026-11-11 확정): 스키마를 고친 뒤
//   1. `prisma migrate diff --from-schema prisma/schema.prisma --to-migrations prisma/migrations --script` → down.sql 내용
//      (= "새 스키마 → 직전까지의 마이그레이션 상태" 로 되돌리는 SQL. migrate dev *전에* 떠야 새 마이그레이션이 비교 대상에 섞이지 않는다)
//      - 첫 마이그레이션(migrations 폴더에 migration_lock.toml 이 없음)은 `--to-migrations` 가 실패하므로 `--to-empty` 로 바꾼다(실측 2026-11-14)
//      - `--to-migrations` 는 섀도 DB 가 필요하고 `migrate dev` 처럼 스스로 만들지 않는다(`datasource.shadowDatabaseUrl` 요구, 실측).
//        → 같은 로컬 서버에 임시 DB 를 CREATE 하고 LINKLET_SHADOW_DATABASE_URL 로 prisma.config.ts 에 넘긴 뒤 끝나면 DROP 한다
//   2. `prisma migrate dev --name {이름} [--create-only]` (섀도 DB 는 superuser 라 자동 생성·삭제)
//   3. 새로 생긴 폴더에 down.sql 저장
// `--create-only` 는 수동 SQL(뷰·트리거)용 — migration.sql 과 down.sql 양쪽을 손으로 고친 뒤 `pnpm exec prisma migrate dev` 로 적용한다.
//
// 가드: DATABASE_URL_UNPOOLED 가 없거나 로컬(127.0.0.1·localhost·[::1])이 아니면 **항상** 거부. 우회 없음 — 운영·dev 에 migrate dev 를 돌릴 일은 없다(M3).
// 값은 출력하지 않는다. Node 24 가 .mts 를 직접 실행한다(타입 스트리핑) — 새 의존성 없음.

const ROOT = resolve(import.meta.dirname, '..')
const SCHEMA_PATH = 'prisma/schema.prisma'
const MIGRATIONS_DIR = 'prisma/migrations'
const PRISMA_CLI = join(ROOT, 'node_modules', 'prisma', 'build', 'index.js')
const DB_URL_KEY = 'DATABASE_URL_UNPOOLED'
const MIGRATION_NAME_PATTERN = /^[a-z][a-z0-9_]*$/ // M1 snake_case
const EMPTY_DIFF_SCRIPT = '-- This is an empty migration.\n'
const USAGE = 'Usage: pnpm db:migrate <snake_case_name> [--create-only]'

type Options = { name: string; createOnly: boolean }

function log(message: string): void {
  console.error(`[db:migrate] ${message}`)
}

function fail(message: string, exitCode = 1): never {
  log(message)
  process.exit(exitCode)
}

function parseArgs(argv: readonly string[]): Options {
  let name: string | undefined
  let createOnly = false
  for (const arg of argv) {
    if (arg === '--create-only') createOnly = true
    else if (arg.startsWith('-')) fail(`Unknown option ${arg}. ${USAGE}`)
    else if (name === undefined) name = arg
    else fail(`Only one migration name is allowed. ${USAGE}`)
  }
  if (name === undefined) fail(USAGE)
  if (!MIGRATION_NAME_PATTERN.test(name)) {
    fail(`Migration name must be snake_case (a-z, 0-9, _ — decisions/db-migration.md M1). ${USAGE}`)
  }
  return { name, createOnly }
}

/** 로컬 DB 가 아니면 즉시 종료하고, 로컬이면 접속 문자열을 돌려준다. 값은 출력하지 않는다 */
function localDatabaseUrl(): string {
  const value = process.env[DB_URL_KEY]?.trim()
  if (value === undefined || value === '') {
    fail(
      `${DB_URL_KEY} is not set. Put the local Docker connection string in .env.local (see .env.example) and run pnpm db:up.`,
    )
  }
  if (!isLocalDatabaseUrl(value)) {
    fail(
      nonLocalDatabaseMessage(
        DB_URL_KEY,
        'pnpm db:migrate only runs against the local Docker DB (127.0.0.1) and has no override. Applying to dev/production is done by hand (decisions/db-migration.md M3).',
      ),
    )
  }
  return value
}

type PrismaRun = { stdio: 'inherit' | 'pipe'; input?: string; env?: Record<string, string> }

function prisma(args: readonly string[], { stdio, input, env }: PrismaRun) {
  return spawnSync(process.execPath, [PRISMA_CLI, ...args], {
    cwd: ROOT,
    stdio:
      stdio === 'pipe' ? [input === undefined ? 'ignore' : 'pipe', 'pipe', 'inherit'] : 'inherit',
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
}

function listMigrationDirs(): Set<string> {
  return new Set(
    readdirSync(join(ROOT, MIGRATIONS_DIR), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  )
}

/** 같은 로컬 서버에 임시 섀도 DB 를 만들고 그 URL 과 정리 함수를 돌려준다 */
function createShadowDatabase(databaseUrl: string): { url: string; drop: () => void } {
  const name = `linklet_shadow_${Date.now()}`
  const url = new URL(databaseUrl)
  url.pathname = `/${name}`
  const execute = (sql: string, what: string) => {
    const result = prisma(['db', 'execute', '--stdin'], { stdio: 'pipe', input: sql })
    if (result.error) fail(`failed to run prisma: ${result.error.message}`)
    if (result.status !== 0)
      fail(`could not ${what} the temporary shadow database (see output above)`)
  }
  execute(`CREATE DATABASE "${name}";\n`, 'create')
  return {
    url: url.toString(),
    drop: () => execute(`DROP DATABASE IF EXISTS "${name}";\n`, 'drop'),
  }
}

/** 1단계 — down.sql 내용. 비어 있으면(스키마 변화 없음) null */
function generateDownScript(databaseUrl: string): string | null {
  const hasHistory = existsSync(join(ROOT, MIGRATIONS_DIR, 'migration_lock.toml'))
  const target = hasHistory ? ['--to-migrations', MIGRATIONS_DIR] : ['--to-empty']
  log(
    `1/3 generating down.sql (--from-schema ${SCHEMA_PATH} ${target.join(' ')})${hasHistory ? ' using a temporary shadow database' : ' — no migrations yet, diffing against an empty database'}`,
  )
  const shadow = hasHistory ? createShadowDatabase(databaseUrl) : null
  try {
    // --exit-code: 0 = 차이 없음, 2 = 차이 있음, 1 = 오류. --script 는 SQL 만 stdout 으로 낸다(로드 메시지는 stderr, 실측)
    const result = prisma(
      ['migrate', 'diff', '--from-schema', SCHEMA_PATH, ...target, '--script', '--exit-code'],
      { stdio: 'pipe', env: shadow ? { LINKLET_SHADOW_DATABASE_URL: shadow.url } : undefined },
    )
    if (result.error) fail(`failed to run prisma: ${result.error.message}`)
    if (result.status === 0) return null
    if (result.status !== 2)
      fail('prisma migrate diff failed (see output above)', result.status ?? 1)
    const script = result.stdout.trim()
    return script === '' ? null : `${script}\n`
  } finally {
    shadow?.drop()
  }
}

function main(): void {
  const { name, createOnly } = parseArgs(process.argv.slice(2))
  loadEnvFiles(ROOT)
  const databaseUrl = localDatabaseUrl()

  mkdirSync(join(ROOT, MIGRATIONS_DIR), { recursive: true })
  const before = listMigrationDirs()

  let downScript = generateDownScript(databaseUrl)
  if (downScript === null) {
    if (!createOnly) {
      fail(
        'No schema change detected — nothing to migrate. For an empty migration to hand-write SQL, run `pnpm db:migrate <name> --create-only`.',
      )
    }
    downScript = EMPTY_DIFF_SCRIPT
    log('    schema unchanged — down.sql will be a placeholder for your hand-written reverse SQL')
  }

  log(`2/3 prisma migrate dev --name ${name}${createOnly ? ' --create-only' : ''}`)
  const dev = prisma(['migrate', 'dev', '--name', name, ...(createOnly ? ['--create-only'] : [])], {
    stdio: 'inherit',
  })
  if (dev.error) fail(`failed to run prisma: ${dev.error.message}`)
  if (dev.status !== 0)
    fail('prisma migrate dev failed — down.sql was not written', dev.status ?? 1)

  const created = [...listMigrationDirs()].filter((dir) => !before.has(dir))
  const target = created.find((dir) => dir.endsWith(`_${name}`))
  if (target === undefined || created.length !== 1) {
    fail(
      `Expected exactly one new migration folder ending with _${name}, found: ${created.length === 0 ? '(none)' : created.join(', ')}. down.sql was not written.`,
    )
  }

  const downPath = join(MIGRATIONS_DIR, target, 'down.sql')
  writeFileSync(join(ROOT, downPath), downScript)
  log(`3/3 wrote ${downPath}`)
  log(`done: ${join(MIGRATIONS_DIR, target)}/{migration.sql, down.sql}`)
  if (createOnly) {
    log(
      '--create-only: edit migration.sql and down.sql together, then apply with `pnpm exec prisma migrate dev`',
    )
  }
}

main()
