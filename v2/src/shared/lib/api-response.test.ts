import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppError } from './api-error'
import {
  fail,
  noContent,
  ok,
  okList,
  toErrorResponse,
  UNEXPECTED_ERROR_MESSAGE,
} from './api-response'

// decisions/api-response.md R1~R5, error-handling.md E1·E2·E5 — 헬퍼가 스키마대로만 응답한다

describe('ok', () => {
  it('{ data } 200', async () => {
    const res = ok({ id: '1', name: null })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual({ data: { id: '1', name: null } })
  })

  it('생성은 201 로 지정할 수 있다', async () => {
    const res = ok({ id: '1' }, { status: 201, headers: { Location: '/api/wishlists/1' } })
    expect(res.status).toBe(201)
    expect(res.headers.get('location')).toBe('/api/wishlists/1')
    expect(await res.json()).toEqual({ data: { id: '1' } })
  })
})

describe('okList', () => {
  it('{ data: T[], nextCursor } 200', async () => {
    const res = okList([{ id: '1' }, { id: '2' }], 'cursor-2')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [{ id: '1' }, { id: '2' }], nextCursor: 'cursor-2' })
  })

  it('빈 결과는 빈 배열 + nextCursor null (R4) — null 배열이 아니다', async () => {
    const res = okList([], null)
    expect(await res.json()).toEqual({ data: [], nextCursor: null })
  })
})

describe('noContent', () => {
  it('204, 본문 없음 (R5)', async () => {
    const res = noContent()
    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
    expect(await res.text()).toBe('')
  })
})

describe('fail', () => {
  it('{ error: { code, message } } + 코드에 매핑된 상태', async () => {
    const res = fail(new AppError('NOT_FOUND', 'wishlist not found'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'wishlist not found' },
    })
  })

  it('details 가 있으면 { path, code }[] 그대로 포함', async () => {
    const details = [{ path: 'productUrl', code: 'invalid_url' }]
    const res = fail(new AppError('VALIDATION_FAILED', 'invalid body', details))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: { code: 'VALIDATION_FAILED', message: 'invalid body', details },
    })
  })

  it('details 가 없으면 키 자체가 없다', async () => {
    // R6 "값 없는 필드 null" 은 도메인 데이터 규칙. details 는 에러 메타(E1 에서 `details?`)라 생략한다
    const body = await fail(new AppError('CONFLICT')).json()
    expect(Object.keys(body.error).sort()).toEqual(['code', 'message'])
    expect('details' in body.error).toBe(false)
  })

  it('본문 최상위 키는 error 하나뿐이다', async () => {
    const body = await fail(new AppError('FORBIDDEN')).json()
    expect(Object.keys(body)).toEqual(['error'])
  })
})

describe('toErrorResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('AppError 는 그대로 fail 로 — 로그 훅은 호출하지 않는다 (E5: 예상된 실패는 기록 안 함)', async () => {
    const onUnexpectedError = vi.fn()
    const res = toErrorResponse(new AppError('UNAUTHENTICATED'), onUnexpectedError)
    expect(res.status).toBe(401)
    expect((await res.json()).error.code).toBe('UNAUTHENTICATED')
    expect(onUnexpectedError).not.toHaveBeenCalled()
  })

  it('일반 Error 는 500 INTERNAL + 고정 문구. 원본 메시지는 본문에 없다 (AUDIT H8 회귀)', async () => {
    const original = new Error('secret db password leaked in message')
    const res = toErrorResponse(original, () => {})
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toContain('secret')
    expect(text).not.toContain('stack')
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL', message: UNEXPECTED_ERROR_MESSAGE },
    })
  })

  it.each([
    ['문자열', 'secret token string'],
    ['undefined', undefined],
    ['null', null],
    ['숫자', 42],
    ['객체', { code: 'NOT_FOUND', message: 'looks like AppError but is not' }],
  ])('%s 를 throw 해도 500 INTERNAL 일반 문구', async (_label, thrown) => {
    const res = toErrorResponse(thrown, () => {})
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toContain('secret')
    expect(text).not.toContain('looks like')
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL', message: UNEXPECTED_ERROR_MESSAGE },
    })
  })

  it('예상 못한 실패에서만 로그 훅이 원본 값을 받는다', () => {
    const onUnexpectedError = vi.fn()
    const original = new TypeError('boom')
    toErrorResponse(original, onUnexpectedError)
    expect(onUnexpectedError).toHaveBeenCalledTimes(1)
    expect(onUnexpectedError).toHaveBeenCalledWith(original)
  })

  it('기본 로그 훅은 에러 이름·메시지만 한 줄 JSON 으로 남긴다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    toErrorResponse(new RangeError('out of range'))
    expect(spy).toHaveBeenCalledTimes(1)
    const line = spy.mock.calls[0]?.[0]
    expect(typeof line).toBe('string')
    expect(JSON.parse(line as string)).toEqual({
      level: 'error',
      event: 'unexpected_error',
      name: 'RangeError',
      message: 'out of range',
    })
  })

  it('기본 로그 훅은 Error 가 아닌 값의 내용을 남기지 않는다 (타입만)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    toErrorResponse('raw secret string')
    const line = spy.mock.calls[0]?.[0] as string
    expect(line).not.toContain('secret')
    expect(JSON.parse(line)).toMatchObject({ name: 'NonError', message: 'string' })
  })
})
