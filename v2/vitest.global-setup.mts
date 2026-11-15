import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { assertLocalDatabaseUrl } from './prisma/lib/local-db.mts'
import { canConnect } from './prisma/lib/tcp-probe.mts'
import { testDatabaseTarget, testDatabaseUrl } from './prisma/lib/test-db-url.mts'

// Vitest globalSetup — 테스트 실행 전 메인 프로세스에서 1회. 테스트 DB 에 `prisma migrate deploy` 를 자동 적용한다.
// (vitest.config.mts `test.globalSetup`. 기본 export 함수 = setup, 반환값은 teardown 함수 — vitest 5.0 소스 확인 2026-11-15)
// 근거: decisions/testing.md T5(테스트마다 깨끗한 DB — 적용은 여기, 비우기는 src/server/test-db.ts), FEATURES F02
//
// - setupFiles(vitest.setup.ts)와 다른 컨텍스트라 env 덮기가 공유되지 않는다 → 접속 문자열은 prisma/lib/test-db-url.mts 의 같은 함수로 조립한다
// - 가드: 셸에 이미 있는 DATABASE_URL* 가 비로컬이면 setup 과 똑같이 즉시 실패(값 미출력). 우회 없음
// - 테스트 DB(127.0.0.1:5434, LINKLET_TEST_DB_PORT 로 변경)에 TCP 로 닿지 않으면 한 줄 안내만 남기고 넘어간다.
//   Docker 가 꺼져 있거나 CI 에 service container 가 아직 없는 경우(todo/tester-todo.md) — 통합 테스트 파일은 스스로 skip 한다
// - 닿으면 `node node_modules/prisma/build/index.js migrate deploy` 를 DATABASE_URL_UNPOOLED=테스트 DB 로 실행(scripts/db-migrate.mts 와 같은 호출 방식).
//   prisma.config.ts 의 M6 로컬 가드도 함께 거친다(127.0.0.1 이라 통과). 접속 값은 compose 더미 고정값 — 시크릿 아님
// - 출력: 성공 시 한 줄, 실패 시 prisma 출력 + throw(테스트 전체 중단 — 스키마 없는 DB 로 통합 테스트가 애매하게 실패하는 것보다 낫다)

const ROOT = import.meta.dirname
const PRISMA_CLI = join(ROOT, 'node_modules', 'prisma', 'build', 'index.js')
const DB_URL_KEYS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const

function log(message: string): void {
  console.error(`[vitest global-setup] ${message}`)
}

export default async function setup(): Promise<void> {
  for (const key of DB_URL_KEYS) {
    assertLocalDatabaseUrl(key, process.env[key], {
      hint: 'Refusing to run tests against it. Unset it or point it at 127.0.0.1.',
    })
  }

  const rawPort = process.env.LINKLET_TEST_DB_PORT
  const target = testDatabaseTarget(rawPort)

  if (!(await canConnect(target))) {
    log(
      `test DB not reachable at ${target.host}:${target.port} — integration tests will be skipped. Run \`pnpm db:test:up\` to enable them.`,
    )
    return
  }

  const result = spawnSync(process.execPath, [PRISMA_CLI, 'migrate', 'deploy'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL_UNPOOLED: testDatabaseUrl(rawPort) },
  })

  if (result.error) {
    throw new Error(`failed to run prisma migrate deploy on the test DB: ${result.error.message}`)
  }
  if (result.status !== 0) {
    // prisma 의 출력에는 로컬 테스트 DB 의 host:port·DB 명만 들어간다(compose 더미 값)
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error(
      `prisma migrate deploy failed on the test DB (exit ${result.status ?? 'unknown'}). See output above.`,
    )
  }

  log(`test DB at ${target.host}:${target.port} — migrations applied (prisma migrate deploy)`)
}
