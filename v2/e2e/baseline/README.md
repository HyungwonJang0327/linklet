# 기존 앱 기준선 실행 환경

기존 앱(루트, 동결)을 **로컬 전용 Postgres**로 띄워 기준선 E2E의 대상으로 삼는다. 근거: `decisions/testing.md` T7·T8, `audit/BASELINE.md` §6.

**로컬 전용 · CI 제외.** 루트 앱 파일은 수정하지 않는다.

## 실행

```bash
# 사전: Docker Desktop 실행 중, 루트 node_modules (없으면 스크립트가 npm ci), chromium (pnpm exec playwright install chromium)
cd v2
pnpm baseline:up          # 컨테이너 기동 → db push → next build → next start -p 3001 → /api/health healthy
pnpm test:e2e:baseline    # = BASELINE=1 playwright test --project=baseline  (e2e/baseline/**/*.spec.ts 만)
pnpm baseline:down        # 서버 종료 → 컨테이너·볼륨 삭제 → .next 원복
```

### Playwright `baseline` project (`v2/playwright.config.ts`)

- `BASELINE=1` 이면 project 목록이 `baseline` 하나(baseURL `http://localhost:3001`, Desktop Chrome)로 바뀌고 `webServer` 가 꺼진다. 기준선 서버는 config 가 띄우지 않으므로 `pnpm baseline:up` 이 선행 조건이다.
- 기본 `pnpm test:e2e`(chromium project)는 `**/baseline/**` 을 `testIgnore` 로 제외한다 — 기준선 spec 이 v2 E2E 결과에 섞이지 않는다 (T7).
- `CI` 환경변수가 있으면 `BASELINE=1` 이어도 기준선 project 를 만들지 않는다 (로컬 전용, T8).
- **User-Agent**: 기존 앱 공유 API(`/api/wishlists/share/{id}`)는 비브라우저 UA(`curl`·`python`·`bot` 등)에 403 을 돌려준다(`lib/rate-limit.ts` `isLikelyBot`). `baseline` project 의 `use` 에 Desktop Chrome 디바이스를 넣었고, Playwright 는 `page` 뿐 아니라 **`request` fixture 에도 같은 `userAgent`·`baseURL` 을 적용**하므로(`runBeforeCreateRequestContext` 가 `use` 옵션을 병합) 이후 spec 이 API 를 직접 쳐도 403 을 받지 않는다. 비브라우저 UA 동작을 고정하려면 `request.get(url, { headers: { 'user-agent': 'curl/8.0' } })` 처럼 요청마다 덮어쓴다.

| 항목           | 값                                                                           |
| -------------- | ---------------------------------------------------------------------------- |
| 기존 앱        | `http://localhost:3001` (`BASELINE_APP_PORT`)                                |
| DB 컨테이너    | `linklet-baseline-db` (`postgres:17-alpine`, tmpfs — 내려가면 데이터 소멸)   |
| DB 호스트 포트 | `127.0.0.1:54329` — v2 로컬 DB(5432/5433 예정)와 겹치지 않게                 |
| DB 접속 정보   | `baseline` / `baseline` / `linklet_baseline` — 로컬 더미 고정값(시크릿 아님) |
| 서버 로그·PID  | `.run/server.log`, `.run/server.pid` (git 제외)                              |

## 파일

| 파일                                   | 역할                                                                |
| -------------------------------------- | ------------------------------------------------------------------- |
| `docker-compose.baseline.yml`          | 기준선 전용 Postgres. 프로젝트명 `linklet-baseline` 로 v2 DB와 분리 |
| `with-baseline-env.mjs`                | 기존 앱 env 래퍼. 루트 Node 로 실행, 의존성 없음                    |
| `run-baseline.sh` / `stop-baseline.sh` | 기동·정리. `lib.sh` 는 공통 상수                                    |

## 운영·dev DB에 절대 붙지 않는 이유 (가드)

기존 앱의 `next build/start` 는 루트 `.env.production`·`.env.development` 를 **자동 로드**한다. 그대로 띄우면 운영·dev(Neon) 값이 섞인다. `with-baseline-env.mjs` 가 모든 명령(`prisma db push`·`next build`·`next start`) 앞에서 다음을 보장한다.

1. **키 전부 덮어쓰기** — `scripts/check-env.js` 의 필수 13개 + 코드가 참조하는 키 + 루트 `.env*` 파일에 있는 **키 이름 전부**(값은 읽지 않음)를 로컬·더미 값으로 지정한다. `DATABASE_URL` 등 접속 문자열은 코드에서 조립하며, 그 외는 `baseline-dummy`.
2. **Next 로더로 혼입 검사** — `@next/env` 의 `loadEnvConfig` 는 이미 `process.env` 에 있는 키를 덮지 않고, 파일에서 실제 적용한 키만 돌려준다. production·development 두 모드를 모두 로드해 적용된 키가 하나라도 있으면 종료(exit 2). 파일에 있는데 래퍼가 모르는 키가 생겨도 종료.
3. **최종 env 검사** — `DATABASE_URL` 호스트가 `localhost|127.0.0.1`, 포트가 `54329` 가 아니면 종료. 모든 env 값에 `neon.tech`·`amazonaws.com` 등 원격 호스트 문자열이나 기준선이 아닌 `postgres://` 접속 문자열이 있으면 종료. 검사 결과는 **키 이름만** 출력한다.
4. `prisma db push` 는 이 컨테이너에서만 허용하는 예외다(T8). 위 가드가 통과한 env 에서만 실행된다.

가드 동작 확인:

```bash
cd <repo root>
node v2/e2e/baseline/with-baseline-env.mjs --check                     # 통과
BASELINE_DB_PORT=5432 node v2/e2e/baseline/with-baseline-env.mjs --check  # 종료 코드 2
```

## 알아둘 것

- `.next`: 빌드 전에 기존 `.next` 가 있으면 `.run/next-backup` 으로 옮기고, `down` 에서 기준선 빌드를 지운 뒤 원복한다 (`next.config.ts` 를 바꿀 수 없어 `distDir` 분리는 하지 않음).
- 데이터는 비어 있다. 기준선 E2E가 직접 시드하고, 로그인은 `sessions` 행 + `next-auth.session-token` 쿠키 주입(T8).
- 교체 시점에 기존 앱과 함께 정리한다(T7).
