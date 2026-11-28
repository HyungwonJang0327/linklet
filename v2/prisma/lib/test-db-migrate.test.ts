import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyTestDatabaseMigrations, defaultPrismaCliPath } from './test-db-migrate.mts'

// migrate deploy 래퍼 — 진짜 prisma CLI 대신 가짜 스크립트(prismaCliPath)를 실행해 인자·env·실패 처리를 확인한다. DB 는 쓰지 않는다.
// 접속 문자열은 가짜 값 — 어디에도 연결하지 않는다

const FAKE_DB_URL = 'postgresql://fake:fake@127.0.0.1:1/fake_test'

describe('applyTestDatabaseMigrations', () => {
  const dirs: string[] = []

  beforeEach(() => {
    // 실패 경로는 prisma(가짜 CLI) 출력을 stderr 로 흘린다 — 테스트 출력이 지저분해지지 않게 막는다
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  /** 임시 폴더에 가짜 CLI(CommonJS)를 쓰고 폴더·경로를 돌려준다 */
  function fakeCli(body: string): { root: string; cli: string } {
    const root = mkdtempSync(join(tmpdir(), 'linklet-migrate-'))
    dirs.push(root)
    const cli = join(root, 'fake-prisma.cjs')
    writeFileSync(cli, body)
    return { root, cli }
  }

  it('`migrate deploy` 인자와 DATABASE_URL_UNPOOLED=테스트 DB 로 CLI 를 실행한다 (성공 시 throw 없음)', () => {
    const { root, cli } = fakeCli(
      `require('node:fs').writeFileSync(__dirname + '/seen.json', JSON.stringify({ argv: process.argv.slice(2), url: process.env.DATABASE_URL_UNPOOLED, inherited: process.env.LINKLET_FAKE_INHERITED }))`,
    )
    expect(() =>
      applyTestDatabaseMigrations({
        root,
        databaseUrl: FAKE_DB_URL,
        baseEnv: { PATH: process.env.PATH, LINKLET_FAKE_INHERITED: 'yes' },
        prismaCliPath: cli,
      }),
    ).not.toThrow()
    const seen = JSON.parse(readFileSync(join(root, 'seen.json'), 'utf8')) as {
      argv: string[]
      url: string
      inherited: string
    }
    expect(seen.argv).toEqual(['migrate', 'deploy'])
    expect(seen.url).toBe(FAKE_DB_URL)
    expect(seen.inherited).toBe('yes')
  })

  it('CLI 가 0 이 아닌 코드로 끝나면 종료 코드를 담아 throw 한다 (접속 문자열은 메시지에 없음)', () => {
    const { root, cli } = fakeCli(`process.exit(3)`)
    let thrown: unknown
    try {
      applyTestDatabaseMigrations({
        root,
        databaseUrl: FAKE_DB_URL,
        baseEnv: {},
        prismaCliPath: cli,
      })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toMatch(/migrate deploy failed .* \(exit 3\)/)
    expect((thrown as Error).message).not.toContain(FAKE_DB_URL)
  })

  it('CLI 파일이 없으면 Node 가 1 로 끝나 같은 실패로 throw 한다', () => {
    const root = mkdtempSync(join(tmpdir(), 'linklet-migrate-'))
    dirs.push(root)
    expect(() =>
      applyTestDatabaseMigrations({
        root,
        databaseUrl: FAKE_DB_URL,
        baseEnv: {},
        prismaCliPath: join(root, 'missing.cjs'),
      }),
    ).toThrow(/migrate deploy failed/)
  })

  it('기본 CLI 경로는 {root}/node_modules/prisma/build/index.js', () => {
    expect(defaultPrismaCliPath('/x')).toBe('/x/node_modules/prisma/build/index.js')
  })
})
