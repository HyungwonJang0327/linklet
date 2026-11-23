import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs'

import { redact } from './redact'

// Sentry 이벤트 개인정보 제거 — 순수 함수만. 클라이언트·서버·edge 의 Sentry.init 이 같은 함수를 beforeSend·beforeBreadcrumb 에 건다.
// 근거: decisions/error-handling.md E5(sendDefaultPii 끔·요청 본문/쿠키/Authorization 제거), CLAUDE.md §4-2 로그 규약,
//       security-reviewer 요구 2026-11-12(captureException 전에 exception.values[].value·breadcrumbs·request 에 redact() 적용, console 통합 끔)
// 불변 규칙: 이 파일의 함수는 **절대 throw 하지 않는다**. 스크럽에 실패한 이벤트는 보내지 않는다(null) — 원본이 밖으로 나가지 않는 쪽을 택한다.
//
// 두 겹으로 막는다:
//   1. SDK 수집 자체를 끈다 — `SENTRY_DATA_COLLECTION`(IP·쿠키·헤더·본문·쿼리) + `Console`·`RequestData` 통합 제거.
//      v11 은 `sendDefaultPii` 가 없고 `dataCollection` 이 그 자리다(@sentry/core 11.16.0 types/datacollection.d.ts).
//   2. 그래도 들어온 값은 여기서 지운다 — SDK 기본값이 바뀌거나 통합이 추가돼도 beforeSend 가 마지막 문이다.
//
// 남기는 것: 에러 이름·마스킹한 메시지·스택 프레임(파일 경로·줄)·요청 URL(쿼리 제거)·메서드·태그(로거가 붙이는 route·requestId 등 내부 식별자)·
//           사용자 내부 ID(`user.id`) — CLAUDE.md "사용자 식별은 내부 ID만". 그 외 user 필드(email·username·ip_address·geo)는 전부 지운다.

/** SDK 자동 수집 끄기 — Sentry.init 의 `dataCollection` 에 그대로 넘긴다 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [] as never[], // HttpBodyCollectionTarget[] — 빈 배열 = 수집 안 함. 타입은 @sentry/core 것이라 직접 import 하지 않는다
  urlQueryParams: false,
}

/**
 * 기본 통합 중 뺄 것 — `integrations: (defaults) => dropIntegrations(defaults)`.
 * - Console: console 출력을 breadcrumb 으로 복사한다 — 서버 구조화 로그(server/logger)가 이미 마스킹해 콘솔에 쓰는 줄이 이벤트에 이중으로 실린다
 * - RequestData: 요청 헤더·쿠키·본문·쿼리를 이벤트에 붙인다(서버) — dataCollection 으로도 끄지만 통합 자체를 뺀다
 * - BrowserTracing: 트레이싱은 쓰지 않는다(error-handling E5 갱신 2026-11-23 — 사용자가 프로젝트 생성 때 Error Monitoring 만 선택)
 */
export const DROPPED_INTEGRATIONS: ReadonlySet<string> = new Set([
  'Console',
  'RequestData',
  'BrowserTracing',
])

/** Integration 타입은 @sentry/core 에만 있어(직접 의존 아님) name 만 보는 구조적 타입으로 받는다 */
export function dropIntegrations<T extends { name: string }>(defaults: T[]): T[] {
  return defaults.filter((integration) => !DROPPED_INTEGRATIONS.has(integration.name))
}

/** 문자열이면 마스킹, 아니면 그대로(숫자·불리언). 객체·배열은 버린다 — 중첩 구조 안의 값은 패턴으로 못 믿는다 */
function scrubScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string') return redact(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return undefined
}

function scrubRecord(
  record: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!record) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    const scrubbed = scrubScalar(value)
    if (scrubbed !== undefined) out[key] = scrubbed
  }
  return out
}

/**
 * breadcrumb — console 은 버린다(이중 전송), 나머지는 message 와 data 의 문자열 값을 마스킹한다.
 * fetch/xhr breadcrumb 의 data 는 url·method·status_code 같은 스칼라뿐이라 scrubRecord 로 충분하다.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  try {
    if (breadcrumb.category === 'console') return null
    const out: Breadcrumb = { ...breadcrumb }
    if (typeof out.message === 'string') out.message = redact(out.message)
    if (out.data) out.data = scrubRecord(out.data)
    return out
  } catch {
    return null
  }
}

/**
 * 에러 이벤트 — beforeSend. 반환값이 null 이면 SDK 가 이벤트를 버린다.
 * - request: url(쿼리 제거)·method 만 남긴다. headers·cookies·data·query_string·env 삭제
 * - user: id 만. 없으면 user 자체를 지운다
 * - exception.values[].value / message: redact
 * - breadcrumbs: scrubBreadcrumb (console 제거)
 * - extra: 로거는 쓰지 않는다 — 어떤 통합이 넣든 통째로 지운다(중첩 구조라 패턴으로 못 믿는다)
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  try {
    const out: ErrorEvent = { ...event }

    if (out.request) {
      const { url, method } = out.request
      out.request = {
        ...(typeof url === 'string' ? { url: redact(url) } : {}),
        ...(typeof method === 'string' ? { method } : {}),
      }
    }

    if (out.user) {
      const id = out.user.id
      if (typeof id === 'string' || typeof id === 'number') out.user = { id }
      else delete out.user
    }

    if (out.exception?.values) {
      out.exception = {
        ...out.exception,
        values: out.exception.values.map((value) =>
          typeof value.value === 'string' ? { ...value, value: redact(value.value) } : value,
        ),
      }
    }

    if (typeof out.message === 'string') out.message = redact(out.message)

    if (out.breadcrumbs) {
      out.breadcrumbs = out.breadcrumbs
        .map(scrubBreadcrumb)
        .filter((crumb): crumb is Breadcrumb => crumb !== null)
    }

    delete out.extra

    return out
  } catch {
    return null
  }
}
