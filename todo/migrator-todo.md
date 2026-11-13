# migrator todo

> 규칙은 `todo/README.md`. Phase 전체는 `mvp-todo.md`. Phase 2 이후는 Phase 1 완료 시 세분화한다.
> 에이전트 정의: `.claude/agents/migrator.md`

## Phase 0

(없음 — 기준선·fixture는 tester, 리디자인 시안·토큰은 메인)

## Phase 1 — 기반

위에서부터 순서대로. 각 항목은 FEATURES 한 행 안의 커밋 하나다.

- [x] Docker Postgres 로컬 환경 (2026-11-11, 97c2d28 — dev 5433 · test 5434) — `v2/docker-compose.yml`(테스트 DB 포트 분리), `pnpm db:up`/`db:down` 스크립트
  - 완료 조건: 로컬에서 기동·접속 확인, 운영·dev 접속 문자열 없음 / 커밋: `chore(db): 로컬 Docker Postgres 구성` / FEATURES: F02
- [x] `server-only`·`zod` 설치 + `decisions/dependencies.md` 목록 기록 (2026-11-12 — zod 4.6.7 은 `zod/mini` 만 사용 결정, server-only 0.0.1)
  - 완료 조건: 표에 두 줄 추가, 설치 버전 기록 / 커밋: `chore(deps): zod·server-only 추가` / FEATURES: F07
- [x] `AppError` + 에러 코드 9종 + 응답 헬퍼(`{data}`·`{data, nextCursor}`·`{error}`·204) + 예상 못한 에러 → 500 일반 문구 (2026-11-12, 0e93f66 + 보안 반영 2dbb8a4·f04c92c — 테스트 40건, 커버리지 100%)
  - 완료 조건: `shared/lib` 단위 테스트(스키마 일치, `details: error.message` 없음) / 커밋: `feat(api): 응답·에러 헬퍼와 AppError 추가` / FEATURES: F07
- [x] Route Handler 래퍼 (2026-11-12, 1c738b7 ESLint + 3cf3799 — 위치 (A) `server/api-handler.ts`, 테스트 75건) — Zod 파싱 실패 → `400 VALIDATION_FAILED` + `details: {path, code}[]`
  - 포함: ESLint `no-restricted-imports` 로 `zod`(classic) import 금지, `zod/mini` 만 허용 (dependencies.md)
  - 결정할 것: 래퍼 위치 — (A) `server/api-handler.ts` 에 두고 `server/logger` 직접 import(단순) / (B) `shared/lib` 에 두고 로거 주입 팩토리. 메인 추천 (A) — Route Handler 는 `server/` import 허용, shared/lib → server 역방향 금지 유지
  - Zod 실패 → `new AppError('VALIDATION_FAILED', issues.map(i => ({ path: i.path.map(String).join('.').slice(0,100), code: i.code })))`. Zod message 는 details 에 넣지 않는다
  - 완료 조건: 단위 테스트 / 커밋: `feat(api): Route Handler 입력 파싱 래퍼 추가` / FEATURES: F07
- [x] 환경변수 스키마 `shared/config/env.ts` (서버·클라이언트 분리, 부팅 시 검증) (2026-11-12, 9bb7615 — 테스트 19건, 값 출력 0 고정)
  - 메모: env 실패는 요청 컨텍스트가 아니므로 `z.safeParse` 직접 + `toFieldErrors`(값 미포함) 출력 후 종료. 서버 스키마만 `server-only`, 클라이언트는 `NEXT_PUBLIC_` 만. 외부·자기 호출 URL 키(`NEXT_PUBLIC_APP_URL`) 필수 — 로컬 포트 하드코딩 금지
  - 완료 조건: 단위 테스트 — 필수 키 누락 시 실패, 에러 출력에 값 없음 / 커밋: `feat(config): 환경변수 Zod 스키마와 부팅 검증` / FEATURES: F01
