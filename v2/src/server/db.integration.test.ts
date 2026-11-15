import { describe, expect, it } from 'vitest'

import { canConnect } from '../../prisma/lib/tcp-probe.mts'

// FEATURES F02 통합 — 실제 로컬 테스트 DB(vitest.setup.ts 가 DATABASE_URL 을 127.0.0.1:5434 로 덮는다)에 TCP 로 붙어 SELECT 1.
// 테스트 DB 가 떠 있지 않으면(Docker 꺼짐, CI 에 service container 없음) 이 파일만 건너뛴다 — `pnpm db:test:up` 으로 올린다.
// 모델 접근 테스트는 테스트 DB 에 마이그레이션이 적용돼 있어야 한다 — 지금은 `pnpm exec prisma migrate deploy` 수동 1회(v2/README.md).
// 자동 setup(마이그레이션 적용·테스트마다 비우기)은 시드 항목(todo/migrator-todo.md)에서 만든다. 테이블이 없으면 실패하는 것이 맞다.
// decisions/testing.md T5·T10. 값(접속 문자열)은 출력하지 않는다.

function testDbTarget(): { host: string; port: number } {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return { host: url.hostname, port: Number(url.port) }
}

const reachable = await canConnect(testDbTarget())

describe.skipIf(!reachable)('server/db — 통합 (로컬 테스트 DB, 미기동이면 skip)', () => {
  it('SELECT 1 — 어댑터·클라이언트가 실제로 연결된다', async () => {
    const { db } = await import('./db')
    try {
      const rows = await db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`
      expect(rows).toEqual([{ ok: 1 }])
    } finally {
      await db.$disconnect()
    }
  })

  it('첫 마이그레이션(init)의 모델 5개에 접근할 수 있고 빈 DB 에서 count 는 0 이다', async () => {
    const { db } = await import('./db')
    try {
      const counts = await Promise.all([
        db.user.count(),
        db.wishlist.count(),
        db.wishlistItem.count(),
        db.notice.count(),
        db.inquiry.count(),
      ])
      expect(counts).toEqual([0, 0, 0, 0, 0])
    } finally {
      await db.$disconnect()
    }
  })
})
