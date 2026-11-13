import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { Prisma } from '@/generated/prisma/client'

import { assertTlsInProduction, prismaLogEventToFields } from './db-config'

// FEATURES F02 — 운영 TLS 강제(사용자 결정 2026-11-14), Prisma 이벤트 → 로그 필드 매핑, Prisma 에러 클래스 이름(log-format 첫 줄 규칙 의존)

const hex = (bytes: number) => randomBytes(bytes).toString('hex')
/** 가짜 접속 문자열 — 호스트·비밀번호에 토큰을 넣어 에러 메시지 누출을 추적한다 */
function fakeUrl(query: string, token: string) {
  return `postgresql://u:${token}@ep-${token}.neon.tech:5432/db${query}`
}

describe('assertTlsInProduction', () => {
  it.each(['development', 'test'] as const)('%s 는 sslmode 없어도 그대로 돌려준다', (nodeEnv) => {
    const url = fakeUrl('', hex(4))
    expect(assertTlsInProduction(url, nodeEnv)).toBe(url)
  })

  it.each(['verify-full', 'require', 'verify-ca'])('production — sslmode=%s 통과', (sslmode) => {
    const url = fakeUrl(`?sslmode=${sslmode}`, hex(4))
    expect(assertTlsInProduction(url, 'production')).toBe(url)
  })

  it.each([
    '',
    '?application_name=x',
    '?sslmode=disable',
    '?sslmode=prefer',
    '?sslmode=no-verify',
    '?SSLMODE=require',
  ])('production — sslmode 없음·약함(%s) → throw, 메시지에 값 없음', (query) => {
    const token = hex(6)
    const url = fakeUrl(query, token)
    let thrown: unknown
    try {
      assertTlsInProduction(url, 'production')
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Error)
    const message = (thrown as Error).message
    expect(message).toContain('DATABASE_URL')
    expect(message).toContain('sslmode=verify-full')
    expect(message).not.toContain(token)
    expect(message).not.toContain('neon.tech')
  })

  it('production — uselibpqcompat=true 면 require(인증서 검증 없음)는 거부, verify-full 만', () => {
    expect(() =>
      assertTlsInProduction(fakeUrl('?uselibpqcompat=true&sslmode=require', hex(4)), 'production'),
    ).toThrow('sslmode=verify-full')
    const ok = fakeUrl('?uselibpqcompat=true&sslmode=verify-full', hex(4))
    expect(assertTlsInProduction(ok, 'production')).toBe(ok)
  })

  it('production — URL 로 해석되지 않으면 throw, 메시지에 입력 없음', () => {
    const junk = `not a url ${hex(6)}`
    expect(() => assertTlsInProduction(junk, 'production')).toThrow('valid postgresql:// URL')
    expect(() => assertTlsInProduction(junk, 'production')).not.toThrow(junk)
  })
})

describe('prismaLogEventToFields', () => {
  it('message 와 target 만 — timestamp 등 다른 필드는 버린다', () => {
    const fields = prismaLogEventToFields({
      timestamp: new Date(),
      message: 'Error in connector: connection closed',
      target: 'quaint::pooled',
    } as { message: string; target: string })
    expect(fields).toEqual({
      message: 'Error in connector: connection closed',
      meta: { target: ['quaint::pooled'] },
    })
  })

  it('문자열이 아닌 값은 빈 문자열·unknown 으로 — throw 하지 않는다', () => {
    const fields = prismaLogEventToFields({ message: undefined, target: 42 } as unknown as {
      message: string
      target: string
    })
    expect(fields).toEqual({ message: '', meta: { target: ['unknown'] } })
  })
})

describe('Prisma 에러 클래스', () => {
  it('PrismaClientValidationError.name 은 그 문자열이다 (shared/lib/log-format 의 첫 줄 규칙이 의존)', () => {
    const error = new Prisma.PrismaClientValidationError('Invalid invocation', {
      clientVersion: '7.10.0',
    })
    expect(error.name).toBe('PrismaClientValidationError')
    expect(error).toBeInstanceOf(Error)
  })
})
