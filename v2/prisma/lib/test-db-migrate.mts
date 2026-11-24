import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

// 테스트 DB 에 `prisma migrate deploy` 적용 — vitest.global-setup.mts(통합 테스트)와 e2e/global-setup.ts(Playwright)가 공유하는 순수 모듈.
// 근거: decisions/testing.md T5(테스트마다 깨끗한 DB — 적용은 globalSetup, 비우기는 테스트 setup)·T13(E2E 도 같은 테스트 DB 재사용, 사용자 결정 2026-11-24)
// - 호출 방식은 scripts/db-migrate.mts 와 같다: `node node_modules/prisma/build/index.js migrate deploy`, env `DATABASE_URL_UNPOOLED`=테스트 DB.
//   prisma.config.ts 의 M6 로컬 가드도 함께 거친다(127.0.0.1 이라 통과)
// - 이 모듈은 process.env 를 읽지 않는다 — 호출자가 baseEnv·접속 문자열을 넘긴다(단위 테스트는 가짜 CLI 스크립트로 돈다)
// - 메시지에 접속 문자열 값을 넣지 않는다. prisma 의 출력(실패 시에만 stderr 로 그대로 흘림)에는 로컬 테스트 DB 의 host:port·DB 명만 들어간다(compose 더미 값)

export type MigrateDeployOptions = {
  /** `node_modules/prisma` 가 있는 프로젝트 루트. 기본 CLI 경로와 cwd 로 쓴다 */
  root: string
  /** 마이그레이션을 적용할 테스트 DB 접속 문자열 — DATABASE_URL_UNPOOLED 로 넘긴다 */
  databaseUrl: string
  /** 자식 프로세스에 물려줄 env (보통 process.env). DATABASE_URL_UNPOOLED 만 덮는다. Next 타입은 NODE_ENV 를 필수로 두므로 느슨한 Record 로 받는다 */
  baseEnv: Record<string, string | undefined>
  /** 테스트용 — 기본값은 `{root}/node_modules/prisma/build/index.js` */
  prismaCliPath?: string
}

/** `{root}/node_modules/prisma/build/index.js` — pnpm 이 hoist 한 prisma CLI 진입점 */
export function defaultPrismaCliPath(root: string): string {
  return join(root, 'node_modules', 'prisma', 'build', 'index.js')
}

/**
 * 테스트 DB 에 `prisma migrate deploy` 를 동기로 실행한다. 성공하면 조용히 돌아오고, 실패하면 prisma 출력을 stderr 로 흘린 뒤 throw 한다
 * (테스트 전체 중단 — 스키마 없는 DB 로 테스트가 애매하게 실패하는 것보다 낫다).
 */
export function applyTestDatabaseMigrations(options: MigrateDeployOptions): void {
  const cli = options.prismaCliPath ?? defaultPrismaCliPath(options.root)
  const env: Record<string, string | undefined> = {
    ...options.baseEnv,
    DATABASE_URL_UNPOOLED: options.databaseUrl,
  }
  const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], {
    cwd: options.root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // Next 의 ProcessEnv 타입은 NODE_ENV 를 필수로 둔다 — 자식 env 는 물려받은 것 그대로라 단언만 한다
    env: env as NodeJS.ProcessEnv,
  })

  if (result.error) {
    throw new Error(`failed to run prisma migrate deploy on the test DB: ${result.error.message}`)
  }
  if (result.status !== 0) {
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error(
      `prisma migrate deploy failed on the test DB (exit ${result.status ?? 'unknown'}). See output above.`,
    )
  }
}
