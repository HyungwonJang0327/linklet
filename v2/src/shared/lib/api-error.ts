// API 에러 코드·AppError — decisions/error-handling.md E1·E2
// 클라이언트(재시도 판정·i18n 키 변환)도 쓰므로 server-only 를 붙이지 않는다. 순수 타입·클래스만.

/** 코드 → HTTP 상태·재시도 가능 여부·기본 개발자 메시지. 새 실패 유형은 여기 한 줄 + 사전 `errors.{CODE}` */
export const ERROR_CODE_TABLE = {
  VALIDATION_FAILED: { status: 400, retryable: false, message: 'Validation failed' },
  UNAUTHENTICATED: { status: 401, retryable: false, message: 'Authentication required' },
  FORBIDDEN: { status: 403, retryable: false, message: 'Forbidden' },
  NOT_FOUND: { status: 404, retryable: false, message: 'Not found' },
  CONFLICT: { status: 409, retryable: false, message: 'Conflict' },
  LIMIT_REACHED: { status: 422, retryable: false, message: 'Usage limit reached' },
  RATE_LIMITED: { status: 429, retryable: true, message: 'Too many requests' },
  UPSTREAM_FAILED: { status: 502, retryable: true, message: 'Upstream service failed' },
  INTERNAL: { status: 500, retryable: true, message: 'Internal error' },
} as const satisfies Record<string, { status: number; retryable: boolean; message: string }>

export type ErrorCode = keyof typeof ERROR_CODE_TABLE

export const ERROR_CODES = Object.keys(ERROR_CODE_TABLE) as readonly ErrorCode[]

/** 검증 실패 시 필드별 상세 (E1) */
export type FieldError = { path: string; code: string }

/** 에러 응답 본문 — `details` 는 에러 메타라 없으면 키 자체를 생략한다 (R6 는 도메인 데이터 규칙) */
export type ApiErrorBody = {
  error: { code: ErrorCode; message: string; details?: FieldError[] }
}

export function statusOf(code: ErrorCode): number {
  return ERROR_CODE_TABLE[code].status
}

/** 재시도는 응답 필드가 아니라 code 로 판단한다 (E2). TanStack Query 재시도 정책이 이 표를 따른다 */
export function isRetryable(code: ErrorCode): boolean {
  return ERROR_CODE_TABLE[code].retryable
}

/**
 * 예상된 실패. 서비스가 throw 하면 응답 헬퍼가 그대로 `{ error }` 로 바꾼다. 그 외 예외는 전부 500 INTERNAL.
 * message 는 항상 코드 표의 고정 문구 — 사용자 입력·DB 값·업스트림 메시지가 본문에 섞일 경로를 구조로 막는다 (H8).
 * 맥락이 필요하면 details(필드 경로·코드)로만 전달한다.
 */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: FieldError[] | undefined

  constructor(code: ErrorCode, details?: FieldError[]) {
    super(ERROR_CODE_TABLE[code].message)
    this.name = 'AppError'
    this.code = code
    this.status = statusOf(code)
    this.details = details
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}
