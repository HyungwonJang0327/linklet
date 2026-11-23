import * as Sentry from '@sentry/nextjs'

import { clientEnv } from '@/shared/config/env.client'
import {
  dropIntegrations,
  scrubBreadcrumb,
  scrubEvent,
  SENTRY_DATA_COLLECTION,
} from '@/shared/lib/sentry-scrub'

// 브라우저 Sentry 초기화 — Next 16 instrumentation-client (앱이 인터랙티브해지기 전에 1회 실행).
// 근거: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md,
//       Sentry Next.js manual setup(Turbopack) 2026-11-23 확인, decisions/error-handling.md E5, FEATURES F06
// - DSN 은 검증된 clientEnv 에서. 없으면 SDK 가 아무것도 보내지 않는다(CI 빌드·E2E·DSN 없는 로컬) — 분기 없이 같은 코드가 돈다
// - 개인정보: dataCollection 으로 수집을 끄고 beforeSend/beforeBreadcrumb 로 한 번 더 지운다 (shared/lib/sentry-scrub)
// - 트레이싱·리플레이·피드백 없음 — Error Monitoring 만 (E5 갱신 2026-11-23). onRouterTransitionStart 는 트레이싱용이라 export 하지 않는다
// - environment 는 NODE_ENV — 로컬(development)과 운영(production) 이벤트를 Sentry 에서 구분한다. 빌드 시 인라인되는 값이라 process.env 직접 참조(ESLint 예외: 부팅 진입점)

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  dataCollection: SENTRY_DATA_COLLECTION,
  integrations: dropIntegrations,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
})
