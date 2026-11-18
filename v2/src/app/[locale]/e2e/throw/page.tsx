import { notFound } from 'next/navigation'

import { env } from '@/shared/config/env'

// E2E 전용 — 일부러 렌더 에러를 던져 [locale]/error.tsx 경계를 확인한다 (FEATURES F06, error-handling E4 "F06 구현 결정").
// 운영에는 LINKLET_E2E 가 없어 404. 삭제하지 말 것 — e2e/error-boundaries.spec.ts 가 쓴다.
// 폴더 이름이 `e2e` 인 이유: `_` 로 시작하는 폴더(`__e2e`)는 Next private folder 라 라우팅에서 빠진다(project-structure.md "Private folders").
// 요청 때 렌더한다(force-dynamic): 정적 생성하면 LINKLET_E2E=1 인 E2E 빌드에서 prerender 가 throw 해 빌드가 깨진다.

export const dynamic = 'force-dynamic'

export default function E2EThrowPage(): never {
  if (env.LINKLET_E2E === '1') throw new Error('e2e: intentional render error')
  notFound()
}
