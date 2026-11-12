import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

// FEATURES F01 — env 검증 실패 시 부팅 실패: 에러 이름·메시지(키 이름만) 한 줄, exitCode 1, 잠시 뒤 exit(1).
// mock 이 아니라 실제 env 모듈에 잘못된 값을 주어 진짜 실패를 만든다 (vi.mock 팩토리의 throw 는 vitest 가 자기 문구로 감싼다).

describe('instrumentation register()', () => {
  let errorSpy: MockInstance<typeof console.error>
  let exitSpy: MockInstance<typeof process.exit>
  const originalExitCode = process.exitCode

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    process.exitCode = originalExitCode
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('nodejs 런타임이 아니면 아무것도 하지 않는다', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge')
    const { register } = await import('./instrumentation')
    await register()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('env 로드 실패 → 마스킹된 한 줄(키 이름만) + exitCode 1 → 50ms 뒤 exit(1)', async () => {
    const token = randomUUID()
    vi.stubEnv('NEXT_RUNTIME', 'nodejs')
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined)
    vi.stubEnv('DATABASE_URL', `postgresql://u:${token}@h/db`)
    vi.stubEnv('DATABASE_URL_UNPOOLED', `not-a-url-${token}`)
    const { register } = await import('./instrumentation')
    await register()

    // 1줄: env 모듈의 env.invalid.server, 2줄: 여기서 남기는 boot_failed
    expect(errorSpy).toHaveBeenCalledTimes(2)
    const output = errorSpy.mock.calls.map((call) => String(call[0])).join('\n')
    expect(output).not.toContain(token)
    const parsed = JSON.parse(String(errorSpy.mock.calls[1]?.[0]))
    expect(parsed).toEqual({
      level: 'error',
      event: 'env.boot_failed',
      errorName: 'Error',
      message: 'Invalid environment variables (server): NEXT_PUBLIC_APP_URL, DATABASE_URL_UNPOOLED',
    })
    expect(process.exitCode).toBe(1)
    expect(exitSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
