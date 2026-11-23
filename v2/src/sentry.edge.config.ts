import * as Sentry from '@sentry/nextjs'

import {
  dropIntegrations,
  scrubBreadcrumb,
  scrubEvent,
  SENTRY_DATA_COLLECTION,
} from '@/shared/lib/sentry-scrub'

// Edge 런타임 Sentry 초기화 — instrumentation.ts register() 가 NEXT_RUNTIME=edge 일 때 동적 import 한다.
// 근거: Sentry Next.js manual setup(Turbopack) 2026-11-23 확인, decisions/error-handling.md E5
// 지금 v2 에 edge 런타임 라우트는 없다(proxy.ts 도 Node). Sentry 가 요구하는 세 파일 규약을 맞추려고 둔다.
// 서버 env 모듈(부팅 검증·실패 시 종료)은 Node 전용이라 여기서는 process.env 를 직접 읽는다(ESLint 예외: 부팅 진입점). 값은 출력하지 않는다

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  dataCollection: SENTRY_DATA_COLLECTION,
  integrations: dropIntegrations,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
})
