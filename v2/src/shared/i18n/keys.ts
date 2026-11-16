import { ERROR_CODES, type ErrorCode } from '@/shared/lib/api-error'

import type { DictionaryKey } from './types'

// 에러 코드 → 사전 키 매핑 — decisions/i18n.md L8, error-handling E3. 문자열 결합이 아니라 표로 둔다(CLAUDE.md 함정 11):
// 코드가 늘거나 사전 키가 빠지면 여기서 컴파일 에러가 난다. 모르는 코드(옛 응답·네트워크 오류 등)는 errors.UNKNOWN 폴백.
// Prisma enum(WishlistCategory 등)의 매핑은 그 기능 폴더(features/{x}/i18n-keys.ts)에 둔다 — 여기 아님

const ERROR_MESSAGE_KEYS = {
  VALIDATION_FAILED: 'errors.VALIDATION_FAILED',
  UNAUTHENTICATED: 'errors.UNAUTHENTICATED',
  FORBIDDEN: 'errors.FORBIDDEN',
  NOT_FOUND: 'errors.NOT_FOUND',
  CONFLICT: 'errors.CONFLICT',
  LIMIT_REACHED: 'errors.LIMIT_REACHED',
  RATE_LIMITED: 'errors.RATE_LIMITED',
  UPSTREAM_FAILED: 'errors.UPSTREAM_FAILED',
  INTERNAL: 'errors.INTERNAL',
  UNAVAILABLE: 'errors.UNAVAILABLE',
} as const satisfies Record<ErrorCode, DictionaryKey>

export const UNKNOWN_ERROR_KEY = 'errors.UNKNOWN' satisfies DictionaryKey

/** 에러 코드의 사용자 문구 키. 응답에서 온 값은 unknown 일 수 있으므로 string 도 받는다 — ERROR_CODES 밖이면 UNKNOWN */
export function errorMessageKey(code: ErrorCode | string): DictionaryKey {
  return isErrorCode(code) ? ERROR_MESSAGE_KEYS[code] : UNKNOWN_ERROR_KEY
}

function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value)
}
