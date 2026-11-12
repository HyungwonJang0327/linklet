import type * as z from 'zod/mini'

import { formatLogLine } from '@/shared/lib/log-format'
import { toFieldErrors } from '@/shared/lib/validation'

// 환경변수 검증 실패 처리 — env.ts(서버)·env.client.ts(클라이언트)가 함께 쓴다. server-only 없음.
// server/logger 는 env 를 import 하므로(역방향·순환) 여기서는 쓸 수 없다 → 순수 포맷 함수 shared/lib/log-format 만 쓴다.
// FEATURES F01: 기존 앱은 비밀값 앞 10자를 출력했다. 여기서는 어떤 경로로도 값이 나가지 않는다 —
// Zod issue 는 `input` 에 원본 값을 들고 있으므로 issue 객체를 그대로 로그·에러에 넣지 않고 path·code 만 뽑는다.

/** `.env.example` 을 복사해 값을 비워 둔 키(`KEY=`)는 미설정과 같게 본다 */
export function emptyToUndefined(value: string | undefined): string | undefined {
  return value === '' ? undefined : value
}

/**
 * 실패를 한 줄 JSON 으로 기록하고 throw 한다. 메시지에는 키 이름만 들어간다.
 * `process.exit` 는 쓰지 않는다 — Next 빌드·Vitest 프로세스를 죽이지 않고 부팅(모듈 로드)만 실패시킨다.
 * 요청 컨텍스트가 아니라 응답 헬퍼·AppError 를 거치지 않는다 (todo 메모).
 */
export function failInvalidEnv(
  scope: 'server' | 'client',
  issues: readonly z.core.$ZodIssue[],
): never {
  const details = toFieldErrors(issues)
  console.error(formatLogLine({ level: 'error', event: `env.invalid.${scope}`, details }))
  const keys = [...new Set(details.map((detail) => detail.path))].join(', ')
  throw new Error(`Invalid environment variables (${scope}): ${keys}`)
}
