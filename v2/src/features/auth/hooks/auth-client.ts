import { createAuthClient } from 'better-auth/react'

// Better Auth 클라이언트 — FEATURES F08. 같은 origin 의 /api/auth/* 를 호출하므로 baseURL 을 주지 않는다(better-auth Next.js 통합 문서).
// 컴포넌트는 raw fetch 대신 이 객체(signIn.social·signOut·useSession)를 쓴다(CLAUDE.md §4 상태 관리). 서버 코드는 server/auth 의 auth.api 를 쓴다.
export const authClient = createAuthClient()
