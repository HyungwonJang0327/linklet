import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { canConnect } from '../../../../prisma/lib/tcp-probe.mts'

import type { db as Db } from '@/server/db'
import type { GET as Get } from './route'

// FEATURES I01 동등성 확인(통합) — 실제 로컬 테스트 DB(5434, vitest.setup.ts 가 DATABASE_URL 을 덮는다)에 붙어 GET 이 200 을 돌려준다.
// 테스트 DB 가 떠 있지 않으면 이 파일만 건너뛴다 (server/db.integration.test.ts 와 같은 패턴). `pnpm db:test:up` 으로 올린다.
//
// 다른 통합 파일과의 격리(tester todo "통합 테스트 파일 간 격리"): 이 파일은 TRUNCATE(resetTestDatabase)를 하지 않고
// 헬스 체크가 실행하는 `SELECT 1` 만 보낸다. 테이블을 전혀 건드리지 않으므로 server/db.integration.test.ts 의 beforeEach TRUNCATE
// (테이블 ACCESS EXCLUSIVE 잠금)와 잠금 경합이 없고, 그쪽이 비운 데이터에도 의존하지 않는다 — 병렬(forks)로 돌아도 서로 영향이 없다.
// 테이블을 읽거나 쓰는 통합 파일을 추가할 때는 그 todo 를 먼저 해결해야 한다.

function testDbTarget(): { host: string; port: number } {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return { host: url.hostname, port: Number(url.port) }
}

const reachable = await canConnect(testDbTarget())

describe.skipIf(!reachable)('GET /api/health — 통합 (로컬 테스트 DB, 미기동이면 skip)', () => {
  let db: typeof Db
  let GET: typeof Get

  beforeAll(async () => {
    // 모듈을 늦게 불러온다 — DB 가 없을 때 Prisma 클라이언트를 만들지 않기 위해 (db.integration.test.ts 와 같은 이유)
    ;({ db } = await import('@/server/db'))
    ;({ GET } = await import('./route'))
  })

  afterAll(async () => {
    await db.$disconnect()
  })

  it('실제 DB 에 SELECT 1 이 닿으면 200 { data: { status: "ok" } }', async () => {
    const res = await GET(new NextRequest('http://linklet.test/api/health'), {
      params: Promise.resolve({}),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({ data: { status: 'ok' } })
  })
})
