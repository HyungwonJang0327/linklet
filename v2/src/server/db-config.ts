import 'server-only'

import type { LogMeta } from '@/shared/lib/log-format'

// DB 클라이언트의 순수 보조 함수 — server/db.ts 가 쓴다. Prisma·pg 를 import 하지 않아 단위 테스트가 DB 없이 돈다.
// 근거: decisions/tech-stack.md(어댑터 @prisma/adapter-pg 하나, 2026-11-14), CLAUDE.md §4-2 로그 규약, FEATURES F02

type NodeEnv = 'development' | 'test' | 'production'

/**
 * 운영에서 TLS 를 강제하는 sslmode 값. pg 8.x(pg-connection-string 2.14) 는 `require`·`verify-ca` 를 `verify-full` 의 별칭으로 다루되
 * 1회 SECURITY WARNING 을 낸다(소스 확인 2026-11-14). `uselibpqcompat=true` 가 붙으면 libpq 의미(require = 인증서 검증 없음)가 되므로
 * 그때는 `verify-full` 만 허용한다.
 */
export const PRODUCTION_SSLMODES: ReadonlySet<string> = new Set([
  'require',
  'verify-ca',
  'verify-full',
])

/**
 * production 이면 접속 문자열에 TLS(sslmode) 가 있어야 한다. 없으면 throw → 부팅 실패.
 * 메시지에는 키 이름·요구 조건만 들어가고 값(호스트·비밀번호)은 절대 들어가지 않는다.
 * development·test 는 로컬 Docker(TLS 없음)라 그대로 돌려준다.
 */
export function assertTlsInProduction(connectionString: string, nodeEnv: NodeEnv): string {
  if (nodeEnv !== 'production') return connectionString

  let params: URLSearchParams
  try {
    params = new URL(connectionString).searchParams
  } catch {
    throw new Error('DATABASE_URL must be a valid postgresql:// URL in production')
  }

  const sslmode = params.get('sslmode')
  const libpqCompat = params.get('uselibpqcompat') === 'true'
  const allowed =
    sslmode !== null && (libpqCompat ? sslmode === 'verify-full' : PRODUCTION_SSLMODES.has(sslmode))
  if (!allowed) {
    throw new Error(
      'DATABASE_URL must include sslmode=verify-full (TLS) in production — refusing to start without an encrypted connection',
    )
  }
  return connectionString
}

/** Prisma `$on('error')` 이벤트 모양 (runtime LogEvent). timestamp 는 받지 않는다 */
export type PrismaLogEvent = { message: string; target: string }

/** Prisma 로그 이벤트 → 로거 필드. 허용 목록 필드만: message(로거가 마스킹) + target(Prisma 내부 모듈 이름 — meta.target 에 1개). timestamp 는 로거가 찍는다 */
export function prismaLogEventToFields(event: PrismaLogEvent): { message: string; meta: LogMeta } {
  return {
    message: typeof event.message === 'string' ? event.message : '',
    meta: { target: [typeof event.target === 'string' ? event.target : 'unknown'] },
  }
}
