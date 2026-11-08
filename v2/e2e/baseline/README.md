# 기존 앱 기준선 실행 환경

기존 앱(루트, 동결)을 **로컬 전용 Postgres**로 띄워 기준선 E2E의 대상으로 삼는다. 근거: `decisions/testing.md` T7·T8, `audit/BASELINE.md` §6.

**로컬 전용 · CI 제외.** 루트 앱 파일은 수정하지 않는다.

## 실행

```bash
# 사전: Docker Desktop 실행 중, 루트 node_modules (없으면 스크립트가 npm ci)
cd v2
pnpm baseline:up      # 컨테이너 기동 → db push → next build → next start -p 3001 → /api/health healthy
pnpm baseline:down    # 서버 종료 → 컨테이너·볼륨 삭제 → .next 원복
```

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
