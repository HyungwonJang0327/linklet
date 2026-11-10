import type { BrowserContext } from '@playwright/test'

// 기준선 E2E 로그인 — 시드한 `sessions` 행의 토큰을 NextAuth 세션 쿠키로 주입한다 (decisions/testing.md T8·T9)
// - 기존 앱은 `session.strategy: 'database'`(lib/auth-config.ts)라 쿠키 값이 곧 `sessions.sessionToken` 이고,
//   PrismaAdapter 가 그 값으로 `findUnique` 해 사용자를 돌려준다 (실측: /api/auth/session 200 + user.id)
// - 쿠키 이름: 기준선은 http://localhost 라 `useSecureCookies` 가 꺼져 `next-auth.session-token` (운영 https 는 `__Secure-` 접두사)
// - 실제 Google 로그인은 자동화하지 않는다 (FEATURES F08 수동 확인)

export const SESSION_COOKIE_NAME = 'next-auth.session-token'

// seed.sql 의 세션 토큰. 값은 더미 고정값이며 시크릿이 아니다
export const SEED_SESSIONS = {
  // baseline-user — 위시리스트 2개(공개·비공개) 소유. 읽기 전용 시나리오(목록·한도)에만 쓴다
  tester: 'baseline-session-token',
  // baseline-editor — 위시리스트 0개. 생성·수정·삭제 시나리오 전용 (public.spec.ts 가 단언하는 시드 행을 건드리지 않기 위해)
  editor: 'baseline-editor-session-token',
} as const

export async function signInWithSeedSession(
  context: BrowserContext,
  token: (typeof SEED_SESSIONS)[keyof typeof SEED_SESSIONS],
): Promise<void> {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

// `request` fixture 나 `playwright.request.newContext` 로 API 를 직접 칠 때 쓰는 헤더
export function sessionHeaders(
  token: (typeof SEED_SESSIONS)[keyof typeof SEED_SESSIONS],
): Record<string, string> {
  return { cookie: `${SESSION_COOKIE_NAME}=${token}` }
}
