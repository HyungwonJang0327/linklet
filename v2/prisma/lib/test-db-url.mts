// 통합 테스트 DB 접속 문자열 조립 — vitest.setup.ts(테스트 프로세스에서 env 덮기)와 vitest.global-setup.mts(메인 프로세스에서 migrate deploy)가 공유하는 순수 모듈.
// 둘은 서로 다른 컨텍스트라 env 덮기가 공유되지 않으므로, 같은 함수로 같은 값을 만들어야 "마이그레이션을 적용한 DB" 와 "테스트가 붙는 DB" 가 일치한다.
// 근거: decisions/testing.md T5(테스트마다 깨끗한 DB)·T10(별도 키 없이 DATABASE_URL 덮기), FEATURES F02
// 값은 docker-compose.yml 의 더미 고정값(linklet/linklet, 시크릿 아님). 포트만 LINKLET_TEST_DB_PORT 로 바꿀 수 있다(compose 와 같은 키).
// 이 모듈은 process.env 를 읽지 않는다 — 호출자가 값을 넘긴다(ESLint process.env 규칙과 무관하게 단위 테스트 가능).

export const TEST_DB_HOST = '127.0.0.1'
export const TEST_DB_DEFAULT_PORT = '5434'
export const TEST_DB_NAME = 'linklet_test'

/** compose 더미 사용자·비밀번호 (docker-compose.yml `db-test`). 시크릿이 아니다 */
const TEST_DB_USER = 'linklet'
const TEST_DB_PASSWORD = 'linklet'

/** `LINKLET_TEST_DB_PORT` 원문을 포트 문자열로. 비어 있으면 기본 5434, 숫자가 아니면 throw */
export function resolveTestDatabasePort(raw: string | undefined): string {
  const port = raw?.trim() || TEST_DB_DEFAULT_PORT
  if (!/^\d{1,5}$/.test(port) || Number(port) === 0 || Number(port) > 65535) {
    throw new Error('LINKLET_TEST_DB_PORT must be a port number (1-65535)')
  }
  return port
}

/** 테스트 DB 접속 문자열. `rawPort` 는 `LINKLET_TEST_DB_PORT` 원문(없으면 기본 포트) */
export function testDatabaseUrl(rawPort: string | undefined): string {
  const port = resolveTestDatabasePort(rawPort)
  return `postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${port}/${TEST_DB_NAME}`
}

/** TCP 프로브용 host·port — testDatabaseUrl 과 같은 입력에서 같은 대상을 가리킨다 */
export function testDatabaseTarget(rawPort: string | undefined): { host: string; port: number } {
  return { host: TEST_DB_HOST, port: Number(resolveTestDatabasePort(rawPort)) }
}
