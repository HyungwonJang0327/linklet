import { describe, expect, it } from 'vitest'

import {
  AppError,
  ERROR_CODES,
  ERROR_CODE_TABLE,
  type ErrorCode,
  isAppError,
  isRetryable,
  statusOf,
} from './api-error'

// decisions/error-handling.md E1 표 — 코드 9종 ↔ HTTP 상태 ↔ 재시도 가능
const EXPECTED: Record<ErrorCode, { status: number; retryable: boolean }> = {
  VALIDATION_FAILED: { status: 400, retryable: false },
  UNAUTHENTICATED: { status: 401, retryable: false },
  FORBIDDEN: { status: 403, retryable: false },
  NOT_FOUND: { status: 404, retryable: false },
  CONFLICT: { status: 409, retryable: false },
  LIMIT_REACHED: { status: 422, retryable: false },
  RATE_LIMITED: { status: 429, retryable: true },
  UPSTREAM_FAILED: { status: 502, retryable: true },
  INTERNAL: { status: 500, retryable: true },
}

describe('에러 코드 표', () => {
  it('코드는 정확히 9종이다', () => {
    expect([...ERROR_CODES].sort()).toEqual(Object.keys(EXPECTED).sort())
    expect(Object.keys(ERROR_CODE_TABLE)).toHaveLength(9)
  })

  it.each(Object.entries(EXPECTED))('%s → HTTP %o', (code, { status, retryable }) => {
    expect(statusOf(code as ErrorCode)).toBe(status)
    expect(isRetryable(code as ErrorCode)).toBe(retryable)
  })

  it('재시도 가능한 코드는 RATE_LIMITED·UPSTREAM_FAILED·INTERNAL 뿐이다', () => {
    const retryable = ERROR_CODES.filter(isRetryable).sort()
    expect(retryable).toEqual(['INTERNAL', 'RATE_LIMITED', 'UPSTREAM_FAILED'])
  })
})

describe('AppError', () => {
  it('Error 를 상속하고 name 은 AppError 다', () => {
    const error = new AppError('NOT_FOUND')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('AppError')
    expect(error.stack).toBeDefined()
  })

  it('status 는 코드 매핑에서 자동으로 정해진다', () => {
    for (const code of ERROR_CODES) {
      expect(new AppError(code).status).toBe(EXPECTED[code].status)
    }
  })

  it('message 는 항상 코드 표의 고정 문구다 — 커스텀 문구를 넣을 인자가 없다 (H8)', () => {
    expect(new AppError('FORBIDDEN').message).toBe(ERROR_CODE_TABLE.FORBIDDEN.message)
    // 생성자 시그니처는 (code, details?) — 두 번째 인자에 문자열을 넘기면 타입 에러
    // @ts-expect-error 문자열 message 인자는 존재하지 않는다
    expect(new AppError('FORBIDDEN', 'not the owner').message).toBe(
      ERROR_CODE_TABLE.FORBIDDEN.message,
    )
  })

  it('details 를 받으면 그대로 보존하고, 없으면 undefined 다', () => {
    const details = [{ path: 'productUrl', code: 'invalid_url' }]
    expect(new AppError('VALIDATION_FAILED', details).details).toEqual(details)
    expect(new AppError('VALIDATION_FAILED').details).toBeUndefined()
  })

  it('isAppError 는 AppError 만 true', () => {
    expect(isAppError(new AppError('CONFLICT'))).toBe(true)
    expect(isAppError(new Error('x'))).toBe(false)
    expect(isAppError({ code: 'CONFLICT', status: 409 })).toBe(false)
    expect(isAppError(undefined)).toBe(false)
  })
})
