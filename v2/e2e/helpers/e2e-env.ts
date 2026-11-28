// E2E 고정값 — playwright.config.ts(서버 env)·e2e/global-setup.ts(시드)·e2e/helpers/session.ts(서명 쿠키)가 **같은 모듈**을 import 한다.
// 서명 쿠키는 서버의 BETTER_AUTH_SECRET 으로 검증되므로 세 곳의 값이 어긋나면 로그인 상태가 만들어지지 않는다.
// 근거: decisions/testing.md(E2E 인증 — 시드 사용자·세션 주입, Google 로그인 자동화 안 함)·T13, FEATURES F08·F09, 사용자 결정 2026-11-24
//
// 전부 더미 — 시크릿 아님. 로컬 Docker 테스트 DB(127.0.0.1:5434 linklet_test)와 E2E 서버(localhost:3002)에서만 쓰인다.
// 실제 사람·실제 주소 금지: 이메일은 예약 TLD `.test`, 이름은 가짜.

/** E2E 서버(production 빌드)의 Better Auth 시크릿. 32자 이상(env 스키마 minLength) */
export const E2E_BETTER_AUTH_SECRET = 'e2e-only-better-auth-secret-not-a-real-secret'

/** Better Auth 1.7.27 기본 세션 쿠키 이름 — baseURL 이 http(localhost) 라 `__Secure-` 접두사 없음(better-auth cookies/index.mjs createCookieGetter) */
export const E2E_SESSION_COOKIE_NAME = 'better-auth.session_token'

export type E2ERole = 'user' | 'admin'

export type E2EUser = {
  /** users.id — 고정 UUID. prisma/seed.mts 의 seedId 규칙, dev 시드(group 1~5)와 겹치지 않게 group 9 */
  id: string
  name: string
  email: string
  role: E2ERole
  /** sessions.id — 고정 UUID */
  sessionId: string
  /** sessions.token — 쿠키 값의 서명 전 부분. 고정 문자열(실제 세션 토큰이 아니다) */
  sessionToken: string
}

/** prisma/seed.mts 와 같은 규칙: `00000000-0000-7000-8000-{group 4자리}{n 8자리}` — 실제 uuid(7) 생성값과 겹치지 않는 0 영역 */
function seedId(group: number, n: number): string {
  return `00000000-0000-7000-8000-${String(group).padStart(4, '0')}${String(n).padStart(8, '0')}`
}

const E2E_GROUP = 9

/** 역할별 E2E 사용자 — users 2행·sessions 2행을 global-setup 이 upsert 한다 */
export const E2E_USERS: Record<E2ERole, E2EUser> = {
  user: {
    id: seedId(E2E_GROUP, 1),
    name: 'E2E User',
    email: 'e2e-user@linklet.test',
    role: 'user',
    sessionId: seedId(E2E_GROUP, 101),
    sessionToken: 'e2e-session-token-user-not-a-real-session',
  },
  admin: {
    id: seedId(E2E_GROUP, 2),
    name: 'E2E Admin',
    email: 'e2e-admin@linklet.test',
    role: 'admin',
    sessionId: seedId(E2E_GROUP, 102),
    sessionToken: 'e2e-session-token-admin-not-a-real-session',
  },
}

/**
 * 시드 세션의 만료 시각 — 지금 + 3일(= 서버 session.expiresIn). Better Auth 는 `expiresAt - expiresIn + updateAge <= now` 면 세션을 갱신(DB 쓰기 +
 * Set-Cookie)하므로, 방금 만든 세션처럼 수명을 꽉 채워 두면 하루 동안은 갱신 없이 읽기만 한다(better-auth api/routes/session.mjs 1.7.27 확인)
 */
export function e2eSessionExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
}
