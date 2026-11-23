import { notFound } from 'next/navigation'

import { env } from '@/shared/config/env'

// E2E 전용 — (app) 구간 layout 의 로그인 보호를 확인한다(FEATURES F09, e2e/route-protection.spec.ts). 삭제하지 말 것.
// 비로그인은 layout 이 먼저 401 을 그려 여기까지 오지 않는다. 로그인 상태에서는 LINKLET_E2E=1 일 때만 본문, 운영에서는 404.
// 폴더 이름 e2e 인 이유·force-dynamic 이유는 [locale]/e2e/throw/page.tsx 와 같다.
export const dynamic = 'force-dynamic'

export default function E2EProtectedPage() {
  if (env.LINKLET_E2E !== '1') notFound()
  return <p data-testid="e2e-protected">e2e: protected</p>
}
