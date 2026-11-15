import { afterEach, describe, expect, it, vi } from 'vitest'

// server/test-db 가드 — NODE_ENV 가 'test' 가 아니면 모듈 로드 자체가 실패해야 한다 (운영 코드에 실수로 import 되는 사고 방지).
// DB 에 붙지 않는 단위 테스트. 실제 TRUNCATE 동작은 db.integration.test.ts 가 확인한다.

function mockEnv(nodeEnv: 'development' | 'test' | 'production', databaseUrl: string): void {
  vi.doMock('@/shared/config/env', () => ({
    env: { NODE_ENV: nodeEnv, DATABASE_URL: databaseUrl, DATABASE_URL_UNPOOLED: databaseUrl },
  }))
}

// 가짜 접속 문자열(시크릿 아님)
const LOCAL_URL = 'postgresql://linklet:linklet@127.0.0.1:5434/linklet_test'
const REMOTE_URL = 'postgresql://u:p@db.example.com/app'

describe('server/test-db — 테스트 전용 가드', () => {
  afterEach(() => {
    vi.doUnmock('@/shared/config/env')
    vi.resetModules()
  })

  it.each(['development', 'production'] as const)(
    "NODE_ENV=%s 이면 import 시점에 throw 한다 (메시지에 'test-only')",
    async (nodeEnv) => {
      mockEnv(nodeEnv, LOCAL_URL)
      await expect(import('./test-db')).rejects.toThrow('test-only')
    },
  )

  it('NODE_ENV=test 이면 로드되고 resetTestDatabase 를 export 한다', async () => {
    mockEnv('test', LOCAL_URL)
    const mod = await import('./test-db')
    expect(typeof mod.resetTestDatabase).toBe('function')
  })

  it('NODE_ENV=test 라도 DATABASE_URL 이 비로컬이면 resetTestDatabase 가 쿼리 없이 거부한다', async () => {
    mockEnv('test', REMOTE_URL)
    const { resetTestDatabase } = await import('./test-db')
    const executeRaw = vi.fn()
    const fakeDb = { $executeRaw: executeRaw } as unknown as Parameters<typeof resetTestDatabase>[0]
    await expect(resetTestDatabase(fakeDb)).rejects.toThrow('not a local database host')
    expect(executeRaw).not.toHaveBeenCalled()
  })

  it('로컬이면 $executeRaw 를 한 번 호출한다 (상수 SQL 하나, 식별자 보간 없음)', async () => {
    mockEnv('test', LOCAL_URL)
    const { resetTestDatabase } = await import('./test-db')
    const executeRaw = vi.fn().mockResolvedValue(0)
    const fakeDb = { $executeRaw: executeRaw } as unknown as Parameters<typeof resetTestDatabase>[0]
    await resetTestDatabase(fakeDb)
    expect(executeRaw).toHaveBeenCalledTimes(1)
    const [strings, ...values] = executeRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    expect(values).toEqual([]) // 바인드 값 없음 — SQL 전체가 상수
    const sql = strings.join('')
    expect(sql).toContain("tablename <> '_prisma_migrations'")
    expect(sql).toContain('RESTART IDENTITY CASCADE')
    expect(sql).toContain("format('%I.%I'")
  })
})
