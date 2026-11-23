import * as Sentry from '@sentry/nextjs'

import { env } from '@/shared/config/env'
import {
  dropIntegrations,
  scrubBreadcrumb,
  scrubEvent,
  SENTRY_DATA_COLLECTION,
} from '@/shared/lib/sentry-scrub'

// Node 런타임 Sentry 초기화 — instrumentation.ts register() 가 env 검증을 통과한 뒤 동적 import 한다.
// 근거: Sentry Next.js manual setup(Turbopack) 2026-11-23 확인, decisions/error-handling.md E5, FEATURES F06
// - DSN·NODE_ENV 는 검증된 env 에서. DSN 이 없으면 SDK 가 아무것도 보내지 않는다(CI 빌드·E2E·DSN 없는 로컬)
// - 개인정보: dataCollection 으로 수집을 끄고(IP·쿠키·헤더·본문·쿼리) Console·RequestData 통합을 빼고, beforeSend/beforeBreadcrumb 로 한 번 더 지운다
// - 전송 지점: server/logger unexpected()(Route Handler 래퍼 경유) + instrumentation.ts onRequestError(Next 가 잡은 서버 에러)
// - 트레이싱 없음 — Error Monitoring 만 (E5 갱신 2026-11-23)

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.NODE_ENV,
  dataCollection: SENTRY_DATA_COLLECTION,
  integrations: dropIntegrations,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
})
