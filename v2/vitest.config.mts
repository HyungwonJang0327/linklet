import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// decisions/testing.md — 단위·통합은 소스 옆 *.test.ts, 커버리지 80%는 T4 대상에만
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `import 'server-only'` 는 기본 조건에서 throw 한다(react-server 조건에서만 빈 모듈).
      // 테스트는 서버 코드이므로 패키지가 제공하는 빈 모듈로 바꿔 끼운다.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // 통합 테스트 DB URL 덮기 + 비로컬 DB 가드 (decisions/testing.md T10) — 두 project 가 상속한다
    setupFiles: ['./vitest.setup.ts'],
    // 두 project (decisions/testing.md T5, 사용자 결정 2026-11-23). 이 설정은 컨테이너가 되고 테스트는 project 가 돈다.
    // - unit: 통합 파일을 뺀 전부, 파일 병렬(기본)
    // - integration: `*.integration.test.ts` 만, 파일 직렬 — 각 파일이 beforeEach 에서 테스트 DB 전체를 TRUNCATE 하므로
    //   병렬이면 서로 지운 데이터를 본다. globalSetup(migrate deploy)은 DB 를 쓰는 이 project 에만 둬 한 번만 돈다
    // extends 는 기본 true — root 의 resolve.alias·environment·setupFiles 를 그대로 받는다
    projects: [
      {
        test: {
          name: 'unit',
          // prisma/lib 는 CLI·스크립트·테스트가 공유하는 순수 모듈(로컬 DB 가드) — 소스 옆 테스트(T6)를 포함한다
          include: ['src/**/*.test.ts', 'prisma/lib/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
          fileParallelism: false,
          // 테스트 DB 에 prisma migrate deploy 자동 적용 — 메인 프로세스 1회, DB 가 안 떠 있으면 안내만(CI 는 LINKLET_REQUIRE_TEST_DB=1 로 실패)
          globalSetup: ['./vitest.global-setup.mts'],
        },
      },
    ],
    // 커버리지는 root 전용 옵션 — 두 project 를 합쳐 계산한다
    coverage: {
      provider: 'v8',
      include: [
        'src/shared/lib/**/*.ts',
        'src/features/*/schema.ts',
        'src/features/*/server/service.ts',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      reporter: ['text', 'json-summary', 'html'],
    },
  },
})
