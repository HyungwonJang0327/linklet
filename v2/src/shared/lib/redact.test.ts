import { randomBytes, randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { MESSAGE_MAX_LENGTH, normalizeMessage, redact } from './redact'

// CLAUDE.md §4-2 로그 규약 — 마스킹 뒤 출력에 원본 비밀값·개인정보가 남지 않는다.
// 가짜 값은 전부 무작위 생성 — 테스트 파일에 진짜처럼 보이는 토큰을 적지 않는다.

const hex = (bytes: number) => randomBytes(bytes).toString('hex')
const base64url = (bytes: number) => randomBytes(bytes).toString('base64url')
const fakeJwt = () => `${base64url(24)}.${base64url(48)}.${base64url(32)}`

describe('redact', () => {
  it('이메일 → ***@***', () => {
    const local = `user.${hex(4)}+tag`
    const text = `login failed for ${local}@mail.example.com and ${local}@sub.example.co.kr`
    const out = redact(text)
    expect(out).not.toContain(local)
    expect(out).not.toContain('mail.example.com')
    expect(out).toBe('login failed for ***@*** and ***@***')
  })

  it('이메일 우회 — `%40` 인코딩·유니코드 로컬파트도 ***@***', () => {
    const local = `john.doe${hex(2)}`
    const out = redact(
      `/api/w/${local}%40gmail.com and 김철수${hex(2)}@example.com and ユーザー@例え.jp`,
    )
    expect(out).not.toContain(local)
    expect(out).not.toContain('김철수')
    expect(out).not.toContain('ユーザー')
    expect(out).toBe('/api/w/***@*** and ***@*** and ***@***')
  })

  it('Basic 인증 → Basic ***', () => {
    const credential = Buffer.from(`user:${hex(6)}`).toString('base64')
    const out = redact(`Authorization: Basic ${credential}`)
    expect(out).not.toContain(credential)
    // 스킴 이름은 대소문자 무관(RFC 7235) — 치환 문구는 고정
    expect(redact(`basic ${credential}`)).toBe('Basic ***')
  })

  it('Cookie / Set-Cookie 헤더는 값 전체(줄 끝까지) → ***', () => {
    const v = hex(4)
    const out = redact(`Cookie: a=${v}; csrf=${v}; session=${v}\nnext line`)
    expect(out).toBe('Cookie: ***\nnext line')
    expect(out).not.toContain(v)
    expect(redact(`set-cookie: better-auth.session_token=${v}; Path=/; HttpOnly`)).toBe(
      'set-cookie: ***',
    )
  })

  it('JWT 세 조각 → ***', () => {
    const jwt = fakeJwt()
    const out = redact(`session ${jwt} rejected`)
    for (const segment of jwt.split('.')) expect(out).not.toContain(segment)
    expect(out).toBe('session *** rejected')
  })

  it('Bearer 토큰 → Bearer ***', () => {
    const token = base64url(40)
    const out = redact(`request with Bearer ${token} header`)
    expect(out).not.toContain(token)
    expect(out).toBe('request with Bearer *** header')
    // 헤더 형태는 Bearer 규칙 뒤에 key 규칙(authorization:)이 한 번 더 지운다 — 토큰은 어느 쪽에도 없다
    expect(redact(`Authorization: Bearer ${token}`)).not.toContain(token)
  })

  it.each([
    ['token=', (v: string) => `callback?token=${v}&x=1`],
    ['access_token:', (v: string) => `access_token: ${v}`],
    ['api_key=', (v: string) => `api_key=${v}`],
    ['secret=', (v: string) => `client_secret=${v};`],
    ['password:', (v: string) => `password: "${v}"`],
    ['JSON "apiKey"', (v: string) => `{"apiKey": "${v}", "n": 1}`],
    ['cookie=', (v: string) => `cookie=${v}`],
    ['sessionId=', (v: string) => `sessionId=${v}`],
    // security-reviewer F01 (2026-11-12) — 민감어 확장
    ['pass=', (v: string) => `pass=${v}`],
    ['auth=', (v: string) => `auth=${v}`],
    ['sig=', (v: string) => `sig=${v}`],
    ['X-Amz-Signature=', (v: string) => `X-Amz-Signature=${v}`],
    ['private_key:', (v: string) => `private_key: ${v}`],
    ['csrf=', (v: string) => `csrf=${v}`],
    ['otp=', (v: string) => `otp=${v}`],
    ['state=', (v: string) => `state=${v}`],
  ])('%s 값 → ***', (_label, build) => {
    // 짧은 값(hex 규칙에 안 걸림)으로 키 규칙만 검증한다
    const value = `v${hex(5)}`
    const out = redact(build(value))
    expect(out).not.toContain(value)
    expect(out).toContain('***')
  })

  it('postgres(ql):// 접속 문자열은 통째로 postgresql://***', () => {
    const user = `u${hex(3)}`
    const pass = `p${hex(6)}`
    const host = `h${hex(3)}.neon.tech`
    for (const scheme of ['postgresql', 'postgres', 'POSTGRES']) {
      const out = redact(`connect ${scheme}://${user}:${pass}@${host}:5432/db?sslmode=require end`)
      expect(out).toBe('connect postgresql://*** end')
      expect(out).not.toContain(user)
      expect(out).not.toContain(pass)
      expect(out).not.toContain(host)
    }
  })

  it('다른 스킴의 user:pass@ 도 가린다 (mysql·redis·https)', () => {
    const pass = `p${hex(6)}`
    const out = redact(
      `mysql://root:${pass}@db.internal/app redis://:${pass}@cache https://a:${pass}@h/`,
    )
    expect(out).not.toContain(pass)
    expect(out).toBe('mysql://***@db.internal/app redis://***@cache https://***@h/')
  })

  it('URL 쿼리스트링 → ?*** (경로는 남긴다)', () => {
    const sig = hex(8)
    const out = redact(`GET https://cdn.example.com/img/a.png?X-Amz-Signature=${sig}&e=1 failed`)
    expect(out).toBe('GET https://cdn.example.com/img/a.png?*** failed')
    expect(out).not.toContain(sig)
  })

  it('32자 이상 hex 토큰 → ***', () => {
    const token = hex(16) // 32자
    const longer = hex(32) // 64자
    const out = redact(`ids ${token} and ${longer}`)
    expect(out).toBe('ids *** and ***')
  })

  it('32자 이상 base64url 조각·UUID → ***', () => {
    const token = base64url(33)
    const uuid = randomUUID()
    const out = redact(`k ${token} u ${uuid}`)
    expect(out).toBe('k *** u ***')
  })

  it('짧은 hex(31자)·파일 경로·스택 위치는 남긴다 (경로 구분자는 토큰 문자 집합 밖)', () => {
    const short = hex(15).slice(0, 31)
    const path = '/var/task/node_modules/next/dist/server/lib/router-server.js:1234:56'
    expect(redact(short)).toBe(short)
    expect(redact(path)).toBe(path)
    expect(redact('file:///Users/someone/projects/linklet/v2/src/server/api-handler.ts:10:3')).toBe(
      'file:///Users/someone/projects/linklet/v2/src/server/api-handler.ts:10:3',
    )
  })

  it('문자열이 아닌 값·실패에도 throw 하지 않는다', () => {
    expect(() => redact(undefined as unknown as string)).not.toThrow()
    expect(() => redact({ toString: () => 'x' } as unknown as string)).not.toThrow()
    expect(
      redact({
        toString() {
          throw new Error('nope')
        },
      } as unknown as string),
    ).toBe('(unreadable)')
  })
})

describe('normalizeMessage', () => {
  it('개행·캐리지 리턴(과 주변 공백)을 공백 하나로', () => {
    expect(normalizeMessage('a\n  b\r\n\tc\rd')).toBe('a b c d')
  })

  it(`${MESSAGE_MAX_LENGTH}자 상한 — 넘으면 자르고 … 표시`, () => {
    // 띄어쓰기 있는 글 — 32자+ 토큰 규칙에 걸리지 않는 보통 문장
    const out = normalizeMessage('word '.repeat(70))
    expect(out.length).toBe(MESSAGE_MAX_LENGTH)
    expect(out.endsWith('…')).toBe(true)
    const exact = `${'ab '.repeat(99)}abc`
    expect(exact).toHaveLength(MESSAGE_MAX_LENGTH)
    expect(normalizeMessage(exact)).toBe(exact)
  })

  it('마스킹을 먼저 하고 자른다 — 300자 경계에 걸친 토큰이 새지 않는다', () => {
    const token = hex(20)
    const out = normalizeMessage(`${'p '.repeat((MESSAGE_MAX_LENGTH - 10) / 2)}${token}`)
    expect(out).not.toContain(token.slice(0, 8))
  })
})
