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
    // prisma/lib 는 CLI·스크립트·테스트가 공유하는 순수 모듈(로컬 DB 가드) — 소스 옆 테스트(T6)를 포함한다
    include: ['src/**/*.test.ts', 'prisma/lib/**/*.test.ts'],
    // 통합 테스트 DB URL 덮기 + 비로컬 DB 가드 (decisions/testing.md T10)
    setupFiles: ['./vitest.setup.ts'],
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
