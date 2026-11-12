import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { AppError } from '@/shared/lib/api-error'
import { LOG_ALLOWED_KEYS } from '@/shared/lib/log-format'

import { createLogger, type LogSink } from './logger'

// decisions/error-handling.md E5 — AppError 미기록, 예상 못한 실패 1줄, test 억제, production 에 stack 없음, 절대 throw 안 함.
// 기본 `logger` 는 검증된 env 를 로드하므로 env 모듈을 mock 한다 (NODE_ENV 만 쓴다).

vi.mock('@/shared/config/env', () => ({ env: { NODE_ENV: 'test' } }))

const hex = (bytes: number) => randomBytes(bytes).toString('hex')

type SpySink = { [K in keyof LogSink]: Mock<LogSink[K]> } & { lines: () => string[] }

function spySink(): SpySink {
  const log = vi.fn<(line: string) => void>()
  const warn = vi.fn<(line: string) => void>()
  const error = vi.fn<(line: string) => void>()
  return {
    log,
    warn,
    error,
    lines: () => [...log.mock.calls, ...warn.mock.calls, ...error.mock.calls].map((c) => c[0]),
  }
}

/** 실제 스택이 있는 Error — 프레임 수·운영 제외를 보기 위해 */
function thrownError(message: string): Error {
  try {
    throw new Error(message)
  } catch (error) {
    return error as Error
  }
}

describe('createLogger — 환경 분기', () => {
  it('test 환경은 기본으로 출력하지 않는다', () => {
    const sink = spySink()
    const logger = createLogger({ nodeEnv: 'test', sink })
    logger.info('a')
    logger.warn('b')
    logger.error('c')
    logger.unexpected(new Error('d'))
    expect(sink.lines()).toEqual([])
  })

  it('test 환경에서도 silent: false 면 출력한다', () => {
    const sink = spySink()
    const logger = createLogger({ nodeEnv: 'test', silent: false, sink })
    logger.info('a')
    expect(sink.lines()).toHaveLength(1)
  })

  it('development: unexpected 에 stack(프레임 ≤10, 경로만)이 들어간다', () => {
    const sink = spySink()
    createLogger({ nodeEnv: 'development', sink }).unexpected(thrownError('boom'))
    const parsed = JSON.parse(sink.lines()[0] ?? '')
    expect(typeof parsed.stack).toBe('string')
    const frames = (parsed.stack as string).split('\n')
    expect(frames.length).toBeGreaterThan(0)
    expect(frames.length).toBeLessThanOrEqual(10)
    for (const frame of frames) expect(frame).toMatch(/:\d+:\d+$|^<anonymous>$/)
    expect(parsed.stack).not.toContain('thrownError')
  })

  it('production: 콘솔 줄에 stack 이 없다 (스택은 Sentry 로만 — F06)', () => {
    const sink = spySink()
    createLogger({ nodeEnv: 'production', sink }).unexpected(thrownError('boom'))
    const parsed = JSON.parse(sink.lines()[0] ?? '')
    expect(parsed).toMatchObject({ level: 'error', event: 'unexpected_error', errorName: 'Error' })
    expect('stack' in parsed).toBe(false)
  })
})

describe('createLogger — 이벤트 로그', () => {
  it('level 별로 sink.log / warn / error 로 간다, 한 줄 JSON', () => {
    const sink = spySink()
    const logger = createLogger({ nodeEnv: 'development', sink })
    logger.info('request.done', { route: '/api/x', method: 'GET', status: 200, durationMs: 3 })
    logger.warn('upstream.slow', { durationMs: 1500 })
    logger.error('job.failed', { code: 'ECONNRESET' })
    expect(sink.log).toHaveBeenCalledTimes(1)
    expect(sink.warn).toHaveBeenCalledTimes(1)
    expect(sink.error).toHaveBeenCalledTimes(1)
    const [info] = sink.log.mock.calls[0] ?? []
    expect(info).not.toContain('\n')
    expect(JSON.parse(info ?? '')).toEqual({
      level: 'info',
      event: 'request.done',
      route: '/api/x',
      method: 'GET',
      status: 200,
      durationMs: 3,
    })
  })

  it('허용 목록 밖의 필드는 출력에 없다', () => {
    const sink = spySink()
    const secret = hex(6)
    createLogger({ nodeEnv: 'development', sink }).info('login', {
      requestId: 'r1',
      ...({ email: `${secret}@x.com`, cookie: secret, body: { secret } } as object),
    })
    const line = sink.lines()[0] ?? ''
    expect(line).not.toContain(secret)
    expect(JSON.parse(line)).toEqual({ level: 'info', event: 'login', requestId: 'r1' })
  })
})

