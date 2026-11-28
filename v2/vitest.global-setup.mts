import { assertLocalDatabaseUrl } from './prisma/lib/local-db.mts'
import { canConnect } from './prisma/lib/tcp-probe.mts'
import { applyTestDatabaseMigrations } from './prisma/lib/test-db-migrate.mts'
import { testDatabaseTarget, testDatabaseUrl } from './prisma/lib/test-db-url.mts'

// Vitest globalSetup — 테스트 실행 전 메인 프로세스에서 1회. 테스트 DB 에 `prisma migrate deploy` 를 자동 적용한다.
// (vitest.config.mts `test.globalSetup`. 기본 export 함수 = setup, 반환값은 teardown 함수 — vitest 5.0 소스 확인 2026-11-15)
// 근거: decisions/testing.md T5(테스트마다 깨끗한 DB — 적용은 여기, 비우기는 src/server/test-db.ts), FEATURES F02
//
// - setupFiles(vitest.setup.ts)와 다른 컨텍스트라 env 덮기가 공유되지 않는다 → 접속 문자열은 prisma/lib/test-db-url.mts 의 같은 함수로 조립한다
// - 가드: 셸에 이미 있는 DATABASE_URL* 가 비로컬이면 setup 과 똑같이 즉시 실패(값 미출력). 우회 없음
// - 테스트 DB(127.0.0.1:5434, LINKLET_TEST_DB_PORT 로 변경)에 TCP 로 닿지 않으면 한 줄 안내만 남기고 넘어간다.
//   Docker 가 꺼져 있는 로컬의 경우 — 통합 테스트 파일은 스스로 skip 한다
// - `LINKLET_REQUIRE_TEST_DB=1` 이면 닿지 않을 때 안내 대신 throw 한다. CI(service container, .github/workflows/v2-ci.yml)가 켠다 —
//   컨테이너 설정이 깨졌을 때 통합 테스트가 조용히 skip 되어 PR 이 통과하는 일을 막는다
// - 닿으면 `prisma migrate deploy` 를 테스트 DB 로 실행 — prisma/lib/test-db-migrate.mts(e2e/global-setup.ts 와 공유). 접속 값은 compose 더미 고정값 — 시크릿 아님
// - 출력: 성공 시 한 줄, 실패 시 prisma 출력 + throw(테스트 전체 중단 — 스키마 없는 DB 로 통합 테스트가 애매하게 실패하는 것보다 낫다)

const ROOT = import.meta.dirname
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
    if (process.env.LINKLET_REQUIRE_TEST_DB === '1') {
      throw new Error(
        `test DB not reachable at ${target.host}:${target.port} but LINKLET_REQUIRE_TEST_DB=1 — integration tests must run here (CI service container missing or not ready).`,
      )
    }
    log(
      `test DB not reachable at ${target.host}:${target.port} — integration tests will be skipped. Run \`pnpm db:test:up\` to enable them.`,
    )
    return
  }

  applyTestDatabaseMigrations({
    root: ROOT,
    databaseUrl: testDatabaseUrl(rawPort),
    baseEnv: process.env,
  })

  log(`test DB at ${target.host}:${target.port} — migrations applied (prisma migrate deploy)`)
}
