import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// FEATURES F02 / CLAUDE.md 함정 6 — `new PrismaClient` 한 곳, error 이벤트만 로거 경유, 운영 TLS 강제, HMR 캐시.
// Prisma·pg·env·logger 를 전부 mock 해 DB 없이 생성자 인자와 이벤트 배선만 본다. 실제 접속은 db.integration.test.ts.

const hex = (bytes: number) => randomBytes(bytes).toString('hex')
const LOCAL_URL = 'postgresql://linklet:linklet@127.0.0.1:5434/linklet_test'

const mocks = vi.hoisted(() => ({
  envState: { NODE_ENV: 'test' as string, DATABASE_URL: '' },
  clientCtor: vi.fn<(options: unknown) => void>(),
  adapterCtor: vi.fn<(config: unknown, options: unknown) => void>(),
  handlers: {} as Record<string, (event: unknown) => void>,
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), unexpected: vi.fn() },
}))

vi.mock('@/shared/config/env', () => ({
  get env() {
    return mocks.envState
  },
}))
vi.mock('./logger', () => ({ logger: mocks.logger }))
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(config: unknown, options: unknown) {
      mocks.adapterCtor(config, options)
    }
  },
}))
vi.mock('@/generated/prisma/client', () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      mocks.clientCtor(options)
    }
    $on(type: string, handler: (event: unknown) => void) {
      mocks.handlers[type] = handler
    }
  },
}))

type DbGlobal = typeof globalThis & { __linkletDb?: unknown }

async function loadDb() {
  return import('./db')
}

describe('server/db', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete (globalThis as DbGlobal).__linkletDb
    for (const key of Object.keys(mocks.handlers)) delete mocks.handlers[key]
    mocks.envState = { NODE_ENV: 'test', DATABASE_URL: LOCAL_URL }
  })

  afterEach(() => {
    delete (globalThis as DbGlobal).__linkletDb
  })

  it('PrismaClient 는 adapter-pg + errorFormat minimal + log 는 error/event 하나만', async () => {
    await loadDb()

    expect(mocks.adapterCtor).toHaveBeenCalledTimes(1)
    const [adapterConfig, adapterOptions] = mocks.adapterCtor.mock.calls[0] ?? []
    expect(adapterConfig).toEqual({ connectionString: LOCAL_URL })
    expect(Object.keys(adapterOptions as object).sort()).toEqual([
      'onConnectionError',
      'onPoolError',
    ])

    expect(mocks.clientCtor).toHaveBeenCalledTimes(1)
    const options = mocks.clientCtor.mock.calls[0]?.[0] as Record<string, unknown>
    expect(Object.keys(options).sort()).toEqual(['adapter', 'errorFormat', 'log'])
    expect(options.errorFormat).toBe('minimal')
    expect(options.log).toEqual([{ level: 'error', emit: 'event' }])
  })

  it("$on('error') 이벤트 → logger.error('db.error', { message, meta.target }) — timestamp 는 넘기지 않는다", async () => {
    await loadDb()
    expect(Object.keys(mocks.handlers)).toEqual(['error'])

    mocks.handlers.error?.({
      timestamp: new Date(),
      message: 'connection closed',
      target: 'quaint',
    })

    expect(mocks.logger.error).toHaveBeenCalledWith('db.error', {
      message: 'connection closed',
      meta: { target: ['quaint'] },
    })
  })

  it('pg 풀·연결 오류 콜백 → logger.error(errorName·message·code 만) — 원본 error 객체는 넘기지 않는다', async () => {
    await loadDb()
    const options = mocks.adapterCtor.mock.calls[0]?.[1] as {
      onPoolError: (error: Error) => void
      onConnectionError: (error: Error) => void
    }
    const poolError = Object.assign(new Error(`pool ${hex(3)}`), { code: 'ECONNRESET' })
    options.onPoolError(poolError)
    options.onConnectionError(new Error('conn'))

    expect(mocks.logger.error).toHaveBeenCalledWith('db.pool_error', {
      errorName: 'Error',
      message: poolError.message,
      code: 'ECONNRESET',
    })
    expect(mocks.logger.error).toHaveBeenCalledWith('db.connection_error', {
      errorName: 'Error',
      message: 'conn',
      code: undefined,
    })
    expect(mocks.logger.unexpected).not.toHaveBeenCalled()
  })

  it('non-production: 모듈이 다시 평가돼도(HMR) globalThis 캐시로 인스턴스 하나 — 생성자 1회', async () => {
    const first = await loadDb()
    vi.resetModules()
    const second = await loadDb()

    expect(mocks.clientCtor).toHaveBeenCalledTimes(1)
    expect(second.db).toBe(first.db)
    expect((globalThis as DbGlobal).__linkletDb).toBe(first.db)
  })

  it('production: globalThis 에 캐시하지 않는다', async () => {
    mocks.envState = { NODE_ENV: 'production', DATABASE_URL: `${LOCAL_URL}?sslmode=verify-full` }
    await loadDb()

    expect(mocks.clientCtor).toHaveBeenCalledTimes(1)
    expect((globalThis as DbGlobal).__linkletDb).toBeUndefined()
  })

  it('production: sslmode 없는 접속 문자열이면 모듈 로드(부팅) 실패, 클라이언트·어댑터 생성 없음, 메시지에 값 없음', async () => {
    const token = hex(6)
    mocks.envState = {
      NODE_ENV: 'production',
      DATABASE_URL: `postgresql://u:${token}@ep-${token}.neon.tech/db`,
    }

    await expect(loadDb()).rejects.toThrow('sslmode=verify-full')
    await expect(loadDb()).rejects.not.toThrow(token)
    expect(mocks.adapterCtor).not.toHaveBeenCalled()
    expect(mocks.clientCtor).not.toHaveBeenCalled()
  })
})
