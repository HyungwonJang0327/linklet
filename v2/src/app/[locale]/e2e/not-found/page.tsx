import { notFound } from 'next/navigation'

// E2E 전용 — 항상 notFound() 를 던져 [locale]/not-found.tsx(언어별 404, root layout 안)를 확인한다 (FEATURES F06).
// 매치되지 않는 URL(/ko/없는-경로)은 experimental.globalNotFound 가 라우팅 단계에서 global-not-found 로 보내므로(2026-11-19 실측),
// [locale]/not-found.tsx 는 페이지가 notFound() 를 호출할 때만 그려진다 — 그 경로를 고정하는 라우트. env 가드가 없어도
// 운영에서 똑같이 404 라 해롭지 않다. 삭제하지 말 것 — e2e/error-boundaries.spec.ts 가 쓴다.

export default function E2ENotFoundPage(): never {
  notFound()
}
