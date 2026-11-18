import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 전역 404 를 app/global-not-found.tsx 로 — FEATURES F06, error-handling E4 "F06 구현 결정"(사용자 결정 2026-11-19).
    // 16.3 실험 플래그. Next 업그레이드 때 플래그 이름·안정화 여부를 확인한다(decisions/dependencies.md 갱신 절차).
    // 2026-11-19 실측: 16.3.6 Turbopack 은 플래그 없이도 파일을 쓴다 — 문서 규약대로 켜 둔다
    globalNotFound: true,
  },
}

export default nextConfig
