import type { BrowserContext } from '@playwright/test'
import { createHmac } from 'node:crypto'

import { E2E_BETTER_AUTH_SECRET, E2E_SESSION_COOKIE_NAME, E2E_USERS, type E2ERole } from './e2e-env'

// E2E 세션 주입 — 시드된 세션 행(e2e/seed-e2e-users.mts)의 토큰으로 **서명 쿠키를 테스트 코드가 직접 계산**해 브라우저 컨텍스트에 넣는다.
// 근거: decisions/testing.md(E2E 인증 — Google 로그인 자동화 안 함, 시드 세션 주입)·T13, FEATURES F08·F09, 사용자 결정 2026-11-24(제품 코드에 E2E 전용 엔드포인트 없음)
//
// 서명 형식 — better-call 1.4.6 소스(node_modules/.pnpm/better-call@1.4.6*/node_modules/better-call/dist/crypto.mjs signCookieValue,
// dist/context.mjs getSignedCookie, 2026-11-24 확인):
//   쿠키 값 = encodeURIComponent(`${token}.${signature}`), signature = base64(HMAC-SHA256(key = secret, data = token)) — 표준 base64, 패딩 포함.
//   검증은 마지막 `.` 로 나눈 뒤 signature 가 44자·`=` 로 끝나는지 보고(32바이트 HMAC 의 base64 는 정확히 44자, `=` 1개) HMAC 을 대조한다.
//   파서가 값에 decodeURIComponent 를 시도하므로 encodeURIComponent 한 값을 그대로 넣는다.
// 쿠키 이름은 Better Auth 1.7.27 기본 `better-auth.session_token`(baseURL 이 http 라 `__Secure-` 접두사 없음). secret 은 서버(playwright.config.ts)와 같은 모듈의 값.
// 서버는 토큰으로 sessions 행을 찾아 expiresAt 을 보고(e2e-env.ts e2eSessionExpiresAt), users.banned 는 features/auth toRequester 가 거른다.

/** Better Auth(better-call) 가 받아들이는 서명 쿠키 값 */
export function signSessionToken(token: string, secret: string = E2E_BETTER_AUTH_SECRET): string {
  const signature = createHmac('sha256', secret).update(token).digest('base64')
  return encodeURIComponent(`${token}.${signature}`)
}

/**
 * 브라우저 컨텍스트를 역할의 시드 사용자로 로그인 상태로 만든다. `page.goto` 전에 호출한다.
 * `request` fixture 는 컨텍스트와 쿠키를 공유하지 않는다 — API 를 같은 로그인 상태로 부르려면 `context.request`·`page.request` 를 쓴다.
 */
export async function signInAs(context: BrowserContext, role: E2ERole): Promise<void> {
  await context.addCookies([
    {
      name: E2E_SESSION_COOKIE_NAME,
      value: signSessionToken(E2E_USERS[role].sessionToken),
      domain: 'localhost',
      path: '/',
    },
  ])
}
