import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// decisions/testing.md — 단위·통합은 소스 옆 *.test.ts, 커버리지 80%는 T4 대상에만
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 첫 테스트가 생기면 제거한다 (todo/tester-todo.md)
    passWithNoTests: true,
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
