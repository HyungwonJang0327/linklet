import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/server/logger'

import { GET } from './route'

// FEATURES I01 동등성 확인(단위) — "실패 시 일반 문구만". DB 없이 `db.$queryRaw` 를 mock 한다.
// server/db 는 import 시점에 검증된 env·Prisma 어댑터를 만들므로 모듈 전체를 바꿔 끼운다.
// server/logger 도 mock — 로그에 "무엇을 넘기는지"만 본다 (api-handler.test.ts 와 같은 방식).

// vi.mock 팩토리는 파일 최상단으로 호이스팅되므로 참조하는 mock 함수도 vi.hoisted 로 먼저 만든다
const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn<() => Promise<unknown>>() }))

vi.mock('@/server/db', () => ({
  db: { $queryRaw: queryRaw },
}))

vi.mock('@/server/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), unexpected: vi.fn() },
}))

// 가짜 드라이버 메시지 — 접속 정보 조각(호스트·비밀번호·사용자명)이 본문에 새지 않는지 보기 위한 표본. 실제 값 아님
const LEAKY_MESSAGE = 'connect ECONNREFUSED 127.0.0.1:5432 password=hunter2 for user "linklet"'
const LEAK_MARKERS = ['ECONNREFUSED', 'hunter2', 'linklet', '127.0.0.1']

function call(): Promise<Response> {
  // Next 가 호출하는 시그니처 그대로 — (request, { params })
  return GET(new NextRequest('http://linklet.test/api/health'), { params: Promise.resolve({}) })
}

describe('GET /api/health', () => {
  beforeEach(() => {
    queryRaw.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('DB 가 응답하면 200 { data: { status: "ok" } } — 그 키만, JSON', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }])
    const res = await call()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^application\/json/)
    expect(await res.json()).toStrictEqual({ data: { status: 'ok' } })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('DB 실패 시 503 { error: { code: "UNAVAILABLE", message } } 고정 문구 — 키는 code·message 둘뿐', async () => {
    queryRaw.mockRejectedValue(new Error(LEAKY_MESSAGE))
    const res = await call()
    expect(res.status).toBe(503)
    expect(res.headers.get('content-type')).toMatch(/^application\/json/)
    expect(await res.clone().json()).toStrictEqual({
      error: { code: 'UNAVAILABLE', message: 'Service unavailable' },
    })
  })

  it('실패 본문 어디에도 드라이버 메시지 조각이 없다 (H8)', async () => {
    queryRaw.mockRejectedValue(new Error(LEAKY_MESSAGE))
    const text = await (await call()).text()
    for (const marker of LEAK_MARKERS) expect(text).not.toContain(marker)
  })

  it('실패 시 로거를 1회 호출하고, 넘긴 필드에 비밀번호 값이 없다', async () => {
    queryRaw.mockRejectedValue(new Error(LEAKY_MESSAGE))
    await call()
    expect(logger.error).toHaveBeenCalledTimes(1)
    const [event, fields] = vi.mocked(logger.error).mock.calls[0] ?? []
    expect(event).toBe('health.db_unavailable')
    expect(fields).toMatchObject({ errorName: 'Error' })
    expect(JSON.stringify(fields)).not.toContain('hunter2')
    // 예상된 실패라 unexpected 경로(500 로그)는 타지 않는다
    expect(logger.unexpected).not.toHaveBeenCalled()
  })

  it('Error 가 아닌 값으로 reject 해도 503 고정 문구', async () => {
    queryRaw.mockRejectedValue('string rejection with hunter2')
    const res = await call()
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(JSON.parse(text)).toStrictEqual({
      error: { code: 'UNAVAILABLE', message: 'Service unavailable' },
    })
    expect(text).not.toContain('hunter2')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