- [x] 서버 구조화 로거 `server/logger.ts` (JSON, 개인정보 키 차단) (2026-11-12, 08dc4da + 보안 반영 5a9e52a~a4c7ee4 — 테스트 170건, shared/lib 커버리지 98.8%)
  - 추가 요구(env 항목 메모): `postgres(ql)://user:pass@host` 접속 문자열 전체 마스킹. `shared/config/env-failure.ts` 는 역방향 금지라 로거를 못 쓴다 → 로거의 순수 포맷·마스킹 함수를 `shared/lib/log-format.ts` 에 두고 `server/logger` 가 감싸는 구조 검토
  - 포함: ESLint `no-restricted-syntax` 로 `process.env` 직접 참조 금지(`shared/config/**`·`instrumentation.ts` 제외)
  - 요구사항(security-reviewer 2026-11-12): 절대 throw 하지 않음(내부 try/catch) · 허용 목록 필드만(level·event·requestId·route·method·status·code·errorName·message·durationMs, Prisma meta 는 target·modelName 만) · message 정규화(≤300자, 개행→공백, 이메일·JWT·Bearer/token=/key=/secret= 값·32자+ hex/base64·URL 쿼리스트링 마스킹, PrismaClientValidationError 는 첫 줄만) · stack 은 Sentry 로만, 콘솔은 프레임 ≤10 경로만 · AppError 는 기록 안 함 · 테스트: 이메일·토큰이 message/cause/meta 에 있어도 로그에 없음, throw 하는 getter, Prisma validation 첫 줄
  - 메모(2026-11-10 기준선 실측): 기존 앱은 ISR 재검증을 `http://localhost:3000` 에 하드코딩해 POST 한다. v2 는 외부·자기 호출 URL 을 `shared/config/env.ts` 값으로만 만들고 로컬 포트 하드코딩 금지(F01 검증 항목에 포함)
  - 완료 조건: 단위 테스트 — 이메일·토큰 필드가 출력되지 않음 / 커밋: `feat(api): 서버 구조화 로거 추가` / FEATURES: F07
