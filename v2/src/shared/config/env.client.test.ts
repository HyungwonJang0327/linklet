import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

// FEATURES F01 — 클라이언트 스키마는 NEXT_PUBLIC_* 만, 서버 모듈을 끌고 오지 않는다.

const CLIENT_KEYS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
] as const

function stubAll(values: Partial<Record<(typeof CLIENT_KEYS)[number], string | undefined>>) {
  for (const key of CLIENT_KEYS) vi.stubEnv(key, values[key])
}

async function loadClientEnv() {
  return import('./env.client')
}

describe('클라이언트 환경변수 스키마 (env.client.ts)', () => {
  let errorSpy: MockInstance<typeof console.error>

  beforeEach(() => {
    vi.resetModules()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('정상 — NEXT_PUBLIC_APP_URL 만 있으면 로드, optional 은 undefined, frozen', async () => {
    stubAll({ NEXT_PUBLIC_APP_URL: 'https://linklet.example' })

    const { clientEnv } = await loadClientEnv()

    expect(clientEnv).toEqual({
      NEXT_PUBLIC_APP_URL: 'https://linklet.example',
      NEXT_PUBLIC_SENTRY_DSN: undefined,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
    })
    expect(Object.isFrozen(clientEnv)).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('빈 문자열 optional 은 undefined, 값이 있으면 그대로', async () => {
    stubAll({
      NEXT_PUBLIC_APP_URL: 'http://localhost:3002',
      NEXT_PUBLIC_SENTRY_DSN: '',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST000000',
    })

    const { clientEnv } = await loadClientEnv()

    expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined()
    expect(clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBe('G-TEST000000')
  })

  it('NEXT_PUBLIC_APP_URL 누락 → throw, 메시지에 키 이름', async () => {
    stubAll({ NEXT_PUBLIC_APP_URL: undefined })

    await expect(loadClientEnv()).rejects.toThrow(
      'Invalid environment variables (client): NEXT_PUBLIC_APP_URL',
    )
    expect(JSON.parse(String(errorSpy.mock.calls[0]?.[0]))).toEqual({
      level: 'error',
      event: 'env.invalid',
      scope: 'client',
      details: [{ path: 'NEXT_PUBLIC_APP_URL', code: 'invalid_type' }],
    })
  })

  it('형식 오류(http(s) URL 아님) → 키·code 만, 값은 출력에 없다', async () => {
    const token = randomUUID()
    stubAll({
      NEXT_PUBLIC_APP_URL: `ftp://${token}`,
      NEXT_PUBLIC_SENTRY_DSN: `dsn-${token}`,
    })

    await expect(loadClientEnv()).rejects.toThrow(/NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SENTRY_DSN$/)

    const output = errorSpy.mock.calls.map((call) => call.map(String).join(' ')).join('\n')
    expect(JSON.parse(output).details).toEqual([
      { path: 'NEXT_PUBLIC_APP_URL', code: 'invalid_format' },
      { path: 'NEXT_PUBLIC_SENTRY_DSN', code: 'invalid_format' },
    ])
    expect(output).not.toContain(token)
  })

  describe('소스 규약 (Next 인라인 규칙·서버 혼입 방지)', () => {
    // 주석은 뺀다 — 규칙 설명 주석이 패턴에 걸리지 않게. 코드만 검사한다
    const source = readFileSync(fileURLToPath(new URL('./env.client.ts', import.meta.url)), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    it("'server-only' 와 서버 스키마(./env) 를 import 하지 않는다", () => {
      expect(source).not.toContain("'server-only'")
      expect(source).not.toMatch(/from\s+'\.\/env'/)
    })

    it.each(CLIENT_KEYS)('%s 는 `process.env.KEY` 로 정적 참조한다 (빌드 시 치환 조건)', (key) => {
      expect(source).toContain(`process.env.${key}`)
    })

    it('동적 접근(`process.env[`)·별칭(`= process.env`)이 없다', () => {
      expect(source).not.toMatch(/process\.env\[/)
      expect(source).not.toMatch(/=\s*process\.env\s*$/m)
    })
  })
})
