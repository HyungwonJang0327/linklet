import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as z from 'zod/mini'

import { AppError, ERROR_CODE_TABLE } from '@/shared/lib/api-error'
import { ok } from '@/shared/lib/api-response'

import {
  BODY_ISSUE_CODE,
  createHandler,
  parseBody,
  parseParams,
  parseQuery,
  type RouteParams,
} from './api-handler'
import { logger } from './logger'

// server/logger 는 검증된 env 를 로드하므로 여기서는 mock — 래퍼가 "무엇을 넘기는지"(route·method)만 본다
vi.mock('./logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), unexpected: vi.fn() },
}))

// decisions/api-response.md V2, error-handling.md E2 — 래퍼가 모든 throw 를 { error } 응답으로 바꾸고, 입력 파싱 실패는 400

const BASE = 'http://localhost/api/test'

// contentType null 은 "헤더 없음" — string body 를 주면 fetch 가 text/plain 을 자동으로 붙이므로 본문도 뺀다
function jsonRequest(body: string, contentType: string | null = 'application/json'): NextRequest {
  if (contentType === null) return new NextRequest(BASE, { method: 'POST' })
  const headers = new Headers({ 'content-type': contentType })
  return new NextRequest(BASE, { method: 'POST', body, headers })
}

function ctxOf<P extends RouteParams = RouteParams>(params?: P): { params: Promise<P> } {
  return { params: Promise.resolve(params ?? ({} as P)) }
}

const itemSchema = z.object({
  title: z.string().check(z.minLength(1)),
  price: z.optional(z.number()),
})

describe('createHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('정상이면 핸들러가 돌려준 응답을 그대로 반환한다 (request·params 전달)', async () => {
    const GET = createHandler<{ id: string }>(async ({ request, params }) => {
      const { id } = await params
      return ok({ id, method: request.method })
    })
    const res = await GET(new NextRequest(`${BASE}/w1`), ctxOf({ id: 'w1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { id: 'w1', method: 'GET' } })
  })

  it('동기 함수도 감쌀 수 있다', async () => {
    const GET = createHandler(() => ok(null))
    expect(await (await GET(new NextRequest(BASE), ctxOf())).json()).toEqual({ data: null })
  })

  it('AppError 는 코드에 매핑된 상태로', async () => {
    const GET = createHandler(() => {
      throw new AppError('NOT_FOUND')
    })
    const res = await GET(new NextRequest(BASE), ctxOf())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: 'NOT_FOUND', message: ERROR_CODE_TABLE.NOT_FOUND.message },
    })
  })

  it('일반 Error 는 500 INTERNAL 고정 문구 — 원본 메시지가 본문에 없다 (H8)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const GET = createHandler(async () => {
      throw new Error('connection string postgres://user:pw@host/db')
    })
    const res = await GET(new NextRequest(BASE), ctxOf())
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toContain('postgres://')
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL', message: ERROR_CODE_TABLE.INTERNAL.message },
    })
  })

  it('Error 가 아닌 값을 throw 해도 500 INTERNAL', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const GET = createHandler(() => Promise.reject('raw string'))
    const res = await GET(new NextRequest(BASE), ctxOf())
    expect(res.status).toBe(500)
    expect((await res.json()).error.code).toBe('INTERNAL')
  })

  it('예상된 실패(AppError)는 로거에 넘기지 않고, 예상 못한 실패만 logger.unexpected 로 (E5)', async () => {
    const unexpected = vi.mocked(logger.unexpected)
    unexpected.mockClear()
    await createHandler(() => {
      throw new AppError('FORBIDDEN')
    })(new NextRequest(BASE), ctxOf())
    expect(unexpected).not.toHaveBeenCalled()

    const thrown = new TypeError('x')
    await createHandler(() => {
      throw thrown
    })(new NextRequest(`${BASE}?token=abc`, { method: 'POST' }), ctxOf())
    expect(unexpected).toHaveBeenCalledTimes(1)
    // route 는 pathname 만 — 쿼리스트링은 로그에 가지 않는다
    expect(unexpected).toHaveBeenCalledWith(thrown, { route: '/api/test', method: 'POST' })
  })

  it('로거가 throw 해도 500 INTERNAL JSON 이 나간다', async () => {
    vi.mocked(logger.unexpected).mockImplementationOnce(() => {
      throw new Error('logger down')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await createHandler(() => {
      throw new Error('x')
    })(new NextRequest(BASE), ctxOf())
    expect(res.status).toBe(500)
    expect((await res.json()).error.code).toBe('INTERNAL')
  })
})

