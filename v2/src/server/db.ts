import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { env } from '@/shared/config/env'
import { summarizeError } from '@/shared/lib/log-format'

import { assertTlsInProduction, prismaLogEventToFields } from './db-config'
import { logger } from './logger'

// Prisma 인스턴스는 **이 파일 한 곳**에서만 만든다 (CLAUDE.md 함정 6, AUDIT H6). 다른 곳에서 `new PrismaClient` 금지.
// - 어댑터: @prisma/adapter-pg 하나 — 로컬 Docker·CI·운영 Neon 모두 TCP (decisions/tech-stack.md 2026-11-14). 접속 문자열은 검증된 env 의 pooled DATABASE_URL
// - 운영은 sslmode 없는 접속 문자열이면 부팅 실패 (db-config.assertTlsInProduction)
// - 로그: `error` 레벨만 이벤트로 받아 server/logger 를 거친다 — 쿼리·파라미터는 기록하지 않는다 (security-reviewer 2026-11-12). errorFormat 'minimal' 로 메시지에 색·힌트 없음
// - 개발 HMR 로 모듈이 재평가될 때 인스턴스(커넥션 풀)가 늘지 않게 non-production 에서만 globalThis 에 캐시한다
// - 생성 클라이언트(src/generated/prisma)는 `pnpm db:generate`(postinstall 포함) 산출물이며 커밋하지 않는다

function logDriverError(event: string, error: unknown): void {
  const summary = summarizeError(error)
  logger.error(event, { errorName: summary.name, message: summary.message, code: summary.code })
}

function createPrismaClient(): PrismaClient {
  const connectionString = assertTlsInProduction(env.DATABASE_URL, env.NODE_ENV)

  const adapter = new PrismaPg(
    { connectionString },
    {
      // pg Pool 의 idle 클라이언트 오류·연결 오류 — 어댑터가 리스너를 달아 주므로 프로세스는 죽지 않고, 여기서는 기록만 한다
      onPoolError: (error) => logDriverError('db.pool_error', error),
      onConnectionError: (error) => logDriverError('db.connection_error', error),
    },
  )

  const client = new PrismaClient({
    adapter,
    errorFormat: 'minimal',
    log: [{ level: 'error', emit: 'event' }],
  })
  client.$on('error', (event) => logger.error('db.error', prismaLogEventToFields(event)))
  return client
}

const globalForDb = globalThis as typeof globalThis & { __linkletDb?: PrismaClient }

/** 앱 전체가 쓰는 Prisma 클라이언트 하나. 각 기능의 server/repository.ts 만 import 한다 (features → server/db) */
export const db: PrismaClient = globalForDb.__linkletDb ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForDb.__linkletDb = db
