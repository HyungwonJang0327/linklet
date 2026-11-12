import { describe, expect, it } from 'vitest'
import * as z from 'zod/mini'

import { AppError, ERROR_CODE_TABLE } from './api-error'
import { FIELD_PATH_MAX, parseOrThrow, toFieldErrors } from './validation'

// decisions/api-response.md V2 — 검증 실패는 400 VALIDATION_FAILED + details[{ path, code }]

function issuesOf(schema: z.core.$ZodType, data: unknown): z.core.$ZodIssue[] {
  const result = z.safeParse(schema, data)
  if (result.success) throw new Error('expected failure')
  return result.error.issues
}

describe('toFieldErrors', () => {
  it('path 는 점으로 이은 문자열, code 는 Zod issue code 그대로', () => {
    const issues = issuesOf(z.object({ title: z.string() }), { title: 1 })
    expect(toFieldErrors(issues)).toEqual([{ path: 'title', code: 'invalid_type' }])
  })

  it('중첩 객체·배열 인덱스는 숫자도 문자열로 이어 붙인다', () => {
    const schema = z.object({
      items: z.array(z.object({ productUrl: z.url() })),
    })
    const issues = issuesOf(schema, {
      items: [{ productUrl: 'https://ok.example' }, { productUrl: 'nope' }],
    })
    expect(toFieldErrors(issues)).toEqual([{ path: 'items.1.productUrl', code: 'invalid_format' }])
  })

  it('루트 이슈의 path 는 빈 문자열', () => {
    const issues = issuesOf(z.object({ a: z.string() }), 'not an object')
    expect(toFieldErrors(issues)).toEqual([{ path: '', code: 'invalid_type' }])
  })

  it('이슈가 여럿이면 순서대로 전부', () => {
    const schema = z.object({ a: z.string(), b: z.number().check(z.minimum(1)) })
    const issues = issuesOf(schema, { a: 1, b: 0 })
    expect(toFieldErrors(issues)).toEqual([
      { path: 'a', code: 'invalid_type' },
      { path: 'b', code: 'too_small' },
    ])
  })

  it('Zod message 는 details 에 넣지 않는다 — 키는 path·code 둘뿐', () => {
    const issues = issuesOf(z.object({ a: z.string() }), {})
    expect(issues[0]?.message).toBeTruthy()
    for (const fieldError of toFieldErrors(issues)) {
      expect(Object.keys(fieldError).sort()).toEqual(['code', 'path'])
    }
    expect(JSON.stringify(toFieldErrors(issues))).not.toContain(issues[0]?.message)
  })

  it(`path 길이는 ${FIELD_PATH_MAX} 자에서 잘린다`, () => {
    const longKey = 'k'.repeat(FIELD_PATH_MAX * 2)
    const issues: z.core.$ZodIssue[] = [
      { code: 'invalid_type', expected: 'string', path: [longKey, 'x'], message: 'm', input: 1 },
    ]
    const [fieldError] = toFieldErrors(issues)
    expect(fieldError?.path).toHaveLength(FIELD_PATH_MAX)
    expect(fieldError?.path).toBe(longKey.slice(0, FIELD_PATH_MAX))
  })

  it('custom check 의 code 는 custom', () => {
    const schema = z.string().check(z.refine((s) => s.startsWith('https://')))
    expect(toFieldErrors(issuesOf(schema, 'http://x'))).toEqual([{ path: '', code: 'custom' }])
  })
})

describe('parseOrThrow', () => {
  const schema = z.object({
    title: z.string().check(z.minLength(1)),
    count: z.optional(z.number()),
  })

  it('성공이면 파싱된(변환 적용) 값을 돌려준다', () => {
    const trimmed = z.object({ title: z.string().check(z.trim()) })
    expect(parseOrThrow(trimmed, { title: '  hi  ' })).toEqual({ title: 'hi' })
    expect(parseOrThrow(schema, { title: 'a' })).toEqual({ title: 'a' })
  })

  it('실패면 AppError VALIDATION_FAILED(400) + details', () => {
    let caught: unknown
    try {
      parseOrThrow(schema, { title: '', count: 'x' })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(AppError)
    const error = caught as AppError
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.status).toBe(400)
    expect(error.message).toBe(ERROR_CODE_TABLE.VALIDATION_FAILED.message)
    expect(error.details).toEqual([
      { path: 'title', code: 'too_small' },
      { path: 'count', code: 'invalid_type' },
    ])
  })

  it('입력에 들어 있던 값이 에러 객체의 message·details 에 새지 않는다', () => {
    const secret = `secret-${crypto.randomUUID()}`
    let caught: AppError | undefined
    try {
      parseOrThrow(z.object({ token: z.number() }), { token: secret })
    } catch (e) {
      caught = e as AppError
    }
    expect(JSON.stringify({ message: caught?.message, details: caught?.details })).not.toContain(
      secret,
    )
  })
})