describe('parseBody', () => {
  it('JSON body 를 스키마대로 파싱해 돌려준다', async () => {
    const value = await parseBody(
      jsonRequest(JSON.stringify({ title: 'a', price: 10 })),
      itemSchema,
    )
    expect(value).toEqual({ title: 'a', price: 10 })
  })

  it('Content-Type 에 charset 이 붙어도, +json 접미사도 JSON 으로 본다', async () => {
    const body = JSON.stringify({ title: 'a' })
    await expect(
      parseBody(jsonRequest(body, 'application/json; charset=utf-8'), itemSchema),
    ).resolves.toEqual({ title: 'a' })
    await expect(parseBody(jsonRequest(body, 'Application/JSON'), itemSchema)).resolves.toEqual({
      title: 'a',
    })
    await expect(
      parseBody(jsonRequest(body, 'application/vnd.api+json'), itemSchema),
    ).resolves.toEqual({ title: 'a' })
  })

  it.each([
    ['text/plain', 'text/plain'],
    ['form', 'application/x-www-form-urlencoded'],
    ['없음', null],
  ])(
    'Content-Type %s → 400 VALIDATION_FAILED, details [{ path: "", code: invalid_content_type }]',
    async (_label, contentType) => {
      const error = await parseBody(
        jsonRequest(JSON.stringify({ title: 'a' }), contentType),
        itemSchema,
      ).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('VALIDATION_FAILED')
      expect((error as AppError).status).toBe(400)
      expect((error as AppError).details).toEqual([
        { path: '', code: BODY_ISSUE_CODE.invalidContentType },
      ])
    },
  )

  it.each([
    ['잘린 JSON', '{"title": "a"'],
    ['빈 본문', ''],
    ['JS 객체 표기', "{ title: 'a' }"],
  ])(
    '%s → 400 VALIDATION_FAILED, details [{ path: "", code: invalid_json }]',
    async (_label, body) => {
      const error = await parseBody(jsonRequest(body), itemSchema).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('VALIDATION_FAILED')
      expect((error as AppError).details).toEqual([{ path: '', code: BODY_ISSUE_CODE.invalidJson }])
    },
  )

  it('JSON 은 맞지만 스키마와 다르면 details 에 필드 경로가 정확히 들어간다', async () => {
    const schema = z.object({ items: z.array(itemSchema) })
    const body = JSON.stringify({ items: [{ title: 'ok' }, { title: '', price: 'free' }] })
    const error = (await parseBody(jsonRequest(body), schema).catch((e: unknown) => e)) as AppError
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details).toEqual([
      { path: 'items.1.title', code: 'too_small' },
      { path: 'items.1.price', code: 'invalid_type' },
    ])
  })

  it('JSON 루트가 객체가 아니면 path "" 의 invalid_type', async () => {
    const error = (await parseBody(jsonRequest('null'), itemSchema).catch(
      (e: unknown) => e,
    )) as AppError
    expect(error.details).toEqual([{ path: '', code: 'invalid_type' }])
  })

  it('입력값·Zod 문구는 AppError 에 실리지 않는다', async () => {
    const secret = crypto.randomUUID()
    const error = (await parseBody(
      jsonRequest(JSON.stringify({ title: secret, price: secret })),
      itemSchema,
    ).catch((e: unknown) => e)) as AppError
    expect(JSON.stringify({ message: error.message, details: error.details })).not.toContain(secret)
  })

  it('래퍼 안에서 쓰면 400 { error } 응답이 된다', async () => {
    const POST = createHandler(async ({ request }) => ok(await parseBody(request, itemSchema)))
    const res = await POST(jsonRequest('{"title":1}'), ctxOf())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        code: 'VALIDATION_FAILED',
        message: ERROR_CODE_TABLE.VALIDATION_FAILED.message,
        details: [{ path: 'title', code: 'invalid_type' }],
      },
    })
  })
})

describe('parseQuery', () => {
  const querySchema = z.object({
    sort: z._default(z.enum(['newest', 'oldest']), 'newest'),
    limit: z.optional(z.pipe(z.string(), z.transform(Number))),
  })

  it('쿼리스트링을 객체로 바꿔 파싱한다', () => {
    const request = new NextRequest(`${BASE}?sort=oldest&limit=5`)
    expect(parseQuery(request, querySchema)).toEqual({ sort: 'oldest', limit: 5 })
  })

  it('없는 키는 default·optional 로 처리된다', () => {
    expect(parseQuery(new NextRequest(BASE), querySchema)).toEqual({ sort: 'newest' })
  })

  it('같은 키가 반복되면 마지막 값만 쓴다', () => {
    const request = new NextRequest(`${BASE}?sort=oldest&sort=newest`)
    expect(parseQuery(request, querySchema)).toEqual({ sort: 'newest' })
  })

  it('허용되지 않는 값은 400 VALIDATION_FAILED + 키 경로', () => {
    let error: unknown
    try {
      parseQuery(new NextRequest(`${BASE}?sort=random`), querySchema)
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).details).toEqual([{ path: 'sort', code: 'invalid_value' }])
  })
})

describe('parseParams', () => {
  const paramsSchema = z.object({ id: z.string().check(z.length(3)) })

  it('Promise 로 받은 params 를 await 해 파싱한다', async () => {
    await expect(parseParams(Promise.resolve({ id: 'abc' }), paramsSchema)).resolves.toEqual({
      id: 'abc',
    })
  })

  it('catch-all 세그먼트(string[])도 스키마로 받을 수 있다', async () => {
    const schema = z.object({ slug: z.array(z.string()) })
    await expect(parseParams(Promise.resolve({ slug: ['a', 'b'] }), schema)).resolves.toEqual({
      slug: ['a', 'b'],
    })
  })

  it('형식이 틀리면 400 VALIDATION_FAILED (404 는 서비스가 판단)', async () => {
    const error = (await parseParams(Promise.resolve({ id: 'too-long' }), paramsSchema).catch(
      (e: unknown) => e,
    )) as AppError
    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details).toEqual([{ path: 'id', code: 'too_big' }])
  })
})
