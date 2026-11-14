// 로컬 DB 판정 — prisma.config.ts(CLI 가드)·scripts/db-migrate.mts(래퍼)·vitest.setup.ts(테스트 DB 가드)·prisma/seed.ts(시드 가드)가 공유하는 순수 모듈.
// 근거: decisions/db-migration.md M3(운영 적용은 사용자 직접), decisions/testing.md T10, todo/migrator-todo.md(CLI 접속 문자열 환경 가드), FEATURES F02
// - 이 파일은 Node(타입 스트리핑)·Prisma CLI 로더·Vitest 가 모두 직접 import 한다 → `server-only`·`@/` alias·process.env 를 쓰지 않는다
// - 어떤 함수도 접속 문자열 값을 메시지에 넣지 않는다. 키 이름·판정·우회 방법만

/** 로컬로 인정하는 호스트. WHATWG URL 은 IPv6 hostname 을 대괄호째 돌려준다 */
export const LOCAL_DB_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', 'localhost', '[::1]'])

/**
 * 접속 문자열의 호스트가 로컬인가. 해석 불가·호스트 없음(unix 소켓 등)·그 외 호스트는 모두 false — 로컬임을 확인할 수 없으면 거부한다.
 * postgresql: 은 non-special scheme 이라 URL 이 호스트를 소문자화·IPv4 정규화하지 않는다 → 소문자 비교만 하고 `127.1` 같은 축약형은 거부한다.
 */
export function isLocalDatabaseUrl(value: string): boolean {
  try {
    return LOCAL_DB_HOSTS.has(new URL(value).hostname.toLowerCase())
  } catch {
    return false
  }
}

export type LocalDatabaseGuardOptions = {
  /** 비로컬이어도 통과시킬지 — prisma.config.ts 만 `LINKLET_ALLOW_REMOTE_DB=1` 로 켠다. 래퍼·테스트는 항상 false */
  allowRemote?: boolean
  /** 메시지 끝에 붙는 다음 행동 안내 (값을 포함하지 않는다) */
  hint: string
}

/**
 * `key` 에 들어 있는 접속 문자열이 비로컬이면 throw. 값이 없거나 빈 문자열이면 검사할 것이 없으니 통과한다
 * (CI `prisma generate` 처럼 DB 없이 돌아야 하는 경우). 메시지에 값은 들어가지 않는다.
 */
export function assertLocalDatabaseUrl(
  key: string,
  value: string | undefined,
  options: LocalDatabaseGuardOptions,
): void {
  const current = value?.trim()
  if (current === undefined || current === '') return
  if (isLocalDatabaseUrl(current)) return
  if (options.allowRemote === true) return
  throw new Error(nonLocalDatabaseMessage(key, options.hint))
}

/** 거부 메시지 — 키 이름·판정·안내만. 값은 절대 넣지 않는다 */
export function nonLocalDatabaseMessage(key: string, hint: string): string {
  return `${key} points to a non-local database host (value not shown). ${hint}`
}

/**
 * Prisma CLI 명령 중 DB 에 붙지 않는 것. 이 목록 밖의 명령(migrate·db·studio·알 수 없는 것)은 모두 DB 접속으로 간주해 가드한다(fail-closed).
 * `generate` 가 여기 있는 이유: Vercel·CI 의 `postinstall: prisma generate` 는 운영 env(원격 URL)와 함께 돌지만 DB 에 붙지 않는다.
 */
export const DB_FREE_PRISMA_COMMANDS: ReadonlySet<string> = new Set([
  'generate',
  'validate',
  'format',
  'version',
  'init',
  'debug',
])

/**
 * Prisma CLI 인자(`process.argv.slice(2)`)를 보고 DB 접속 가드가 필요한 명령인지 판정.
 * 첫 번째 위치 인자가 명령 이름이다(`migrate dev`, `db execute`, `generate`). 위치 인자가 없으면(`--help`·`--version`) DB 에 붙지 않는다.
 * 실측(2026-11-14): `pnpm exec prisma generate --config x` 의 process.argv 는 [node, .../prisma/build/index.js, 'generate', '--config', 'x'].
 */
export function prismaCommandNeedsDatabase(cliArgs: readonly string[]): boolean {
  let skipValue = false
  for (const arg of cliArgs) {
    if (skipValue) {
      skipValue = false
      continue
    }
    if (arg.startsWith('-')) {
      // 값을 따로 받는 전역 옵션(`--config path`)이 명령 앞에 올 수 있다. `--config=path` 는 한 토큰이라 건너뛸 값이 없다
      if (VALUE_OPTIONS.has(arg)) skipValue = true
      continue
    }
    return !DB_FREE_PRISMA_COMMANDS.has(arg)
  }
  return false
}

/** 다음 토큰을 값으로 받는 Prisma CLI 옵션 */
const VALUE_OPTIONS: ReadonlySet<string> = new Set(['--config', '--schema', '--url'])
