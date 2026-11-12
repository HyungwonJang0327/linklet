import 'server-only'

import { NextResponse } from 'next/server'

import { AppError, type ApiErrorBody, isAppError } from './api-error'

// 응답 헬퍼 — decisions/api-response.md R1~R5, error-handling.md E1·E2·E5
// 응답 JSON 은 이 파일의 함수로만 만든다. Route Handler 에서 NextResponse.json 을 직접 쓰지 않는다.

export type ApiDataBody<T> = { data: T }
export type ApiListBody<T> = { data: T[]; nextCursor: string | null }

/** 예상 못한 실패의 고정 문구 — 원본 message·stack 은 절대 본문에 넣지 않는다 (AUDIT H8) */
export const UNEXPECTED_ERROR_MESSAGE = 'Unexpected error'

type OkInit = { status?: 200 | 201; headers?: HeadersInit }

/** 단일 리소스 (R3). 생성은 `{ status: 201 }` */
export function ok<T>(data: T, init?: OkInit): NextResponse<ApiDataBody<T>> {
  return NextResponse.json({ data }, { status: init?.status ?? 200, headers: init?.headers })
}

/** 목록 (R1·R2·R4). 항상 배열 — 빈 결과도 `[]`, 다음 페이지 없으면 `nextCursor: null` */
export function okList<T>(
  data: readonly T[],
  nextCursor: string | null,
): NextResponse<ApiListBody<T>> {
  return NextResponse.json({ data: [...data], nextCursor }, { status: 200 })
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
 * 500 INTERNAL + 고정 문구. 예상 못한 실패에서만 `onUnexpectedError` 를 호출한다 (E5).
 * 기본 핸들러는 에러 이름·메시지만 남긴다 — 요청 본문·개인정보 없음.
 */
export function toErrorResponse(
  error: unknown,
  onUnexpectedError: UnexpectedErrorHandler = logUnexpectedError,
): NextResponse<ApiErrorBody> {
  if (isAppError(error)) return fail(error)
  onUnexpectedError(error)
  return fail(new AppError('INTERNAL', UNEXPECTED_ERROR_MESSAGE))
}

function logUnexpectedError(error: unknown): void {
  const summary =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: 'NonError', message: typeof error }
  console.error(JSON.stringify({ level: 'error', event: 'unexpected_error', ...summary }))
}
