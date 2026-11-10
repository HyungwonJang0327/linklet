import { defineConfig, devices } from '@playwright/test'

// decisions/testing.md — E2E는 e2e/*.spec.ts, 인증은 시드 세션 주입 (Google 로그인 자동화 안 함)
// 포트 3002: 3000은 다른 프로젝트, 3001은 기존 앱 비교용으로 쓴다
const PORT = 3002
const baseURL = `http://localhost:${PORT}`

// 기준선 모드 (decisions/testing.md T7·T8) — 기존 앱(루트)을 `pnpm baseline:up` 으로 3001에 띄운 뒤
// `pnpm test:e2e:baseline`(= BASELINE=1 --project=baseline) 으로만 실행한다.
// - 환경변수로 구분하는 이유: webServer 는 top-level 이라 project 별로 켜고 끌 수 없다. argv 에서
//   `--project=baseline` 을 찾는 방식은 `--project baseline`·축약 등 표기에 취약해, 스크립트가 명시하는
//   BASELINE=1 하나로 webServer(v2 빌드·3002 기동)와 project 목록을 함께 바꾼다
// - 기준선 서버는 config 가 띄우지 않는다. 선행 조건은 `pnpm baseline:up` (Docker Postgres + 기존 앱 빌드)
// - CI 에서는 절대 실행하지 않는다 (CI 면 BASELINE=1 이어도 기준선 project 를 목록에서 제외)
const BASELINE_PORT = 3001
const isBaseline = process.env.BASELINE === '1' && !process.env.CI

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
  projects: isBaseline
    ? [
        {
          // 기존 앱 기준선 — e2e/baseline/**/*.spec.ts 만. Desktop Chrome 의 userAgent 가 page·request
          // fixture 양쪽에 적용된다 (기존 앱 공유 API 는 비브라우저 UA 에 403, e2e/baseline/README.md)
          name: 'baseline',
          testMatch: 'baseline/**/*.spec.ts',
          use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${BASELINE_PORT}` },
        },
      ]
    : [
        {
          name: 'chromium',
          // 기준선 spec 은 기본 `pnpm test:e2e` 에서 제외 (T7)
          testIgnore: '**/baseline/**',
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  // 기준선 모드에서는 v2 를 빌드·기동하지 않는다 (대상은 이미 떠 있는 기존 앱 3001)
  webServer: isBaseline
    ? undefined
    : {
        command: `pnpm build && pnpm start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
