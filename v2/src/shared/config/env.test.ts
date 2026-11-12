import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

// FEATURES F01 — 필수 키 누락 시 부팅(모듈 로드) 실패, 출력에 값 없음.
// 모듈이 로드 시 1회 파싱하므로 케이스마다 vi.resetModules() 후 동적 import 로 새로 로드한다.

const REQUIRED_KEYS = ['NEXT_PUBLIC_APP_URL', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const
const OPTIONAL_KEYS = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
] as const

/** 테스트용 더미 — 실제 접속 정보가 아니다. 토큰을 섞어 출력 누출을 추적한다 */
function validValues(token: string) {
  return {
    NODE_ENV: 'test',
    NEXT_PUBLIC_APP_URL: `https://${token}.example`,
    DATABASE_URL: `postgresql://user:${token}@127.0.0.1:5433/db`,
    DATABASE_URL_UNPOOLED: `postgres://user:${token}@127.0.0.1:5433/db`,
  }
}

function stubAll(values: Record<string, string | undefined>) {
  // 개발자 셸에 같은 이름의 변수가 있어도 테스트 결과가 달라지지 않게 전부 명시한다
  for (const key of ['NODE_ENV', ...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
    vi.stubEnv(key, values[key])
  }
}

async function loadEnv() {
  return import('./env')
}

function logLines(spy: MockInstance<typeof console.error>): string[] {
  return spy.mock.calls.map((call) => call.map(String).join(' '))
}

describe('서버 환경변수 스키마 (env.ts)', () => {
  let errorSpy: MockInstance<typeof console.error>

  beforeEach(() => {
    vi.resetModules()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('정상 — 필수 키만 있으면 로드되고 optional 은 undefined, 객체는 frozen', async () => {
    const token = randomUUID()
    stubAll(validValues(token))

    const { env } = await loadEnv()

    expect(env.NODE_ENV).toBe('test')
    expect(env.NEXT_PUBLIC_APP_URL).toBe(`https://${token}.example`)
    expect(env.DATABASE_URL).toBe(`postgresql://user:${token}@127.0.0.1:5433/db`)
    for (const key of OPTIONAL_KEYS) expect(env[key]).toBeUndefined()
    expect(Object.isFrozen(env)).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('optional 키가 빈 문자열(`KEY=`)이면 undefined 로, 값이 있으면 그대로', async () => {
    stubAll({
      ...validValues(randomUUID()),
      BETTER_AUTH_SECRET: '',
      R2_BUCKET: 'linklet-images',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@o0.ingest.sentry.example/1',
    })

    const { env } = await loadEnv()

    expect(env.BETTER_AUTH_SECRET).toBeUndefined()
    expect(env.R2_BUCKET).toBe('linklet-images')
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe('https://public@o0.ingest.sentry.example/1')
  })

  it.each(REQUIRED_KEYS)('필수 키 %s 누락 → throw, 메시지에 키 이름', async (missing) => {
    stubAll({ ...validValues(randomUUID()), [missing]: undefined })

    await expect(loadEnv()).rejects.toThrow(`Invalid environment variables (server): ${missing}`)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('필수 키가 빈 문자열이어도 누락으로 본다', async () => {
    stubAll({ ...validValues(randomUUID()), DATABASE_URL: '' })

    await expect(loadEnv()).rejects.toThrow('DATABASE_URL')
  })

  it('형식 오류 — URL 이 아니면 details 에 키·code 만 (값·Zod message 없음)', async () => {
    const bad = randomUUID()
    stubAll({
      ...validValues(randomUUID()),
      NEXT_PUBLIC_APP_URL: `not-a-url-${bad}`,
      DATABASE_URL: `mysql://${bad}@h/db`,
    })

    await expect(loadEnv()).rejects.toThrow(
      'Invalid environment variables (server): NEXT_PUBLIC_APP_URL, DATABASE_URL',
    )

    const [line] = logLines(errorSpy)
    const parsed = JSON.parse(line ?? '')
    expect(Object.keys(parsed).sort()).toEqual(['details', 'event', 'level'])
    expect(parsed).toMatchObject({ level: 'error', event: 'env.invalid.server' })
    expect(parsed.details).toEqual([
      { path: 'NEXT_PUBLIC_APP_URL', code: 'invalid_format' },
      { path: 'DATABASE_URL', code: 'invalid_format' },
    ])
    expect(line).not.toContain(bad)
  })

  it('NODE_ENV 는 development·test·production 만', async () => {
    stubAll({ ...validValues(randomUUID()), NODE_ENV: 'prod' })

    await expect(loadEnv()).rejects.toThrow('NODE_ENV')
    expect(JSON.parse(logLines(errorSpy)[0] ?? '').details).toEqual([
      { path: 'NODE_ENV', code: 'invalid_value' },
    ])
  })

  it('실패 출력·에러 메시지 어디에도 값이 없다 (F01: 앞 10자 출력 재발 금지)', async () => {
    // 모든 키에 서로 다른 토큰을 넣고 — 유효한 것, 형식이 틀린 것, 비어 있는 것을 섞는다
    const tokens: Record<string, string> = {}
    const values: Record<string, string | undefined> = { NODE_ENV: 'test' }
    for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
      tokens[key] = randomUUID()
      values[key] = `value-${tokens[key]}` // URL 키는 전부 형식 오류, 나머지는 유효
    }
    values.DATABASE_URL_UNPOOLED = undefined
    stubAll(values)

    let thrown: unknown
    try {
      await loadEnv()
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)
    const message = (thrown as Error).message
    const output = logLines(errorSpy).join('\n')
    expect(output).not.toBe('')
    for (const token of Object.values(tokens)) {
      expect(output).not.toContain(token)
      expect(message).not.toContain(token)
    }
    // 틀린 키는 메시지에 있다 (디버깅용) — 값은 없다
    expect(message).toContain('NEXT_PUBLIC_APP_URL')
    expect(message).toContain('DATABASE_URL_UNPOOLED')
  })

  it('.env.example 의 키 목록 == SERVER_ENV_KEYS − NODE_ENV (문서·코드 드리프트 방지)', async () => {
    stubAll(validValues(randomUUID()))
    const { SERVER_ENV_KEYS } = await loadEnv()

    const examplePath = fileURLToPath(new URL('../../../.env.example', import.meta.url))
    const exampleKeys = readFileSync(examplePath, 'utf8')
      .split('\n')
      .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
      .filter((key): key is string => key !== undefined)

    const schemaKeys = SERVER_ENV_KEYS.filter((key) => key !== 'NODE_ENV')
    expect([...exampleKeys].sort()).toEqual([...schemaKeys].sort())
  })
})
