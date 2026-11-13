import { defineConfig } from 'prisma/config'

// Prisma 7 CLI 설정 — decisions/db-migration.md(연결·M2), decisions/tech-stack.md(Prisma 7.10.0 고정), FEATURES F02
// 이 파일은 CLI(generate·migrate)만 읽는다. 런타임 클라이언트는 src/server/db.ts.
//
// - Prisma 7 은 .env 를 자동 로드하지 않는다 → 새 의존성(dotenv) 없이 Node 24 내장 process.loadEnvFile 로 읽는다.
//   이미 process.env 에 있는 값은 덮지 않는다(Node 동작 확인 2026-11-14). 파일이 없으면 무시 — CI·Vercel 은 env 로 들어온다.
//   읽는 순서는 Next 와 같은 우선순위(.env.local > .env). 운영 접속 문자열은 어느 파일에도 두지 않는다(README).
// - datasource.url 은 `env()` 헬퍼가 아니라 process.env 직접 읽기: prisma/config 의 env() 는 즉시 평가되어 키가 없으면 throw 하므로
//   DB 가 없는 CI 의 `prisma generate`(install 직후 typecheck 용)가 깨진다(소스 확인 2026-11-14). 없으면 undefined 로 두고
//   migrate 류 명령이 자체 오류를 낸다. 이 파일은 ESLint process.env 금지 규칙의 예외 목록에 있다.
// - `shared/config/env` 를 쓰지 않는 이유: `server-only` 가 CLI 로더에서 throw 하고, 런타임 전체 키 검증을 CLI 가 요구하지 않는다.
// - 파일 이름: 7.10 CLI 는 prisma7.config.* 를 먼저, 없으면 prisma.config.* 를 읽는다(둘 다 지원, 경고 없음). 이 리포는 prisma.config.ts 하나만 둔다.
// - migrations.seed 는 시드 항목에서 추가한다.

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch {
    // 파일 없음(ENOENT) — 무시
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI(unpooled). 런타임 pooled URL 은 server/db.ts 가 DATABASE_URL 로 읽는다
    url: process.env.DATABASE_URL_UNPOOLED,
  },
})
