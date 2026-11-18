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

// v2 E2E 서버(production 빌드)용 더미 env — 시크릿 아님. `.github/workflows/v2-ci.yml` build 단계와 같은 값.
// `next build`·`next start` 는 NODE_ENV=production 이라 server/db.ts 의 TLS 가드가 sslmode=verify-full 을 요구하는데,
// 로컬 `.env.local` 의 dev DB(sslmode 없음)로는 빌드가 실패한다(2026-11-15 실측). Playwright 는 `{ ...process.env, ...env }` 로
// 넘기고 Next 는 이미 있는 process.env 를 .env 파일보다 우선하므로(environment-variables.md "Load Order") 이 값이 .env.local 을 덮는다.
// DB 는 닫힌 포트 → E2E 에서 `/api/health` 는 503 (e2e/layout.spec.ts 는 200·503 둘 다 응답 규약만 확인). DB 가 필요한 E2E 는
// 그 기능 이식 때 시드 DB 연결 방식을 정한다(decisions/testing.md).
const E2E_SERVER_ENV: Record<string, string> = {
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_APP_URL: baseURL,
  DATABASE_URL: 'postgresql://build:build@127.0.0.1:5999/linklet_build?sslmode=verify-full',
  DATABASE_URL_UNPOOLED:
    'postgresql://build:build@127.0.0.1:5999/linklet_build?sslmode=verify-full',
  // F06 에러 경계 E2E — /{locale}/__e2e/throw 가 렌더 에러를 던지게 한다. 여기서만 켠다(CI 빌드·Vercel 에는 없다 → 운영은 404)
  LINKLET_E2E: '1',
}

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
        env: E2E_SERVER_ENV,
        // 준비 확인은 기본 언어 랜딩(/ko = DEFAULT_LOCALE). Playwright 는 2xx·3xx·400~403 만 "준비됨"으로 보는데
        // `/` 는 F05 proxy 전까지 404 라 baseURL 그대로면 180초 타임아웃이 난다(2026-11-18 실측). F05 뒤에도 /ko 는 유효하다
        url: `${baseURL}/ko`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