- [x] Prisma 7.10.0 설치(`prisma@7.10.0` 명시) + `prisma.config.ts` + `server/db.ts` 인스턴스 1개 + 어댑터 (2026-11-14, bc8259f~945937a 7커밋 — 어댑터는 `@prisma/adapter-pg` 하나로 변경(tech-stack), 테스트 DB 는 `DATABASE_URL` 덮기(testing T10), Neon 호스트 마스킹 추가, `new PrismaClient` 1곳, 테스트 194건)
  - 확인한 사실: CLI 는 `prisma7.config.*` 우선·`prisma.config.*` 도 읽음(이 리포는 후자 하나만) / `env()` 헬퍼는 즉시 평가라 DB env 없는 CI `generate` 가 깨져 `process.env` 직접 / `.env.local`→`.env` 는 Node 24 `process.loadEnvFile` / `postinstall: prisma generate` / pnpm 10 이 prisma 빌드 스크립트를 무시해 schema-engine 은 첫 실행 때 lazy 다운로드(네트워크 없는 CI 캐시 상황이면 `pnpm-workspace.yaml` `onlyBuiltDependencies` 검토)
  - 로그·env 요구(security-reviewer 2026-11-12): Prisma `log: ['error']` 만, `errorFormat: 'minimal'`, Prisma 이벤트는 `logger` 경유. `P1001` 메시지의 Neon 호스트(`*.neon.tech:5432`) 마스킹 규칙 추가 여부 결정. `prisma.config.ts` 는 가능하면 `@/shared/config/env` 사용. `PrismaClientValidationError` 의 `error.name` 이 그 문자열인지 1건 확인(첫 줄 규칙 의존). `pg` 어댑터를 쓰면 운영 `sslmode=require` 강제
  - 선행 결정 완료(2026-11-11): PK `uuid(7) @db.Uuid`, Better Auth `generateId: false` — `decisions/db-migration.md` M5
  - 결정할 것: 통합 테스트 DB URL 을 어떤 키로 넘길지(테스트 setup 에서 `DATABASE_URL` 덮기 vs `TEST_DATABASE_URL`) — CI service container 와 같은 키. `shared/config/env.ts` 는 `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 둘 다 필수
  - 완료 조건: typecheck 통과, `new PrismaClient` 1곳 / 커밋: `chore(db): Prisma 7과 DB 클라이언트 설정` / FEATURES: F02
- [ ] `prisma.config.ts` 운영 호스트 가드 검토 — `.env.local` 에 운영 문자열이 들어오면 CLI 가 그 DB 에 migrate 할 수 있다. 시드 가드(아래)와 같은 판정 함수를 공유해 `DATABASE_URL_UNPOOLED` 가 로컬·CI 가 아니면 `migrate dev`/`db:migrate` 래퍼가 멈추게 (적용은 사용자 직접, M3). 2026-11-14 migrator 발견
  - 완료 조건: 단위 테스트(값 미출력) / 커밋: `chore(db): CLI 접속 문자열 환경 가드` / FEATURES: F02
- [ ] `down.sql` 생성 스크립트 — `pnpm db:migrate {이름}` 래퍼: `migrate diff --from-schema --to-migrations --script > down.sql` → `migrate dev --name` → 새 폴더로 이동 (`decisions/db-migration.md` M2, 2026-11-11 확정). 섀도 DB 필요 여부는 실행해서 확인·README 기록
  - 완료 조건: 빈 DB에 up → down → up 성공 / 커밋: `chore(db): 마이그레이션 down.sql 생성 스크립트` / FEATURES: F02
- [ ] 첫 마이그레이션 — 위시리스트·아이템·공지·문의 (FK 인덱스, `price` 숫자형, 상태값 영어 소문자). 인증 테이블은 F08에서
  - 완료 조건: `migration.sql` + `down.sql`, up/down/up 수동 확인 / 커밋: `feat(db): 첫 스키마 마이그레이션` / FEATURES: F02
- [ ] 시드 `prisma/seed.ts` + 환경 가드(운영·원격 DB면 즉시 종료) — `prisma.config.ts` 가드와 판정 함수 공유. `migrations.seed` 를 prisma.config.ts 에 추가
  - 가드 출력에 `DATABASE_URL` 호스트를 찍지 않는다(키 이름·판정만)
  - 완료 조건: 로컬 시드 후 앱 기동, 가드 단위 테스트 / 커밋: `feat(db): 개발·테스트 시드와 환경 가드` / FEATURES: F02
- [ ] 헬스 체크 `GET /api/health` (실패 시 일반 문구) — `db.$queryRaw` 로 DB 확인. `src/server/db.integration.test.ts` 가 TCP 프로브 실패 시 skip 하는 방식을 그대로 쓴다
  - 확인: `export const GET = createHandler(...)` 가 Next typegen route 검사(`RouteHandler<P>` vs ParamMap)와 호환되는지 — 첫 실제 route 파일
  - 완료 조건: 단위 테스트 — DB 실패 시 내부 메시지 없음 / 커밋: `feat(api): 헬스 체크 API 추가` / FEATURES: I01
- [ ] 디자인 토큰 `@theme` 적용 (`decisions/design-tokens.md` 기준, `data-skin`·`data-mode` 구조로 스킨 × 라이트·다크 — `decisions/app-skin.md`)
  - 완료 조건: 원색 클래스 0, 토큰만 사용 / 커밋: `design(ui): 디자인 토큰 적용` / FEATURES: F03
- [ ] i18n 사전 3개(ko·en·ja) + 타입 안전 `t()` + enum→키 매핑 위치
  - 완료 조건: 단위 테스트 — 3개 사전 키 집합 동일, **플레이스홀더 문법이 `t()` 치환 규칙과 일치**(기존 앱 버그: 사전 `{title}` vs `t()` `{{key}}` — 2026-11-10 기준선 실측) / 커밋: `feat(i18n): 사전 3개와 타입 안전 t()` / FEATURES: F04
- [ ] root layout `<html lang>` + `[locale]` 레이아웃 + 언어 코드 `ko/en/ja` 검증
  - 완료 조건: E2E — 주요 경로에 `<html lang>` / 커밋: `feat(i18n): 언어별 레이아웃과 html lang` / FEATURES: F03
- [ ] `proxy.ts` — `/` 요청을 Accept-Language 기준 언어 경로로, 미지원 언어는 `ko`
  - 완료 조건: E2E / 커밋: `feat(i18n): 언어 경로 리다이렉트 proxy` / FEATURES: F05
- [ ] `not-found`·`error`·`global-error` — 앱 테마·i18n, 다시 시도 버튼
  - 완료 조건: E2E — 없는 경로 → 앱 404, 렌더 에러 → 에러 경계 / 커밋: `feat(ui): 404·에러 경계 화면` / FEATURES: F06
- [ ] Sentry 연결 (`@sentry/nextjs`, 개인정보 제거 `beforeSend`) — 사용자: DSN 발급 선행
  - 완료 조건: 로컬에서 테스트 에러 전송 확인(수동), 이벤트에 이메일·쿠키 없음 / 커밋: `feat(config): Sentry 에러 모니터링 연결` / FEATURES: F06
