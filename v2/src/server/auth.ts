import 'server-only'

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'

import { env } from '@/shared/config/env'

import { db } from './db'
import { logger } from './logger'

// Better Auth 인스턴스 — **이 파일 한 곳**. FEATURES F08(Google 로그인·로그아웃), decisions/tech-stack.md "Better Auth", architecture.md(server/auth).
// 라우트는 app/api/auth/[...all]/route.ts 가 toNextJsHandler 로 노출한다. 세션 조회는 features/auth/server(F08·F09·F10)가 auth.api 를 감싼다.
//
// 사용자 결정 2026-11-23 (worklog):
//   - 세션 수명 3일·하루마다 연장 — 기존 앱(NextAuth maxAge 3d·updateAge 1d)과 같은 값. FEATURES 근거 없이 바꾸지 않는다
//   - baseURL 은 NEXT_PUBLIC_APP_URL 하나 — BETTER_AUTH_URL 키 없음(두 URL 이 어긋나는 redirect_uri_mismatch 사고 방지)
//   - Google prompt: select_account — 기존 NextAuth 기본값(consent, 매번 동의 화면)에서 계정 선택만으로(처분 "개선")
//   - cookieCache 끔 — 요청마다 DB 세션 조회. F32 "다른 기기 모두 로그아웃" 이 즉시 반영된다
// 규약:
//   - ID: generateId:false → DB 의 `@default(uuid(7))` 이 전 테이블 한 방식(db-migration M5). 어댑터 provider 는 postgresql
//   - admin 플러그인: User.role("user"|"admin")·banned·banReason·banExpires, Session.impersonatedBy — F10·F33 판정의 근거 데이터. 판정 코드는 features/auth
//   - nextCookies 는 **마지막 플러그인** — Server Action 에서 Set-Cookie 를 Next 쿠키 API 로 옮긴다(better-auth Next.js 통합 문서)
//   - 텔레메트리 끔. 로그는 server/logger 로만(색·포맷 없는 한 줄 JSON) — Better Auth 메시지는 영어 고정 문구라 개인정보가 없고 args 는 버린다
//   - 요청 빈도 제한: 기본값(운영에서만 켜짐, 메모리 저장). DB 저장(`rateLimit.storage: 'database'`)과 rateLimit 테이블은 F12 에서
//   - 시크릿·클라이언트 ID 는 검증된 env 에서만. 어디에도 출력하지 않는다

const DAY_SECONDS = 60 * 60 * 24

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: 'postgresql' }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: 'select_account',
    },
  },
  session: {
    expiresIn: 3 * DAY_SECONDS,
    updateAge: DAY_SECONDS,
    cookieCache: { enabled: false },
  },
  advanced: {
    database: { generateId: false },
  },
  telemetry: { enabled: false },
  logger: {
    disableColors: true,
    level: 'warn',
    log: (level, message) => {
      if (level === 'error') logger.error('auth.sdk', { message })
      else if (level === 'warn') logger.warn('auth.sdk', { message })
      else logger.info('auth.sdk', { message })
    },
  },
  plugins: [admin(), nextCookies()],
})

/** 서버에서 쓰는 세션 형태 — auth.api.getSession 의 반환(user 에 role·banned 등 admin 플러그인 필드 포함) */
export type AuthSession = typeof auth.$Infer.Session
