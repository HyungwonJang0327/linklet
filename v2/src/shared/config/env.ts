import 'server-only'

import * as z from 'zod/mini'

import { emptyToUndefined, failInvalidEnv } from './env-failure'

// 서버 환경변수 스키마 — CLAUDE.md §4-2 입력 검증, FEATURES F01, decisions/architecture.md(shared/config/env.ts)
// 모듈 로드 시 1회 파싱한다. 부팅 연결은 src/instrumentation.ts 의 register() 가 이 모듈을 import 하는 것.
// 클라이언트 코드는 이 파일을 import 하지 않는다 (server-only). 브라우저에서 쓰는 NEXT_PUBLIC_* 는 ./env.client.ts.
//
// 필수 시점:
//   - 지금(Phase 1): NODE_ENV · NEXT_PUBLIC_APP_URL · DATABASE_URL · DATABASE_URL_UNPOOLED
//   - 해당 기능 이식 때 `z.optional(...)` 을 벗겨 필수로 바꾼다: F08(Better Auth·Google) · F20(R2) · F06(Sentry) · F26(GA)
// 형식: URL 은 z.url(프로토콜 제한), 시크릿류는 "비어 있지 않음"까지만 (길이·엔트로피 검사 없음).
// 값은 검증만 하고 어디에도 출력하지 않는다 — 실패 출력은 키 이름·issue code 만 (env-failure.ts).

/** `.env.example` 의 키 목록과 같아야 한다 (env.test.ts 가 확인). NODE_ENV 는 Next 가 설정하므로 example 에 없다 */
export const SERVER_ENV_KEYS = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
] as const

type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number]

const nonEmpty = z.string().check(z.minLength(1))
const httpUrl = z.url({ protocol: /^https?$/ })
/** postgresql:// 또는 postgres:// 접속 문자열 — 형식만 본다. 연결은 server/db.ts(F02) */
const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ })

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  /** 자기 호출·외부에 알리는 앱 URL. 로컬 포트 하드코딩 금지 (2026-11-10 기준선: 기존 앱은 localhost:3000 고정) */
  NEXT_PUBLIC_APP_URL: httpUrl,
  /** 런타임(pooled) — decisions/db-migration.md */
  DATABASE_URL: postgresUrl,
  /** Prisma CLI(unpooled) */
  DATABASE_URL_UNPOOLED: postgresUrl,

  // F08 인증 이식 때 필수로
  BETTER_AUTH_SECRET: z.optional(nonEmpty),
  BETTER_AUTH_URL: z.optional(httpUrl),
  GOOGLE_CLIENT_ID: z.optional(nonEmpty),
  GOOGLE_CLIENT_SECRET: z.optional(nonEmpty),

  // F20 이미지 업로드(R2) 이식 때 필수로
  R2_ACCOUNT_ID: z.optional(nonEmpty),
  R2_ACCESS_KEY_ID: z.optional(nonEmpty),
  R2_SECRET_ACCESS_KEY: z.optional(nonEmpty),
  R2_BUCKET: z.optional(nonEmpty),
  R2_PUBLIC_BASE_URL: z.optional(httpUrl),

  // F06 Sentry 연결 때 필수로 (DSN 은 클라이언트에도 노출 — env.client.ts 와 같은 규칙)
  NEXT_PUBLIC_SENTRY_DSN: z.optional(httpUrl),
  SENTRY_AUTH_TOKEN: z.optional(nonEmpty),

  // F26 공유 페이지 GA — 운영에서만 설정하므로 계속 optional 일 수 있다
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.optional(nonEmpty),
} satisfies Record<ServerEnvKey, z.ZodMiniType>)

export type ServerEnv = Readonly<z.output<typeof serverEnvSchema>>

function loadServerEnv(): ServerEnv {
  // 서버는 런타임 process.env 를 읽으므로 키 목록으로 접근해도 된다 (정적 참조가 필요한 건 브라우저 인라인만)
  const source: Partial<Record<ServerEnvKey, string>> = {}
  for (const key of SERVER_ENV_KEYS) source[key] = emptyToUndefined(process.env[key])

  const result = z.safeParse(serverEnvSchema, source)
  if (!result.success) failInvalidEnv('server', result.error.issues)
  return Object.freeze(result.data)
}

/** 검증을 통과한 서버 환경변수. 서버 코드는 `process.env` 대신 이 객체를 쓴다 */
export const env: ServerEnv = loadServerEnv()
