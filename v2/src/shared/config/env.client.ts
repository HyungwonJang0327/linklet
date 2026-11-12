import * as z from 'zod/mini'

import { emptyToUndefined, failInvalidEnv } from './env-failure'

// 클라이언트 환경변수 — NEXT_PUBLIC_* 만. 서버 스키마(./env.ts)는 import 하지 않는다 (server-only 혼입 방지).
// Next 는 `process.env.NEXT_PUBLIC_X` 를 **정적으로 직접** 참조한 자리만 빌드 시 값으로 치환한다
// (node_modules/next/dist/docs/01-app/02-guides/environment-variables.md "Bundling Environment Variables for the Browser").
// 그래서 아래 source 는 키 목록 순회 없이 한 줄씩 적는다. `process.env[name]`·`const env = process.env` 는 치환되지 않는다.
// 값은 빌드 시점에 고정된다 — 배포 환경마다 다시 빌드해야 한다.

const httpUrl = z.url({ protocol: /^https?$/ })

const clientEnvSchema = z.object({
  /** 지금 필수 — 공유 링크·OG 메타 등 절대 URL 을 만들 때 쓴다. 로컬 포트 하드코딩 금지 */
  NEXT_PUBLIC_APP_URL: httpUrl,
  /** F06 Sentry 연결 때 필수로 */
  NEXT_PUBLIC_SENTRY_DSN: z.optional(httpUrl),
  /** F26 공유 페이지 GA — 운영에서만 설정 */
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.optional(z.string().check(z.minLength(1))),
})

export type ClientEnv = Readonly<z.output<typeof clientEnvSchema>>

function loadClientEnv(): ClientEnv {
  const source = {
    NEXT_PUBLIC_APP_URL: emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SENTRY_DSN: emptyToUndefined(process.env.NEXT_PUBLIC_SENTRY_DSN),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: emptyToUndefined(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  }

  const result = z.safeParse(clientEnvSchema, source)
  if (!result.success) failInvalidEnv('client', result.error.issues)
  return Object.freeze(result.data)
}

/** 검증을 통과한 공개 환경변수. 클라이언트 컴포넌트·훅은 `process.env` 대신 이 객체를 쓴다 */
export const clientEnv: ClientEnv = loadClientEnv()
