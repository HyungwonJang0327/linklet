import { describe, expect, it } from 'vitest'

import {
  assertLocalDatabaseUrl,
  isLocalDatabaseUrl,
  nonLocalDatabaseMessage,
  prismaCommandNeedsDatabase,
} from './local-db.mts'

// 가드 공용 모듈 — 로컬 판정·비로컬 거부·메시지에 값 없음 (todo/migrator-todo.md "CLI 접속 문자열 환경 가드" 완료 조건)
// 아래 접속 문자열은 모두 가짜 예시다(시크릿 아님)

const LOCAL_URLS = [
  'postgresql://linklet:linklet@127.0.0.1:5433/linklet_dev',
  'postgresql://linklet:linklet@localhost:5433/linklet_dev',
  'postgresql://linklet:linklet@LOCALHOST/linklet_dev',
  'postgres://linklet@[::1]:5434/linklet_test',
  'postgresql://127.0.0.1/db',
]

const REMOTE_URLS = [
  'postgresql://u:p@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full',
  'postgresql://u:p@db.example.com:5432/app',
  'postgresql://u:p@10.0.0.5/app',
  'postgresql://u:p@host.docker.internal:5433/app',
  'postgresql://u:p@127.0.0.2/app', // loopback 이지만 목록 밖 — 보수적으로 거부
  'postgresql://u:p@127.1/app', // 축약형 — URL 이 정규화하지 않으므로 거부
  'postgresql://u:p@localhost.evil.example/app',
  'postgresql://u:p@0.0.0.0/app',
]

const UNPARSEABLE = [
  '',
  'not a url',
  'localhost:5433',
  '127.0.0.1',
  'postgresql:///db?host=/var/run/postgresql',
]

describe('isLocalDatabaseUrl', () => {
  it.each(LOCAL_URLS)('로컬 호스트 → true: %s', (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(true)
  })

  it.each(REMOTE_URLS)('비로컬 호스트 → false: %s', (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(false)
  })

  it.each(UNPARSEABLE)('해석 불가·호스트 없음 → false (확인 못 하면 거부): %j', (value) => {
    expect(isLocalDatabaseUrl(value)).toBe(false)
  })
})

describe('assertLocalDatabaseUrl', () => {
  const hint = 'Point it at 127.0.0.1.'

  it('값이 없거나 빈 문자열이면 통과 (DB 없는 CI generate)', () => {
    expect(() => assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', undefined, { hint })).not.toThrow()
    expect(() => assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', '', { hint })).not.toThrow()
    expect(() => assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', '   ', { hint })).not.toThrow()
  })

  it('로컬이면 통과', () => {
    for (const url of LOCAL_URLS) {
      expect(() => assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', url, { hint })).not.toThrow()
    }
  })

  it('비로컬이면 throw — 메시지에 키 이름·안내만 있고 값(호스트·비밀번호·DB명)이 없다', () => {
    const remote = REMOTE_URLS[0]!
    let caught: unknown
    try {
      assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', remote, { hint })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(Error)
    const message = (caught as Error).message
    expect(message).toContain('DATABASE_URL_UNPOOLED')
    expect(message).toContain(hint)
    expect(message).toContain('value not shown')
    expect(message).not.toContain(remote)
    expect(message).not.toContain('neon.tech')
    expect(message).not.toContain('neondb')
    expect(message).not.toContain('u:p')
  })

  it('해석 불가 값도 throw 하며 값을 메시지에 넣지 않는다', () => {
    expect(() => assertLocalDatabaseUrl('DATABASE_URL', 'not a url', { hint })).toThrow(
      /^DATABASE_URL points to a non-local database host \(value not shown\)\. Point it at 127\.0\.0\.1\.$/,
    )
  })

  it('allowRemote 가 true 면 비로컬도 통과 (prisma.config.ts 의 LINKLET_ALLOW_REMOTE_DB=1 전용)', () => {
    expect(() =>
      assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', REMOTE_URLS[1]!, { hint, allowRemote: true }),
    ).not.toThrow()
  })

  it('allowRemote 가 false·미지정이면 거부', () => {
    expect(() =>
      assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', REMOTE_URLS[1]!, {
        hint,
        allowRemote: false,
      }),
    ).toThrow()
  })
})

describe('nonLocalDatabaseMessage', () => {
  it('키 이름과 안내만 들어간다', () => {
    expect(nonLocalDatabaseMessage('X', 'do this')).toBe(
      'X points to a non-local database host (value not shown). do this',
    )
  })
})

describe('prismaCommandNeedsDatabase', () => {
  it.each([
    [['generate']],
    [['generate', '--watch']],
    [['validate']],
    [['format']],
    [['version']],
    [['--version']],
    [['-v']],
    [['--help']],
    [[]],
    [['--config', 'prisma.config.ts', 'generate']],
    [['--config=prisma.config.ts', 'generate']],
    [['generate', '--config', 'prisma.config.ts']],
  ])('DB 에 붙지 않는 명령 → false: %j', (args) => {
    expect(prismaCommandNeedsDatabase(args)).toBe(false)
  })

  it.each([
    [['migrate', 'dev', '--name', 'x']],
    [['migrate', 'deploy']],
    [['migrate', 'reset']],
    [['migrate', 'diff', '--from-config-datasource', '--to-schema', 'a']],
    [['db', 'execute', '--file', 'down.sql']],
    [['db', 'seed']],
    [['db', 'push']],
    [['studio']],
    [['--config', 'prisma.config.ts', 'migrate', 'status']],
    [['something-new']], // 알 수 없는 명령은 fail-closed
  ])('DB 에 붙는(또는 알 수 없는) 명령 → true: %j', (args) => {
    expect(prismaCommandNeedsDatabase(args)).toBe(true)
  })
})
