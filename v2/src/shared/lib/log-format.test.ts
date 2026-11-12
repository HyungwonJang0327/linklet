import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  formatLogLine,
  LOG_ALLOWED_KEYS,
  LOG_FORMAT_FAILED_LINE,
  type LogFields,
  STACK_MAX_FRAMES,
  summarizeError,
} from './log-format'

// decisions/error-handling.md E5, CLAUDE.md §4-2 로그 규약 — 허용 목록 키만, 모든 문자열 필드는 마스킹(./redact 테스트 참고).
// 가짜 값은 전부 무작위 생성 — 테스트 파일에 진짜처럼 보이는 토큰을 적지 않는다.

const hex = (bytes: number) => randomBytes(bytes).toString('hex')

describe('summarizeError', () => {
  it('Error 가 아니면 typeof 만 — 문자열 내용은 기록하지 않는다', () => {
    const secret = hex(6)
    expect(summarizeError(`leak ${secret}`)).toEqual({ name: 'NonError', message: 'string' })
    expect(summarizeError(undefined)).toEqual({ name: 'NonError', message: 'undefined' })
    expect(summarizeError(null)).toEqual({ name: 'NonError', message: 'object' })
    expect(summarizeError(42)).toEqual({ name: 'NonError', message: 'number' })
    expect(JSON.stringify(summarizeError({ message: secret }))).not.toContain(secret)
  })

  it('일반 Error — name·message(마스킹)·stack(프레임 경로만)', () => {
    const email = `e${hex(3)}@example.com`
    const summary = summarizeError(new RangeError(`bad value for ${email}`))
    expect(summary.name).toBe('RangeError')
    expect(summary.message).toBe('bad value for ***@***')
    expect(summary.code).toBeUndefined()
    expect(summary.stack).toBeDefined()
    expect(JSON.stringify(summary)).not.toContain(email)
  })

  it('code 는 문자열 속성일 때만 (Prisma P2002·pg code). 숫자·객체 code 는 버린다', () => {
    const prisma = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    expect(summarizeError(prisma).code).toBe('P2002')
    const numeric = Object.assign(new Error('x'), { code: 500 })
    expect(summarizeError(numeric).code).toBeUndefined()
    const objectCode = Object.assign(new Error('x'), { code: { nested: true } })
    expect(summarizeError(objectCode).code).toBeUndefined()
  })

  it('PrismaClientValidationError 는 첫 줄(비어 있지 않은)만 — 인자 덤프의 이메일·값이 사라진다', () => {
    const email = `v${hex(3)}@example.com`
    const token = hex(6)
    const error = new Error(
      `\nInvalid \`prisma.user.create()\` invocation:\n\n{\n  data: {\n    email: "${email}",\n    name: "${token}"\n  }\n}\n\nArgument \`x\` is missing.`,
    )
    error.name = 'PrismaClientValidationError'
    const summary = summarizeError(error)
    expect(summary.message).toBe('Invalid `prisma.user.create()` invocation:')
    expect(JSON.stringify(summary)).not.toContain(email)
    expect(JSON.stringify(summary)).not.toContain(token)
  })

  it('meta 는 target(문자열 배열)·modelName 만 — 레코드 값은 버린다', () => {
    const secret = hex(6)
    const error = Object.assign(new Error('x'), {
      code: 'P2002',
      meta: {
        target: ['email', 'tenantId'],
        modelName: 'User',
        record: { email: secret },
        cause: secret,
      },
    })
    const summary = summarizeError(error)
    expect(summary.meta).toEqual({ target: ['email', 'tenantId'], modelName: 'User' })
    expect(JSON.stringify(summary)).not.toContain(secret)
    // 옛 Prisma 는 target 이 문자열
    const legacy = Object.assign(new Error('x'), { meta: { target: 'User_email_key' } })
    expect(summarizeError(legacy).meta).toEqual({ target: ['User_email_key'] })
    // 쓸 만한 키가 없으면 meta 자체가 없다
    expect(
      summarizeError(Object.assign(new Error('x'), { meta: { record: 1 } })).meta,
    ).toBeUndefined()
  })

  it('cause 에 든 비밀값은 어디에도 없다', () => {
    const secret = hex(6)
    const error = new Error('outer', { cause: new Error(`inner ${secret}`) })
    expect(JSON.stringify(summarizeError(error))).not.toContain(secret)
  })

  it('getter 가 throw 하는 Error — name·message·stack·code 어느 것이 던져도 요약을 돌려준다', () => {
    class Hostile extends Error {
      override get message(): string {
        throw new Error('nope')
      }
      override get stack(): string {
        throw new Error('nope')
      }
      get code(): string {
        throw new Error('nope')
      }
      get meta(): unknown {
        throw new Error('nope')
      }
    }
    const summary = summarizeError(new Hostile())
    // Error 서브클래스는 name 을 따로 넣지 않으면 'Error'
    expect(summary).toEqual({ name: 'Error', message: '(unreadable)' })

    class HostileName extends Error {
      override get name(): string {
        throw new Error('nope')
      }
    }
    expect(summarizeError(new HostileName('m')).name).toBe('Error')
  })

  it(`stack 은 프레임 ≤${STACK_MAX_FRAMES}개, 각 프레임은 file:line:col 만 (함수 이름·인자 없음)`, () => {
    const secret = hex(6)
    const frames = Array.from(
      { length: 15 },
      (_, i) => `    at Object.secretFn${secret} (/app/src/server/mod-${i}.ts:${i + 1}:5)`,
    )
    const error = new Error('boom')
    error.stack = [`Error: boom ${secret}`, ...frames, '    at new Promise (<anonymous>)'].join(
      '\n',
    )
    const summary = summarizeError(error)
    const lines = summary.stack?.split('\n') ?? []
    expect(lines).toHaveLength(STACK_MAX_FRAMES)
    expect(lines[0]).toBe('/app/src/server/mod-0.ts:1:5')
    expect(lines[9]).toBe('/app/src/server/mod-9.ts:10:5')
    expect(summary.stack).not.toContain(secret)
    expect(summary.stack).not.toContain('secretFn')
    expect(summary.stack).not.toContain('boom')
  })

  it('위치 없는 프레임은 <anonymous>, 프레임이 하나도 없으면 stack 키 자체가 없다', () => {
    const anon = new Error('x')
    anon.stack = 'Error: x\n    at <anonymous>\n    at new Promise (<anonymous>)'
    expect(summarizeError(anon).stack).toBe('<anonymous>\n<anonymous>')
    const none = new Error('x')
    none.stack = 'Error: x'
    expect(summarizeError(none).stack).toBeUndefined()
    const noStack = new Error('x')
    noStack.stack = undefined
    expect(summarizeError(noStack).stack).toBeUndefined()
  })
})

