import { connect } from 'node:net'
import { describe, expect, it } from 'vitest'

// FEATURES F02 통합 — 실제 로컬 테스트 DB(vitest.setup.ts 가 DATABASE_URL 을 127.0.0.1:5434 로 덮는다)에 TCP 로 붙어 SELECT 1.
// 테스트 DB 가 떠 있지 않으면(Docker 꺼짐, CI 에 service container 없음) 이 파일만 건너뛴다 — `pnpm db:test:up` 으로 올린다.
// decisions/testing.md T5·T10. 값(접속 문자열)은 출력하지 않는다.

function testDbTarget(): { host: string; port: number } {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return { host: url.hostname, port: Number(url.port) }
}

function canConnect(
  { host, port }: { host: string; port: number },
  timeoutMs = 500,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port })
    const done = (ok: boolean) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
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
})
