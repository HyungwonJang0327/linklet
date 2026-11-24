import { notFound } from 'next/navigation'

import { env } from '@/shared/config/env'

// E2E 전용 — admin 구간 layout 의 401(비로그인)·403(일반 사용자) 보호를 확인한다(FEATURES F09·F33, e2e/route-protection.spec.ts). 삭제하지 말 것.
// 관리자 로그인 상태에서는 LINKLET_E2E=1 일 때만 본문, 운영에서는 404. 폴더 이름·force-dynamic 이유는 [locale]/e2e/throw/page.tsx 와 같다.
export const dynamic = 'force-dynamic'

export default function E2EAdminProbePage() {
  if (env.LINKLET_E2E !== '1') notFound()
  return <p data-testid="e2e-admin-probe">e2e: admin probe</p>
}
