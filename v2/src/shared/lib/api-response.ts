import 'server-only'

import { NextResponse } from 'next/server'

import { AppError, type ApiErrorBody, isAppError } from './api-error'
import { formatLogLine, summarizeError } from './log-format'

// 응답 헬퍼 — decisions/api-response.md R1~R5, error-handling.md E1·E2·E5
// 응답 JSON 은 이 파일의 함수로만 만든다. Route Handler 에서 NextResponse.json 을 직접 쓰지 않는다.

export type ApiDataBody<T> = { data: T }
export type ApiListBody<T> = { data: T[]; nextCursor: string | null }

/** 허용하는 응답 헤더만 — Content-Type·Set-Cookie 등 임의 헤더로 형태를 바꿀 수 없게 한다 */
type OkInit = { status?: 200 | 201; location?: string }

/** 단일 리소스 (R3). 생성은 `{ status: 201, location }`. `undefined` 는 `data` 키가 사라지므로 개발자 실수로 본다 */
export function ok<T>(data: T, init?: OkInit): NextResponse<ApiDataBody<T>> {
  if (data === undefined) throw new TypeError('ok(): data must not be undefined (use null)')
  const headers = init?.location === undefined ? undefined : { Location: init.location }
  return NextResponse.json({ data }, { status: init?.status ?? 200, headers })
}

/** 목록 (R1·R2·R4). 항상 배열 — 빈 결과도 `[]`, 다음 페이지 없으면 `nextCursor: null` */
export function okList<T>(
  data: readonly T[],
  nextCursor: string | null,
): NextResponse<ApiListBody<T>> {
  return NextResponse.json({ data: [...data], nextCursor: nextCursor ?? null }, { status: 200 })
}

/** 삭제 (R5) — 204, 본문 없음 */
export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 })
}

/** 예상된 실패 (E1) */
export function fail(error: AppError): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error:
      error.details === undefined
        ? { code: error.code, message: error.message }
        : { code: error.code, message: error.message, details: error.details },
  }
  return NextResponse.json(body, { status: error.status })
}

export type UnexpectedErrorHandler = (error: unknown) => void

/**
 * catch 한 값을 응답으로. AppError 는 그대로, 그 외 모든 값(Error·문자열·undefined)은
 * 500 INTERNAL + 코드 표의 고정 문구(원본 message·stack 은 절대 본문에 넣지 않는다 — AUDIT H8). 예상 못한 실패에서만 `onUnexpectedError` 를 호출한다 (E5).
 * 로그가 실패해도 응답은 반드시 `{ error }` JSON 으로 나간다 — 핸들러의 throw 는 삼킨다.
 * 기본 핸들러는 log-format 으로 마스킹한 이름·메시지·코드만 남긴다(stack 없음 — 환경을 모르는 shared 라 운영 기준으로).
 * 요청 컨텍스트(route·환경 분기)가 필요한 실제 기록은 server/api-handler 가 server/logger 를 넘긴다.
 */
export function toErrorResponse(
  error: unknown,
  onUnexpectedError: UnexpectedErrorHandler = logUnexpectedError,
): NextResponse<ApiErrorBody> {
  if (isAppError(error)) return fail(error)
  try {
    onUnexpectedError(error)
  } catch {
    console.error('{"level":"error","event":"unexpected_error","note":"error handler threw"}')
  }
  return fail(new AppError('INTERNAL'))
}

/** 로거가 주입되지 않았을 때의 안전망 — summarizeError 가 getter throw·Prisma 메시지·개인정보를 처리한다 */
function logUnexpectedError(error: unknown): void {
  const summary = summarizeError(error)
  console.error(
    formatLogLine({
      level: 'error',
      event: 'unexpected_error',
      errorName: summary.name,
      message: summary.message,
      code: summary.code,
      meta: summary.meta,
    }),
  )
}
