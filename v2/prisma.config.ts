import { defineConfig } from 'prisma/config'

import { loadEnvFiles } from './prisma/lib/load-env-files.mts'
import { assertLocalDatabaseUrl, prismaCommandNeedsDatabase } from './prisma/lib/local-db.mts'

// Prisma 7 CLI 설정 — decisions/db-migration.md(연결·M2·M3), decisions/tech-stack.md(Prisma 7.10.0 고정), FEATURES F02
// 이 파일은 CLI(generate·migrate)만 읽는다. 런타임 클라이언트는 src/server/db.ts.
//
// - Prisma 7 은 .env 를 자동 로드하지 않는다 → prisma/lib/load-env-files.mts(.env.local → .env, 셸 값 우선, 없으면 무시)
// - datasource.url 은 `env()` 헬퍼가 아니라 process.env 직접 읽기: prisma/config 의 env() 는 즉시 평가되어 키가 없으면 throw 하므로
//   DB 가 없는 CI 의 `prisma generate`(install 직후 typecheck 용)가 깨진다(소스 확인 2026-11-14). 없으면 undefined 로 두고
//   migrate 류 명령이 자체 오류를 낸다. 이 파일은 ESLint process.env 금지 규칙의 예외 목록에 있다.
// - `shared/config/env` 를 쓰지 않는 이유: `server-only` 가 CLI 로더에서 throw 하고, 런타임 전체 키 검증을 CLI 가 요구하지 않는다.
// - 파일 이름: 7.10 CLI 는 prisma7.config.* 를 먼저, 없으면 prisma.config.* 를 읽는다(둘 다 지원, 경고 없음). 이 리포는 prisma.config.ts 하나만 둔다.
// - migrations.seed 는 시드 항목에서 추가한다.
//
// 접속 문자열 환경 가드 (todo/migrator-todo.md, M3 "운영 적용은 사용자 직접"):
// - `.env.local` 에 운영·dev(Neon) 문자열이 들어오면 CLI 가 그 DB 에 migrate 할 수 있다 → DATABASE_URL_UNPOOLED 가 있고 호스트가
//   로컬(127.0.0.1·localhost·[::1])이 아니면 DB 에 붙는 명령(migrate·db·studio·그 외 전부)에서 throw. 값은 출력하지 않는다.
// - 예외 1: DB 에 붙지 않는 명령(generate·validate·format·version)은 가드하지 않는다 — Vercel·CI 의 `postinstall: prisma generate` 는
//   운영 env 와 함께 돌기 때문. 목록 밖 명령은 전부 가드(fail-closed).
// - 예외 2: 사용자가 dev·운영에 직접 적용할 때는 셸에서 `LINKLET_ALLOW_REMOTE_DB=1 pnpm exec prisma migrate deploy` 처럼 붙인다.
//   이 변수는 .env 파일이 아니라 셸 값만 인정한다(파일에 넣어 두면 가드가 영구히 꺼지므로 env 로드 전에 읽는다).
// - CI service container 는 127.0.0.1 이라 통과. `pnpm db:migrate` 래퍼(scripts/db-migrate.mts)는 우회 없이 로컬만 허용한다.
//
// 섀도 DB (M2 down.sql): `migrate dev` 는 superuser 라 임시 섀도 DB 를 스스로 만들고 지우지만, `migrate diff --to-migrations` 는
// `datasource.shadowDatabaseUrl` 이 없으면 거부한다(7.10 실측 2026-11-14). 래퍼가 임시 DB 를 만들고 그 URL 을
// LINKLET_SHADOW_DATABASE_URL 로 넘겨 주는 동안만 설정된다 — 사람이 .env 에 둘 키가 아니다(.env.example 에 없음). 같은 로컬 가드를 거친다.

const allowRemote = process.env.LINKLET_ALLOW_REMOTE_DB === '1'

loadEnvFiles(process.cwd())

if (prismaCommandNeedsDatabase(process.argv.slice(2))) {
  const hint =
    'Prisma CLI refuses to touch a remote database from this machine. Point it at the local Docker DB (127.0.0.1, see v2/README.md), or run the command yourself with LINKLET_ALLOW_REMOTE_DB=1 in the shell to apply to dev/production on purpose (decisions/db-migration.md M3).'
  assertLocalDatabaseUrl('DATABASE_URL_UNPOOLED', process.env.DATABASE_URL_UNPOOLED, {
    allowRemote,
    hint,
  })
  assertLocalDatabaseUrl('LINKLET_SHADOW_DATABASE_URL', process.env.LINKLET_SHADOW_DATABASE_URL, {
    allowRemote,
    hint,
  })
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI(unpooled). 런타임 pooled URL 은 server/db.ts 가 DATABASE_URL 로 읽는다
    url: process.env.DATABASE_URL_UNPOOLED,
    // 래퍼(scripts/db-migrate.mts)가 down.sql 을 뽑는 동안만 들어온다. 없으면 undefined — migrate dev 는 섀도 DB 를 스스로 만든다
    shadowDatabaseUrl: process.env.LINKLET_SHADOW_DATABASE_URL,
  },
})
