import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { toRequester, type Requester } from './authorization'
import { getSession } from './session'

// 현재 요청의 요청자 — FEATURES F09·F10. Server Component(레이아웃·페이지)·Route Handler 가 쓴다.
// 세션 쿠키 → DB 세션(getSession) → 요청자(toRequester: 차단 중이면 anonymous). React cache 로 한 렌더 패스에서 한 번만 읽는다
// (Next 인증 가이드 "Data Access Layer" 의 verifySession 패턴). 판정은 호출자가 F10 함수로 한다 — 이 함수는 판정하지 않는다.
export const getRequester = cache(async (): Promise<Requester> => {
  const session = await getSession(await headers())
  return toRequester(session?.user ?? null)
})