describe('formatLogLine', () => {
  it('허용 목록 키만, 정해진 순서로 한 줄 JSON', () => {
    const line = formatLogLine({
      level: 'error',
      event: 'unexpected_error',
      requestId: 'req-1',
      route: '/api/wishlists/abc',
      method: 'POST',
      status: 500,
      code: 'P2002',
      errorName: 'PrismaClientKnownRequestError',
      message: 'Unique constraint failed',
      durationMs: 12.5,
      stack: '/app/a.ts:1:1',
      details: [{ path: 'title', code: 'too_big' }],
      meta: { target: ['email'], modelName: 'User' },
    })
    expect(line).not.toContain('\n')
    const parsed = JSON.parse(line)
    expect(Object.keys(parsed)).toEqual([...LOG_ALLOWED_KEYS])
    expect(parsed).toEqual({
      level: 'error',
      event: 'unexpected_error',
      requestId: 'req-1',
      route: '/api/wishlists/abc',
      method: 'POST',
      status: 500,
      code: 'P2002',
      errorName: 'PrismaClientKnownRequestError',
      message: 'Unique constraint failed',
      durationMs: 12.5,
      stack: '/app/a.ts:1:1',
      details: [{ path: 'title', code: 'too_big' }],
      meta: { target: ['email'], modelName: 'User' },
    })
  })

  it('허용 목록 밖의 키(password·cookie·body·user·headers·email)는 이름이 무엇이든 버린다', () => {
    const secret = hex(6)
    const line = formatLogLine({
      level: 'info',
      event: 'login',
      password: secret,
      cookie: `session=${secret}`,
      body: { email: `${secret}@x.com` },
      user: { id: '1', email: `${secret}@x.com` },
      headers: { authorization: `Bearer ${secret}` },
      email: `${secret}@x.com`,
    } as LogFields)
    expect(line).not.toContain(secret)
    expect(JSON.parse(line)).toEqual({ level: 'info', event: 'login' })
  })

  it('허용된 문자열 필드 안의 비밀값도 마스킹된다 (message·route·event·stack·meta·details)', () => {
    const secret = hex(20)
    const email = `m${hex(3)}@example.com`
    const line = formatLogLine({
      level: 'warn',
      event: `evt ${email}`,
      route: `/api/w/${secret}?token=${secret}#frag`,
      message: `postgresql://u:${secret}@h/db ${email}`,
      stack: `at x (/app/a.ts:1:1)\nkey=${secret}`,
      requestId: secret,
      meta: { target: [email], modelName: secret },
      details: [{ path: email, code: secret }],
    })
    expect(line).not.toContain(secret)
    expect(line).not.toContain(email)
    const parsed = JSON.parse(line)
    expect(parsed.route).toBe('/api/w/***')
    expect(parsed.message).toBe('postgresql://*** ***@***')
  })

  it('route 는 pathname 만 — 쿼리스트링·해시를 잘라낸다', () => {
    expect(JSON.parse(formatLogLine({ route: '/api/items?cursor=abc&q=x' })).route).toBe(
      '/api/items',
    )
    expect(JSON.parse(formatLogLine({ route: '/api/items#x' })).route).toBe('/api/items')
  })

  it('타입이 틀린 값은 버린다 — 문자열 status·NaN·Infinity·BigInt·순환 객체. 줄은 유효한 JSON 으로 나간다', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const line = formatLogLine({
      level: 'debug',
      event: 'x',
      status: '500',
      durationMs: Number.NaN,
      code: 7n,
      meta: circular,
      details: 'not-an-array',
      message: 123,
    } as unknown as LogFields)
    expect(JSON.parse(line)).toEqual({ level: 'info', event: 'x' })
    const inf = formatLogLine({ durationMs: Number.POSITIVE_INFINITY, status: 500 })
    expect(JSON.parse(inf)).toEqual({ level: 'info', status: 500 })
  })

  it('level 이 없거나 잘못되면 info, 입력이 객체가 아니면 level 만', () => {
    expect(JSON.parse(formatLogLine({ event: 'e' }))).toEqual({ level: 'info', event: 'e' })
    expect(JSON.parse(formatLogLine(null as unknown as LogFields))).toEqual({ level: 'info' })
    expect(JSON.parse(formatLogLine('str' as unknown as LogFields))).toEqual({ level: 'info' })
  })

  it('details 는 { path, code } 문자열 쌍만 (그 밖의 키·형태는 버림), 최대 50개', () => {
    const secret = hex(6)
    const entries = Array.from({ length: 60 }, (_, i) => ({ path: `f${i}`, code: 'x' }))
    const line = formatLogLine({
      details: [
        { path: 'a', code: 'b', received: secret },
        { path: 'only' },
        'junk',
        null,
        ...entries,
      ] as unknown as LogFields['details'],
    })
    const parsed = JSON.parse(line)
    expect(parsed.details).toHaveLength(50)
    expect(parsed.details[0]).toEqual({ path: 'a', code: 'b' })
    expect(line).not.toContain(secret)
  })

  it('meta 는 target 문자열만(최대 20개)·modelName 만 — 그 밖은 버린다, 비어 있으면 meta 없음', () => {
    const secret = hex(6)
    const parsed = JSON.parse(
      formatLogLine({
        meta: {
          target: ['email', 7, null, ...Array.from({ length: 30 }, (_, i) => `f${i}`)],
          modelName: 'User',
          record: { email: secret },
        } as unknown as LogFields['meta'],
      }),
    )
    expect(parsed.meta.target).toHaveLength(20)
    expect(parsed.meta.target[0]).toBe('email')
    expect(parsed.meta.modelName).toBe('User')
    expect(Object.keys(parsed.meta)).toEqual(['target', 'modelName'])
    expect(JSON.stringify(parsed)).not.toContain(secret)
    expect('meta' in JSON.parse(formatLogLine({ meta: {} }))).toBe(false)
  })

  it('stack 에 프레임 형식이 없으면 줄 단위로 ≤10줄 마스킹해 남긴다', () => {
    const lines = Array.from({ length: 14 }, (_, i) => `line ${i}`)
    const parsed = JSON.parse(formatLogLine({ stack: lines.join('\n') }))
    expect(parsed.stack.split('\n')).toHaveLength(STACK_MAX_FRAMES)
  })

  it('필드 getter 가 throw 하면 고정 문구 — 입력 값이 섞이지 않는다', () => {
    const fields = {} as LogFields
    Object.defineProperty(fields, 'message', {
      enumerable: true,
      get() {
        throw new Error('hostile')
      },
    })
    expect(formatLogLine(fields)).toBe(LOG_FORMAT_FAILED_LINE)
    expect(JSON.parse(LOG_FORMAT_FAILED_LINE)).toEqual({
      level: 'error',
      event: 'log.format_failed',
    })
  })

  it('긴 문자열 필드는 상한으로 잘린다 (event·code 100, route 200)', () => {
    const parsed = JSON.parse(
      formatLogLine({ event: 'e '.repeat(250), code: 'c '.repeat(250), route: '/r'.repeat(300) }),
    )
    expect(parsed.event).toHaveLength(100)
    expect(parsed.code).toHaveLength(100)
    expect(parsed.route).toHaveLength(200)
  })
})
