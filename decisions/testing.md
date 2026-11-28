# 테스트 기준선 (v2)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| T1 | 반드시 테스트 | 순수 로직(Zod 스키마·메타데이터 파서·권한 판정·순서 계산·에러 매핑), 서비스 계층(실제 DB 통합 테스트), API 계약(응답이 `{data}`/`{error}` 스키마 준수), 핵심 흐름 E2E |
| T2 | 테스트하지 않음 | 단순 렌더·스냅샷, 스타일, 라이브러리 자체 동작. 상호작용 UI는 E2E로 확인 |
| T3 | "테스트 없는 기능 금지"의 정의 | 새 서비스 함수·API·순수 로직은 같은 PR에 테스트 동반. 화면은 `audit/FEATURES.md` 동등성 확인 방법(E2E) 필수 |
| T4 | 커버리지 80% 대상 | `src/shared/lib/**`, `src/features/*/schema.ts`, `src/features/*/server/service.ts`. Vitest v8 커버리지, CI에서 80% 미만이면 실패 |
| T5 | 통합 테스트 DB | Docker Postgres — 로컬(Docker 설치·실행 확인 2026-09-27)과 CI(GitHub Actions service container). 테스트마다 깨끗한 DB. 구현(2026-11-15): Vitest `globalSetup`(`vitest.global-setup.mts`)이 테스트 DB 에 TCP 로 닿으면 `prisma migrate deploy` 를 자동 적용하고 못 닿으면 안내 후 통합 파일만 skip. 통합 테스트는 `beforeEach` 에서 `server/test-db.resetTestDatabase`(public 스키마 전체 TRUNCATE, `_prisma_migrations` 제외, 로컬 호스트 + DB 이름 `linklet_test` + NODE_ENV=test 3중 가드, 테스트 파일 밖 import 는 ESLint 금지)로 비운다. 시드 데이터에 의존하지 않고 fixture 는 테스트가 만든다. CI(2026-11-22): `v2-ci.yml` quality 잡의 `postgres:17-alpine` service container 를 호스트 5434 로 매핑해 같은 setup 이 그대로 맞고, test 단계는 `LINKLET_REQUIRE_TEST_DB=1` 로 테스트 DB 에 닿지 않으면 skip 대신 실패한다(컨테이너 깨짐이 조용히 통과하는 일 방지) |
| T10 | 테스트 DB 접속 키 | 별도 `TEST_DATABASE_URL` 없음. Vitest `setupFiles` 가 `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 를 테스트 DB(로컬 5434 `linklet_test`, CI service container) 값으로 덮는다. 덮기 전 들어 있던 값의 호스트가 localhost 가 아니면 즉시 실패(값 출력 금지) — dev·원격 DB 에 테스트가 붙는 사고 방지. env 스키마·`server/db.ts` 에 테스트 분기 없음 |
| T11 | 통합 테스트 직렬 실행 | Vitest `test.projects` 두 개 — `unit`(통합 제외, 파일 병렬) / `integration`(`*.integration.test.ts` 만, `fileParallelism: false`). 통합 파일은 `beforeEach` 에서 테스트 DB 전체를 TRUNCATE 하므로 병렬이면 서로 지운 데이터를 본다. `globalSetup`(migrate deploy)은 integration 에만, `setupFiles`(T10)·alias 는 root 상속, 커버리지는 root 에서 합산. 통합 파일은 자기 데이터만 다루려 애쓰지 않아도 된다(직렬이 격리를 보장). `pnpm vitest run --project integration` 으로 따로 돌릴 수 있다 |
| T6 | 파일 위치 | 단위·통합은 소스 옆 `*.test.ts`, E2E는 `e2e/*.spec.ts` |
| T7 | 기존 앱 기준선 E2E | `v2/e2e/baseline/` — v2의 Playwright를 쓰고, 기존 앱(`next start -p 3001`)을 대상으로 하는 별도 project. 기본 `pnpm test:e2e` 에서는 제외. 실행 DB는 T8. 교체 시 함께 정리 |
| T9 | 기준선 E2E 시드 | 기준선 컨테이너의 psql 에 **고정 SQL 파일**(`v2/e2e/baseline/seed.sql`)을 흘린다 — 사용자·위시리스트·아이템·세션(`sessions` 행, 만료 먼 미래). 의존성 없음, 기존 스키마는 동결이라 SQL 고정이 안전. 실행은 `baseline:up` 끝 또는 테스트 `globalSetup` 에서 `docker compose exec psql`. 매 `down` 마다 DB가 사라지므로 시드는 멱등(`ON CONFLICT DO NOTHING` 또는 TRUNCATE 후 INSERT) |
| T8 | 기준선 E2E 실행 DB | 로컬 Docker Postgres의 **기준선 전용 컨테이너**에 기존 앱 `prisma/schema.prisma` 를 `prisma db push` 로 적용(기존 마이그레이션은 드리프트 H5로 재현 불가). 데이터는 테스트가 직접 시드하고, 로그인은 `sessions` 행 + `next-auth.session-token` 쿠키 주입(기존 앱은 DB 세션). 기존 앱은 래퍼로 실행 — 기존 앱이 쓰는 env 키 전부를 로컬·더미 값으로 지정하고 하나라도 빠지면 중단(`next build/start` 가 `.env.production` 을 자동 로드하므로). **로컬 실행만, CI 제외**. `db push` 는 이 컨테이너에서만 허용하는 예외 |
| T12 | v2 E2E CI 실행 | `.github/workflows/v2-ci.yml` 의 **별도 잡 `e2e`** — `quality` 와 병렬(`needs` 없음). `playwright install --with-deps chromium` 뒤 `pnpm test:e2e`. 서버·env(더미 DB·`LINKLET_E2E=1`)는 `playwright.config.ts` webServer 가 맡고 워크플로는 env 를 주지 않는다. 기준선 project 는 `CI` 분기로 제외(T7). 실패 시에만 `playwright-report` artifact(7일). E2E 서버는 T13 의 테스트 DB 에 붙는다 — `e2e` 잡에도 `quality` 와 같은 Postgres service container(2026-11-24. 러너가 달라 컨테이너는 공유되지 않는다) |
| T13 | v2 E2E 서버 DB·세션 주입 | **E2E 서버(`next start` 운영 빌드)는 통합 테스트 DB(`127.0.0.1:5434/linklet_test`)를 재사용**한다. `playwright.config.ts` 가 `prisma/lib/test-db-url.mts` 로 같은 접속 문자열을 조립해 webServer env 로 넘기고, `e2e/global-setup.ts` 가 테스트 전 1회: 로컬 가드 → TCP 프로브(닿지 않으면 **실패**, skip 없음 — E2E 는 DB 필수) → `prisma migrate deploy`(`prisma/lib/test-db-migrate.mts`, Vitest globalSetup 과 공유) → E2E 사용자 2행(`user`·`admin`, 이메일 `.test`)·세션 2행을 **고정 UUID upsert**(`e2e/seed-e2e-users.mts`, 멱등, TRUNCATE 없음). 선행 조건 `pnpm db:test:up`. Vitest 통합 테스트(beforeEach TRUNCATE)와 **동시 실행 금지**(v2/README.md). **세션 주입 = 시드 세션 행 + 테스트 코드가 서명 쿠키 계산**(`e2e/helpers/session.ts` `signInAs(context, role)` — better-call 1.4.6 형식 `encodeURIComponent(token.base64(HMAC-SHA256(secret, token)))`, 쿠키 `better-auth.session_token`, secret 은 config·헬퍼가 `e2e/helpers/e2e-env.ts` 한 모듈을 공유). 제품 코드에 E2E 전용 세션 엔드포인트 없음. 전제: `server/db-config.ts` `assertTlsInProduction` 이 **로컬 호스트(`isLocalDatabaseUrl`)는 production 이어도 TLS 없이 허용**(`affa4e8`) — 운영(Neon) 접속 문자열은 로컬일 수 없어 운영 동작 불변, security-reviewer 검토 대상. 시드가 별도 Node 프로세스인 이유: 생성 Prisma 클라이언트(ESM, `import.meta`)를 Playwright 의 CommonJS 변환 안에서 import 할 수 없다(2026-11-25 실측) → migrate deploy 와 같은 spawn 방식. 시드 전용 PrismaClient 는 `prisma/seed.mts` 와 같은 함정 6 예외(1회 프로세스, 로컬 가드, `$disconnect`) |

E2E 인증: Google OAuth는 자동화하지 않는다. 테스트 DB에 시드한 사용자·세션(T13)을 서명 쿠키로 주입해 로그인 상태를 만든다 — `await signInAs(context, 'user' | 'admin')` 을 `page.goto` 전에. 실제 Google 로그인은 수동 확인(FEATURES F08).

## 이유

- 리뉴얼 전 테스트는 순수 유틸 49개뿐(AUDIT H10). 권한·SSRF·계약처럼 깨지면 보안·호환에 직결되는 곳부터 고정한다
- 서비스 계층은 권한 판정이 모이는 곳(architecture A3)이라 실제 DB로 확인해야 IDOR를 잡는다
- 완료 기준 5(E2E CI 통과)·6(순수 로직 커버리지 80%)
- T8: 로그인 흐름까지 고정할 수 있는 유일한 격리 환경. Docker는 T5와 같은 도구라 추가 설치가 없고, 운영·dev DB와 물리적으로 분리된다. `db push` 금지(db-migration M1)의 취지는 v2 마이그레이션 이력 보존이며, 동결된 기존 앱의 버리는 로컬 DB에는 해당하지 않는다. CI에 넣으면 루트 `npm ci`·기존 앱 빌드가 매 PR에 추가된다
- T13: 세션은 DB 행(Better Auth DB 세션, cookieCache 끔)이라 세션 주입에는 DB 가 필수다. 통합 테스트 DB 를 재사용하면 compose·CI service container·가드 모듈을 그대로 쓰고, 운영 빌드를 그대로 검증한다(dev 서버 아님). 서명 쿠키를 테스트가 계산하면 제품 코드에 로그인 우회 경로가 생기지 않고 기준선 E2E(T8, `sessions` 행 + 쿠키 주입)와 같은 방식이다. 라이브러리가 형식을 바꾸면 테스트가 깨져 바로 드러난다
- T7: 루트에 Playwright를 설치하면 "기존 앱 수정 금지"의 예외가 늘어난다. v2에 이미 설치된 Playwright로 기존 앱을 URL로만 바라보면 루트 변경이 없다

## 기각된 대안

- Neon 테스트 브랜치 — 네트워크 의존·무료 컴퓨트 소모, 병렬 실행 시 충돌
- repository mock — 권한·쿼리 버그를 놓침
- 스냅샷 테스트 — 변경 때마다 갱신만 반복, 결함 검출력 낮음
- 전체 코드 커버리지 목표 — UI 렌더까지 세면 의미 없는 테스트를 부름
- 기준선 E2E를 루트 `e2e-baseline/` 에 — 루트에 Playwright 설치 필요(기존 앱 수정)
- 기준선 DB를 기존 마이그레이션 + `migrate diff` 보충 SQL로 — 결과 스키마는 같고 보충 SQL이 또 하나의 드리프트가 된다
- 기준선을 dev DB(Neon) 읽기 전용 시나리오로 — 로그인 흐름 고정 불가, dev 데이터 변동에 깨짐, 원격 DB에 테스트 실행
- 기준선 E2E 생략(스크린샷·수동 체크리스트) — 동등성 자동 비교 불가
- T13 별도 `linklet_e2e` DB — 격리는 되지만 compose init 스크립트·CI 추가 단계가 생긴다. 로컬 동시 실행 금지 한 줄로 충분
- T13 `next dev` 로 E2E — 운영 빌드 검증을 포기한다
- T13 NODE_ENV=test 로 빌드·기동 — Next 가 허용하는 값이지만 운영 빌드와 같다는 보장을 문서에서 확인하지 못했다
- T13 Docker Postgres 에 자체 서명 TLS — compose·CI 양쪽 인증서 마운트, verify-full 은 CA 경로까지 필요
- T13 `LINKLET_E2E=1` 일 때만 붙는 Better Auth 플러그인 엔드포인트가 세션 생성·쿠키 설정 — 서명은 라이브러리가 하지만 운영 코드에 로그인 우회 엔드포인트가 들어간다
- T10 별도 `TEST_DATABASE_URL` 키 — 실수로 dev DB 에 붙을 가능성은 낮지만 env 스키마·db.ts 에 `NODE_ENV=test` 분기가 들어가고 CI 키가 하나 더 늘어남

## 확장 지점

새 기능의 테스트는 `src/features/{x}/` 안에, E2E 시나리오는 `e2e/{x}.spec.ts` 하나를 추가한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
- 2026-10-04 T7 기준선 E2E 위치 추가 (사용자: 추천대로)
- 2026-10-04 T8 기준선 E2E 실행 DB 추가 (사용자: A 로컬 Docker + db push)
- 2026-11-10 T9 기준선 E2E 시드 방법 — psql 고정 SQL (사용자: 추천안. 기각: 루트 Prisma 클라이언트 래퍼 — 루트 코드 의존·모듈 해석 복잡 / 세션 주입 후 API 생성 — 기존 API 버그에 테스트가 의존)
- 2026-11-14 T10 테스트 DB 접속 키 — `DATABASE_URL` 덮기 (사용자: 추천안. 기각: `TEST_DATABASE_URL`)
- 2026-11-15 T5 구현 메모(globalSetup 자동 `migrate deploy` + beforeEach TRUNCATE 헬퍼). 통합 파일이 2개 이상이 되면 파일 간 병렬 실행 격리 결정 필요(tester todo) → 2026-11-23 T11 로 해결
- 2026-11-22 T5 CI 적용 메모 — service container(호스트 5434) + `LINKLET_REQUIRE_TEST_DB=1`(CI 만). 로컬은 기존대로 미기동이면 skip
- 2026-11-23 T11 통합 테스트 직렬 실행 — projects 분리 (사용자: 추천안. 기각: 전체 `fileParallelism: false` — 단위까지 느려짐 / 통합 파일 간 격리 규약(TRUNCATE 대신 자기 데이터만) — 리뷰로만 지켜지고 FK·유니크 충돌 위험 / `poolMatchGlobs` — Vitest 5 에서 제거됨)
- 2026-11-23 T12 v2 E2E CI 실행 — 별도 잡·병렬 (사용자: CI E2E 단계 진행 지시. 기각: quality 잡의 마지막 step — 빌드를 한 번만 하지만 E2E 가 lint·테스트 뒤에만 돌아 피드백이 늦고 한 잡의 timeout 을 나눠 쓴다 / `needs: quality` 직렬 — 깨진 PR 에 E2E 비용을 아끼지만 정상 PR 에서 매번 합산 시간. 빌드 중복은 받아들인다: E2E 빌드는 `LINKLET_E2E=1` 이라 quality 빌드와 산출물이 다르다)
- 2026-11-24 T13 v2 E2E 서버 DB·세션 주입 — 통합 테스트 DB 재사용 + TLS 가드 로컬 예외 + 시드 세션 행·테스트 코드 서명 쿠키 (사용자: 3건 모두 추천안. 기각: 별도 linklet_e2e DB / next dev / NODE_ENV=test / Postgres TLS / E2E 전용 세션 엔드포인트). T12 의 "DB 없이 돈다" 메모 해소. 구현 2026-11-25 `fd93e39`~`c20bd32`(tester)
