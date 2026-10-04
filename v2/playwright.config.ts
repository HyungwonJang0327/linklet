import { defineConfig, devices } from '@playwright/test'

// decisions/testing.md — E2E는 e2e/*.spec.ts, 인증은 시드 세션 주입 (Google 로그인 자동화 안 함)
// 포트 3002: 3000은 다른 프로젝트, 3001은 기존 앱 비교용으로 쓴다
const PORT = 3002
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
