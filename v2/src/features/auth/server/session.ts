import 'server-only'

import { getSessionCookie } from 'better-auth/cookies'

import { auth, type AuthSession } from '@/server/auth'
import { logger } from '@/server/logger'

// 서버 세션 조회 — FEATURES F08 (F09 라우트 보호·F10 권한 판정이 이 함수를 쓴다). 호출자는 `await headers()` 를 넘긴다(Next 16 — 요청 API 는 비동기).
// - 세션 쿠키가 없으면 DB 에 가지 않는다(getSessionCookie 는 쿠키 존재만 본다 — 검증은 아래 auth.api.getSession 이 DB 로 한다)
// - 조회 실패(DB 다운 등)는 비로그인으로 취급하고 unexpected 로 기록한다 — 세션 조회 때문에 공개 화면이 깨지면 안 된다.
//   로그인 필요 화면의 "비로그인 → 로그인으로" 처리는 F09 가 결정한다
export async function getSession(requestHeaders: Headers): Promise<AuthSession | null> {
  if (getSessionCookie(requestHeaders) === null) return null
  try {
    return await auth.api.getSession({ headers: requestHeaders })
  } catch (error) {
    logger.unexpected(error, { route: 'auth.getSession' })
    return null
  }
}
