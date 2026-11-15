import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { canConnect } from '../../prisma/lib/tcp-probe.mts'

import type { db as Db } from './db'

// FEATURES F02 통합 — 실제 로컬 테스트 DB(vitest.setup.ts 가 DATABASE_URL 을 127.0.0.1:5434 로 덮는다)에 TCP 로 붙어 SELECT 1.
// 테스트 DB 가 떠 있지 않으면(Docker 꺼짐, CI 에 service container 없음) 이 파일만 건너뛴다 — `pnpm db:test:up` 으로 올린다.
// 마이그레이션은 vitest.global-setup.mts 가 테스트 시작 때 `prisma migrate deploy` 로 자동 적용한다(DB 가 떠 있을 때만).
// 테이블이 없으면 실패하는 것이 맞다 — 적용이 안 됐다는 뜻이다.
// 테스트마다 깨끗한 DB(T5): beforeEach 가 server/test-db.resetTestDatabase 로 모든 테이블을 비운다 — 이 파일은 그 본보기이자 검증이다.
// decisions/testing.md T5·T10. 값(접속 문자열)은 출력하지 않는다.

function testDbTarget(): { host: string; port: number } {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return { host: url.hostname, port: Number(url.port) }
}

const reachable = await canConnect(testDbTarget())

describe.skipIf(!reachable)('server/db — 통합 (로컬 테스트 DB, 미기동이면 skip)', () => {
  let db: typeof Db
  let resetTestDatabase: (client: typeof Db) => Promise<void>

  beforeAll(async () => {
    ;({ db } = await import('./db'))
    ;({ resetTestDatabase } = await import('./test-db'))
  })

  beforeEach(async () => {
    await resetTestDatabase(db)
  })

  afterAll(async () => {
    await db.$disconnect()
  })

  it('SELECT 1 — 어댑터·클라이언트가 실제로 연결된다', async () => {
    const rows = await db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`
    expect(rows).toEqual([{ ok: 1 }])
  })

  it('첫 마이그레이션(init)의 모델 5개에 접근할 수 있고 비운 DB 에서 count 는 0 이다', async () => {
    const counts = await Promise.all([
      db.user.count(),
      db.wishlist.count(),
      db.wishlistItem.count(),
      db.notice.count(),
      db.inquiry.count(),
    ])
    expect(counts).toEqual([0, 0, 0, 0, 0])
  })

  it('resetTestDatabase — 넣은 행이 다음 테스트 전에 사라진다 (CASCADE 로 자식 테이블까지)', async () => {
    // 더미 사용자(예약 도메인 .test — 실제 주소 아님) + 위시리스트 + 아이템 + 공지
    const user = await db.user.create({
      data: {
        name: 'Reset Probe',
        email: 'reset-probe@linklet.test',
        wishlists: {
          create: {
            title: 'reset probe',
            items: { create: { title: 'probe item', productUrl: 'https://example.com/p/1' } },
          },
        },
      },
    })
    await db.notice.create({ data: { title: 'probe notice', content: 'probe' } })
    expect(await db.user.count()).toBe(1)
    expect(await db.wishlistItem.count()).toBe(1)
    expect(await db.notice.count()).toBe(1)

    await resetTestDatabase(db)

    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull()
    const counts = await Promise.all([
      db.user.count(),
      db.wishlist.count(),
      db.wishlistItem.count(),
      db.notice.count(),
    ])
    expect(counts).toEqual([0, 0, 0, 0])
    // 마이그레이션 이력은 건드리지 않는다
    const migrations = await db.$queryRaw<
      { n: bigint }[]
    >`SELECT count(*) AS n FROM "_prisma_migrations"`
    expect(Number(migrations[0]?.n)).toBeGreaterThan(0)
  })
})
