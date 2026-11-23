import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/server/auth'

// Better Auth 엔드포인트 전부 — FEATURES F08, decisions/url-design.md `/api/auth/[...all]`.
// 응답 형태는 Better Auth 규약(공용 응답 헬퍼·createHandler 를 거치지 않는다 — 클라이언트 SDK 가 이 형태를 기대한다. api-response R1 의 예외로 기록).
// Google 콜백 경로: /api/auth/callback/google (Google Cloud 콘솔 리디렉션 URI 와 같아야 한다)
export const { GET, POST } = toNextJsHandler(auth)
