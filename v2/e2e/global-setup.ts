import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

import { assertLocalDatabaseUrl } from '../prisma/lib/local-db.mts'
import { canConnect } from '../prisma/lib/tcp-probe.mts'
import { applyTestDatabaseMigrations } from '../prisma/lib/test-db-migrate.mts'
import { testDatabaseTarget, testDatabaseUrl } from '../prisma/lib/test-db-url.mts'

// Playwright globalSetup — 테스트 전 메인 프로세스에서 1회. E2E 서버가 붙는 테스트 DB 를 준비한다(playwright.config.ts `globalSetup`).
// 근거: decisions/testing.md T13(E2E 서버 DB = 통합 테스트 DB 127.0.0.1:5434/linklet_test 재사용, 사용자 결정 2026-11-24)·T5, FEATURES F08·F09
//
// 순서: 로컬 가드 → TCP 프로브(닿지 않으면 **실패** — E2E 는 DB 가 필수라 skip 하지 않는다. CI 도 service container 로 같은 동작) →
//       `prisma migrate deploy`(prisma/lib/test-db-migrate.mts, Vitest 와 공유) → E2E 사용자 2행·세션 2행 upsert(e2e/seed-e2e-users.mts)
// - 멱등: 시드는 고정 UUID 로 upsert 한다(prisma/seed.mts 와 같은 방식). TRUNCATE 하지 않는다 — 두 번 연속 돌려도 행이 늘지 않는다.
//   Vitest 통합 테스트(beforeEach TRUNCATE)와 **동시에** 돌리면 시드 행이 지워질 수 있다 → 같은 DB 라 동시 실행은 하지 않는다(v2/README.md)
// - 세션은 DB 행만 만든다. 서명 쿠키는 테스트 코드(e2e/helpers/session.ts)가 같은 secret 으로 계산한다 — 제품 코드에 E2E 전용 엔드포인트 없음
// - 시드는 별도 Node 프로세스: 생성 Prisma 클라이언트(ESM, import.meta)를 Playwright 의 CommonJS 변환 안에서 import 할 수 없어서(2026-11-25 실측)
//   migrate deploy 와 같은 방식으로 `node e2e/seed-e2e-users.mts` 를 spawn 한다. 접속 문자열은 env 로만 넘기고 어디에도 출력하지 않는다
// - Playwright 는 package.json 에 type:module 이 없으면 이 파일을 CommonJS 로 변환한다 → import.meta 대신 __dirname

const ROOT = resolve(__dirname, '..')
const SEED_SCRIPT = join(__dirname, 'seed-e2e-users.mts')
const DB_URL_KEYS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const

function log(message: string): void {
  console.error(`[e2e global-setup] ${message}`)
}

function seedE2EUsers(databaseUrl: string): void {
  const result = spawnSync(
    process.execPath,
    ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', SEED_SCRIPT],
    {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, DATABASE_URL_UNPOOLED: databaseUrl },
    },
  )
  if (result.error) {
    throw new Error(`failed to run the E2E seed script: ${result.error.message}`)
  }
  // 시드 스크립트의 출력은 행 수·분류된 실패 사유만(접속 정보 없음) — 그대로 보여준다
  process.stderr.write(result.stderr)
  if (result.status !== 0) {
    throw new Error(`E2E seed failed (exit ${result.status ?? 'unknown'}). See output above.`)
  }
}

export default async function globalSetup(): Promise<void> {
  for (const key of DB_URL_KEYS) {
    assertLocalDatabaseUrl(key, process.env[key], {
      hint: 'Refusing to run E2E against it. Unset it or point it at 127.0.0.1.',
    })
  }

  const rawPort = process.env.LINKLET_TEST_DB_PORT
  const target = testDatabaseTarget(rawPort)
  if (!(await canConnect(target))) {
    throw new Error(
      `E2E needs the local test DB but nothing is listening at ${target.host}:${target.port}. Run \`pnpm db:test:up\` first (CI: service container missing or not ready).`,
    )
  }

  const databaseUrl = testDatabaseUrl(rawPort)
  applyTestDatabaseMigrations({ root: ROOT, databaseUrl, baseEnv: process.env })
  seedE2EUsers(databaseUrl)
  log(`test DB at ${target.host}:${target.port} — migrations applied, E2E users seeded`)
}
