// Vitest 공통 setup — 모든 테스트 파일 앞에서 1회 실행 (vitest.config.mts setupFiles)
// 통합 테스트 DB 는 별도 키 없이 `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 를 로컬 테스트 DB 로 덮는다 (decisions/testing.md T10, 사용자 결정 2026-11-14).
// 값은 docker-compose.yml 의 더미 고정값(시크릿 아님). 포트는 compose 와 같은 LINKLET_TEST_DB_PORT 로 바꿀 수 있다.
// 가드: 덮기 전에 이미 들어 있는 접속 문자열의 호스트가 로컬이 아니면 즉시 실패 — 테스트가 dev·운영 DB 에 붙는 일을 막는다.
// 어떤 경우에도 값은 출력하지 않는다(키 이름·판정만). 이 파일은 ESLint process.env 금지 규칙의 예외 목록에 있다.

const LOCAL_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', 'localhost', '[::1]'])
const DB_URL_KEYS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const

function isLocalDatabaseUrl(value: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname)
  } catch {
    return false // 해석 불가 — 로컬임을 확인할 수 없으니 거부
  }
}

for (const key of DB_URL_KEYS) {
  const current = process.env[key]?.trim()
  if (current !== undefined && current !== '' && !isLocalDatabaseUrl(current)) {
    throw new Error(
      `${key} is set to a non-local database; refusing to run tests against it (value not shown). Unset it or point it at 127.0.0.1.`,
    )
  }
}

const port = process.env.LINKLET_TEST_DB_PORT?.trim() || '5434'
if (!/^\d{1,5}$/.test(port)) throw new Error('LINKLET_TEST_DB_PORT must be a port number')

const testDatabaseUrl = `postgresql://linklet:linklet@127.0.0.1:${port}/linklet_test`

// NODE_ENV 는 Next 타입에서 readonly 라 Object.assign 으로 넣는다. Vitest 가 이미 'test' 로 두지만 셸 값에 흔들리지 않게 고정한다
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl,
  DATABASE_URL_UNPOOLED: testDatabaseUrl,
  // env 스키마의 필수 키 — 테스트는 자기 호출을 하지 않으므로 더미 http URL
  NEXT_PUBLIC_APP_URL: 'http://linklet.test',
})
