import { unauthorized } from 'next/navigation'
import type { ReactNode } from 'react'

import { getRequester } from '@/features/auth'

// (app) 구간 — 로그인 필요 화면(위시리스트·설정·문의, url-design U2). FEATURES F09 라우트 보호, decisions/authorization.md P7.
// 비로그인(만료·위조 쿠키 포함)이면 unauthorized() → [locale]/unauthorized.tsx 가 401 로 "로그인이 필요해요" + Google 버튼을 그린다.
// URL 은 그대로라 로그인 뒤 원래 자리로 돌아온다(사용자 결정 2026-11-23 — 리다이렉트 대신 제자리 401).
// proxy 에서 쿠키만 보고 보내지 않는다 — 판정은 여기 한 곳(쿠키 없으면 getSession 이 DB 없이 null). 데이터 권한은 서비스가 F10 으로 따로 본다(A3).
// unauthorized() 는 root layout 에서 못 부른다(unauthorized.md "Good to know") — 그래서 root([locale]/layout) 가 아니라 이 구간 layout 이 맡는다.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const requester = await getRequester()
  if (requester.kind === 'anonymous') unauthorized()
  return children
}
