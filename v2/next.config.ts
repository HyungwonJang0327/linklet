import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 전역 404 를 app/global-not-found.tsx 로 — FEATURES F06, error-handling E4 "F06 구현 결정"(사용자 결정 2026-11-19).
    // 16.3 실험 플래그. Next 업그레이드 때 플래그 이름·안정화 여부를 확인한다(decisions/dependencies.md 갱신 절차).
    // 2026-11-19 실측: 16.3.6 Turbopack 은 플래그 없이도 파일을 쓴다 — 문서 규약대로 켜 둔다
    globalNotFound: true,
  },
}

// Sentry 빌드 플러그인 — FEATURES F06, decisions/error-handling.md E5 (Sentry Next.js manual setup 2026-11-23 확인).
// SDK 초기화는 src/instrumentation*.ts·src/sentry.*.config.ts. 여기는 빌드 쪽만:
// - 소스맵 업로드는 SENTRY_AUTH_TOKEN 이 있을 때만(운영 배포 env). 없으면 끈다 — 로컬·CI 빌드가 조용하고 결정적이다.
//   업로드를 켤 때 org·project 슬러그와 authToken 을 같이 넣는다(todo/user-todo.md)
// - telemetry 끔(플러그인이 Sentry 로 보내는 사용 통계), silent 는 CI 에서만 끔
// - bundleSizeOptimizations: 쓰지 않는 트레이싱·리플레이 코드와 debug 문을 트리 셰이킹 — 측정값은 decisions/dependencies.md
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
})
