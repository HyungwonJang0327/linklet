import { forbidden, unauthorized } from 'next/navigation'
import type { ReactNode } from 'react'

import { getRequester, isAdmin } from '@/features/auth'

// admin 구간 — FEATURES F09(라우트 보호)·F33(관리자 접근 제어는 서버에서). decisions/authorization.md P7.
// 비로그인 → 401(unauthorized.tsx, 로그인 안내). 로그인했지만 관리자가 아니면 → 403(forbidden.tsx) — 사용자 결정 2026-11-23:
// 관리자 영역은 숨길 대상이 아니고(경로가 자명), API 의 requireAdmin 이 403 이라 화면도 403 으로 맞춘다. 기존 앱은 클라이언트에서 설정으로 보냈다(F33 비고).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const requester = await getRequester()
  if (requester.kind === 'anonymous') unauthorized()
  if (!isAdmin(requester)) forbidden()
  return children
}