describe('createLogger — unexpected (E5)', () => {
  it('AppError 는 기록하지 않는다', () => {
    const sink = spySink()
    const logger = createLogger({ nodeEnv: 'development', sink })
    logger.unexpected(new AppError('NOT_FOUND'))
    logger.unexpected(new AppError('VALIDATION_FAILED', [{ path: 'a', code: 'b' }]), {
      route: '/x',
    })
    expect(sink.lines()).toEqual([])
  })

  it('일반 Error 는 정확히 1줄 — errorName·message·code·meta + 요청 컨텍스트, 허용 목록 키만', () => {
    const sink = spySink()
    const error = Object.assign(new Error('Unique constraint failed on the fields: (`email`)'), {
      code: 'P2002',
      meta: { target: ['email'], modelName: 'User' },
    })
    createLogger({ nodeEnv: 'production', sink }).unexpected(error, {
      requestId: 'r1',
      route: '/api/wishlists',
      method: 'POST',
    })
    expect(sink.error).toHaveBeenCalledTimes(1)
    expect(sink.log).not.toHaveBeenCalled()
    const parsed = JSON.parse(sink.lines()[0] ?? '')
    expect(parsed).toEqual({
      level: 'error',
      event: 'unexpected_error',
      requestId: 'r1',
      route: '/api/wishlists',
      method: 'POST',
      code: 'P2002',
      errorName: 'Error',
      message: 'Unique constraint failed on the fields: (`email`)',
      meta: { target: ['email'], modelName: 'User' },
    })
    for (const key of Object.keys(parsed)) expect(LOG_ALLOWED_KEYS).toContain(key)
  })

  it('message·cause·meta 에 든 이메일·토큰·접속 문자열이 출력에 없다', () => {
    const sink = spySink()
    const token = hex(20)
    const email = `u${hex(3)}@example.com`
    const error = Object.assign(
      new Error(`connect postgresql://app:${token}@db.example/linklet failed for ${email}`, {
        cause: new Error(`Bearer ${token}`),
      }),
      { meta: { target: [email], record: { email, token } } },
    )
    createLogger({ nodeEnv: 'development', sink }).unexpected(error, { route: `/w/${token}` })
    const line = sink.lines()[0] ?? ''
    expect(line).not.toContain(token)
    expect(line).not.toContain(email)
    expect(line).not.toContain('db.example')
    expect(JSON.parse(line).message).toBe('connect postgresql://*** failed for ***@***')
  })

  it('Error 가 아닌 값은 typeof 만, 내용은 없다', () => {
    const sink = spySink()
    const secret = hex(6)
    createLogger({ nodeEnv: 'development', sink }).unexpected(`raw ${secret}`)
    const line = sink.lines()[0] ?? ''
    expect(line).not.toContain(secret)
    expect(JSON.parse(line)).toMatchObject({ errorName: 'NonError', message: 'string' })
  })

  it('getter 가 throw 하는 Error 도 1줄', () => {
    class Hostile extends Error {
      override get message(): string {
        throw new Error('nope')
      }
    }
    const sink = spySink()
    createLogger({ nodeEnv: 'development', sink }).unexpected(new Hostile())
    expect(sink.lines()).toHaveLength(1)
    expect(JSON.parse(sink.lines()[0] ?? '')).toMatchObject({ message: '(unreadable)' })
  })
})

describe('createLogger — 절대 throw 하지 않는다', () => {
  it('sink 가 throw 해도 info·warn·error·unexpected 모두 조용히 끝난다', () => {
    const throwing = () => {
      throw new Error('console is broken')
    }
    const logger = createLogger({
      nodeEnv: 'production',
      sink: { log: throwing, warn: throwing, error: throwing },
    })
    expect(() => logger.info('a')).not.toThrow()
    expect(() => logger.warn('a')).not.toThrow()
    expect(() => logger.error('a')).not.toThrow()
    expect(() => logger.unexpected(new Error('a'))).not.toThrow()
    expect(() => logger.unexpected('x')).not.toThrow()
  })

  it('console.error 가 throw 해도 (기본 sink) throw 하지 않는다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('stdout closed')
    })
    const logger = createLogger({ nodeEnv: 'production' })
    expect(() => logger.unexpected(new Error('a'))).not.toThrow()
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('fields 의 getter 가 throw 하면 고정 문구 한 줄 — 여전히 throw 하지 않는다', () => {
    const sink = spySink()
    const fields = {}
    Object.defineProperty(fields, 'route', {
      enumerable: true,
      get() {
        throw new Error('hostile')
      },
    })
    expect(() =>
      createLogger({ nodeEnv: 'development', sink }).unexpected(new Error('x'), fields),
    ).not.toThrow()
    expect(JSON.parse(sink.lines()[0] ?? '')).toEqual({
      level: 'error',
      event: 'log.format_failed',
    })
  })
})

describe('기본 logger (env.NODE_ENV)', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('@/shared/config/env')
  })

  it('env.NODE_ENV 가 test 면 콘솔에 아무것도 쓰지 않는다', async () => {
    vi.doMock('@/shared/config/env', () => ({ env: { NODE_ENV: 'test' } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { logger } = await import('./logger')
    logger.unexpected(new Error('x'))
    logger.info('y')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('env.NODE_ENV 가 production 이면 console.error 한 줄, stack 없음', async () => {
    vi.doMock('@/shared/config/env', () => ({ env: { NODE_ENV: 'production' } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await import('./logger')
    logger.unexpected(thrownError('x'), { route: '/api/health', method: 'GET' })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(String(errorSpy.mock.calls[0]?.[0]))
    expect(parsed).toEqual({
      level: 'error',
      event: 'unexpected_error',
      route: '/api/health',
      method: 'GET',
      errorName: 'Error',
      message: 'x',
    })
  })

  it('env.NODE_ENV 가 development 면 stack 포함', async () => {
    vi.doMock('@/shared/config/env', () => ({ env: { NODE_ENV: 'development' } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await import('./logger')
    logger.unexpected(thrownError('x'))
    expect(typeof JSON.parse(String(errorSpy.mock.calls[0]?.[0])).stack).toBe('string')
  })
})
