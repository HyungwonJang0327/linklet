import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { canConnect } from '../../prisma/lib/tcp-probe.mts'

import type { auth as Auth } from './auth'
import type { db as Db } from './db'

// FEATURES F08 통합 — Better Auth 어댑터가 실제 테스트 DB(add_auth_tables 마이그레이션 적용)에서 동작하는지.
// 핵심 확인(migrator-todo 메모 2026-11-14): `generateId: false` + Prisma `@default(uuid(7))` 조합 — SDK 가 id 를 보내지 않아도 DB 가 UUID v7 을 만든다.
// Google 왕복은 없다(testing.md — OAuth 자동화 안 함). 사용자·세션은 SDK 의 어댑터·internalAdapter 로 만든다(실제 코드 경로).
// 테스트 DB 가 떠 있지 않으면 skip(db.integration.test.ts 와 같은 규약). 값(토큰·접속 문자열)은 출력하지 않는다.

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function testDbTarget(): { host: string; port: number } {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return { host: url.hostname, port: Number(url.port) }
}

const reachable = await canConnect(testDbTarget())

describe.skipIf(!reachable)('server/auth — 통합 (로컬 테스트 DB, 미기동이면 skip)', () => {
  let auth: typeof Auth
  let db: typeof Db
  let resetTestDatabase: (client: typeof Db) => Promise<void>

  beforeAll(async () => {
    ;({ auth } = await import('./auth'))
    ;({ db } = await import('./db'))
    ;({ resetTestDatabase } = await import('./test-db'))
  })

  beforeEach(async () => {
    await resetTestDatabase(db)
  })

  afterAll(async () => {
    await db.$disconnect()
  })

  async function createUser(): Promise<{ id: string }> {
    const ctx = await auth.$context
    // 어댑터 경로로 만든다 — SDK 가 id 를 넣지 않는다(generateId:false). 이메일은 테스트 전용 더미
    return ctx.adapter.create<{ id: string }>({
      model: 'user',
      data: { name: 'Test User', email: `user-${Date.now()}@example.test`, emailVerified: true },
    })
  }

  it('어댑터로 만든 사용자 id 는 DB 가 생성한 UUID v7 이고, admin 플러그인 기본값(role user·banned false)이 들어간다', async () => {
    const user = await createUser()
    expect(user.id).toMatch(UUID_V7)

    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(row.role).toBe('user')
    expect(row.banned).toBe(false)
    expect(row.banReason).toBeNull()
  })

  it('internalAdapter.createSession → sessions 행(UUID v7 id·토큰·만료 3일) → findSession 이 사용자와 함께 돌려준다', async () => {
    const user = await createUser()
    const ctx = await auth.$context
    const before = Date.now()

    const session = await ctx.internalAdapter.createSession(user.id)
    expect(session.id).toMatch(UUID_V7)
    expect(session.userId).toBe(user.id)
    expect(session.token.length).toBeGreaterThan(20)

    // 사용자 결정 2026-11-23: 세션 수명 3일(기존 앱과 같음)
    const threeDays = 3 * 24 * 60 * 60 * 1000
    const ttl = session.expiresAt.getTime() - before
    expect(ttl).toBeGreaterThan(threeDays - 60_000)
    expect(ttl).toBeLessThanOrEqual(threeDays + 60_000)

    const found = await ctx.internalAdapter.findSession(session.token)
    expect(found?.session.id).toBe(session.id)
    expect(found?.user.id).toBe(user.id)

    await ctx.internalAdapter.deleteSession(session.token)
    expect(await ctx.internalAdapter.findSession(session.token)).toBeNull()
    expect(await db.session.count()).toBe(0)
  })

  it('쿠키 없는 getSession 은 null — DB 세션이 있어도 쿠키가 없으면 비로그인', async () => {
    const user = await createUser()
    const ctx = await auth.$context
    await ctx.internalAdapter.createSession(user.id)

    const session = await auth.api.getSession({ headers: new Headers() })
    expect(session).toBeNull()
  })

  it('사용자를 지우면 세션·계정이 함께 지워진다 (FK Cascade)', async () => {
    const user = await createUser()
    const ctx = await auth.$context
    await ctx.internalAdapter.createSession(user.id)
    await ctx.internalAdapter.createAccount({
      userId: user.id,
      providerId: 'google',
      accountId: `sub-${Date.now()}`,
    })
    expect(await db.session.count()).toBe(1)
    expect(await db.account.count()).toBe(1)

    await db.user.delete({ where: { id: user.id } })
    expect(await db.session.count()).toBe(0)
    expect(await db.account.count()).toBe(0)
  })
})
