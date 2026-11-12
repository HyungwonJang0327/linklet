import * as z from 'zod/mini'

import { AppError, type FieldError } from './api-error'

// Zod 검증 실패 → AppError('VALIDATION_FAILED', details) 변환 — decisions/api-response.md V2, error-handling.md E1
// 서버(Route Handler 래퍼)와 클라이언트 폼이 같은 변환을 쓰므로 server-only 를 붙이지 않는다.
// zod 는 `zod/mini` 만 import 한다 (decisions/dependencies.md, ESLint no-restricted-imports).

/** details[].path 최대 길이 — 깊은 중첩·악의적 키로 응답이 부풀지 않게 자른다 (security-reviewer low 3) */
export const FIELD_PATH_MAX = 100

/**
 * zod/mini issue → `{ path, code }[]`.
 * - path: `['items', 0, 'productUrl']` → `'items.0.productUrl'`, 루트 이슈는 `''`
 * - code: Zod issue code 그대로 (`invalid_type`·`too_small`·`invalid_format`·`custom` …)
 * - Zod `message` 는 넣지 않는다 — 사용자 문구는 프론트가 path·code 로 만든다 (E3), 서버 로케일 문구가 본문에 섞이지 않게
 * - `invalid_union` 안의 하위 issue 는 펼치지 않는다 (최상위 이슈만)
 */
export function toFieldErrors(issues: readonly z.core.$ZodIssue[]): FieldError[] {
  return issues.map((issue) => ({
    path: issue.path.map(String).join('.').slice(0, FIELD_PATH_MAX),
    code: issue.code,
  }))
}

/** 성공이면 파싱된 값, 실패면 `AppError('VALIDATION_FAILED', toFieldErrors(issues))` throw */
export function parseOrThrow<T extends z.core.$ZodType>(schema: T, data: unknown): z.output<T> {
  const result = z.safeParse(schema, data)
  if (result.success) return result.data
  throw new AppError('VALIDATION_FAILED', toFieldErrors(result.error.issues))
}
