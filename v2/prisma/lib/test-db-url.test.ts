import { describe, expect, it } from 'vitest'

import { isLocalDatabaseUrl } from './local-db.mts'
import {
  TEST_DB_DEFAULT_PORT,
  resolveTestDatabasePort,
  testDatabaseTarget,
  testDatabaseUrl,
} from './test-db-url.mts'

// 테스트 DB URL 조립 — vitest.setup.ts 와 globalSetup 이 같은 값을 쓰는지 고정한다 (decisions/testing.md T5·T10)
// 아래 값은 docker-compose.yml 의 더미 고정값(시크릿 아님)

describe('resolveTestDatabasePort', () => {
  it('비어 있으면 기본 포트 5434', () => {
    expect(resolveTestDatabasePort(undefined)).toBe(TEST_DB_DEFAULT_PORT)
    expect(resolveTestDatabasePort('')).toBe('5434')
    expect(resolveTestDatabasePort('  ')).toBe('5434')
  })

  it('숫자 문자열은 공백을 떼고 그대로', () => {
    expect(resolveTestDatabasePort(' 15434 ')).toBe('15434')
  })

  it.each(['abc', '54a4', '-1', '0', '70000', '1.5'])('포트가 아니면 throw: %j', (raw) => {
    expect(() => resolveTestDatabasePort(raw)).toThrow('LINKLET_TEST_DB_PORT')
  })
})

describe('testDatabaseUrl', () => {
  it('기본값은 127.0.0.1:5434/linklet_test (compose db-test 와 일치)', () => {
    expect(testDatabaseUrl(undefined)).toBe(
      'postgresql://linklet:linklet@127.0.0.1:5434/linklet_test',
    )
  })

  it('포트만 바뀐다', () => {
    const url = new URL(testDatabaseUrl('15434'))
    expect(url.hostname).toBe('127.0.0.1')
    expect(url.port).toBe('15434')
    expect(url.pathname).toBe('/linklet_test')
  })

  it('항상 로컬 판정을 통과한다 (가드 모듈과 일관)', () => {
    expect(isLocalDatabaseUrl(testDatabaseUrl(undefined))).toBe(true)
    expect(isLocalDatabaseUrl(testDatabaseUrl('5999'))).toBe(true)
  })
})

describe('testDatabaseTarget', () => {
  it('URL 과 같은 host·port 를 가리킨다', () => {
    const url = new URL(testDatabaseUrl('5434'))
    expect(testDatabaseTarget('5434')).toEqual({ host: url.hostname, port: Number(url.port) })
    expect(testDatabaseTarget(undefined)).toEqual({ host: '127.0.0.1', port: 5434 })
  })
})
