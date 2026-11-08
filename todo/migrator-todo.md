# migrator todo

> 규칙은 `todo/README.md`. Phase 전체는 `mvp-todo.md`. Phase 2 이후는 Phase 1 완료 시 세분화한다.
> 에이전트 정의: `.claude/agents/migrator.md`

## Phase 0

(없음 — 기준선·fixture는 tester, 리디자인 시안·토큰은 메인)

## Phase 1 — 기반

위에서부터 순서대로. 각 항목은 FEATURES 한 행 안의 커밋 하나다.

- [ ] Docker Postgres 로컬 환경 — `v2/docker-compose.yml`(테스트 DB 포트 분리), `pnpm db:up`/`db:down` 스크립트
  - 완료 조건: 로컬에서 기동·접속 확인, 운영·dev 접속 문자열 없음 / 커밋: `chore(db): 로컬 Docker Postgres 구성` / FEATURES: F02
- [ ] `server-only`·`zod` 설치 + `decisions/dependencies.md` 목록 기록
  - 완료 조건: 표에 두 줄 추가, 설치 버전 기록 / 커밋: `chore(deps): zod·server-only 추가` / FEATURES: F07
- [ ] `AppError` + 에러 코드 9종 + 응답 헬퍼(`{data}`·`{data, nextCursor}`·`{error}`·204) + 예상 못한 에러 → 500 일반 문구
  - 완료 조건: `shared/lib` 단위 테스트(스키마 일치, `details: error.message` 없음) / 커밋: `feat(api): 응답·에러 헬퍼와 AppError 추가` / FEATURES: F07
- [ ] Route Handler 래퍼 — Zod 파싱 실패 → `400 VALIDATION_FAILED` + `details: {path, code}[]`
  - 완료 조건: 단위 테스트 / 커밋: `feat(api): Route Handler 입력 파싱 래퍼 추가` / FEATURES: F07
- [ ] 환경변수 스키마 `shared/config/env.ts` (서버·클라이언트 분리, 부팅 시 검증)
  - 완료 조건: 단위 테스트 — 필수 키 누락 시 실패, 에러 출력에 값 없음 / 커밋: `feat(config): 환경변수 Zod 스키마와 부팅 검증` / FEATURES: F01
- [ ] 서버 구조화 로거 `server/logger.ts` (JSON, 개인정보 키 차단)
  - 완료 조건: 단위 테스트 — 이메일·토큰 필드가 출력되지 않음 / 커밋: `feat(api): 서버 구조화 로거 추가` / FEATURES: F07
- [ ] Prisma 7.10.0 설치(`prisma@7.10.0` 명시) + `prisma.config.ts` + `server/db.ts` 인스턴스 1개 + Neon 어댑터
  - 선행: planning 미결 "id 생성 방식" 결정 (`/decide`)
  - 완료 조건: typecheck 통과, `new PrismaClient` 1곳 / 커밋: `chore(db): Prisma 7과 DB 클라이언트 설정` / FEATURES: F02
- [ ] `down.sql` 생성 스크립트 — Prisma 7 문서의 `migrate diff` 옵션 확인 후 `pnpm db:migrate` 래퍼
  - 완료 조건: 빈 DB에 up → down → up 성공 / 커밋: `chore(db): 마이그레이션 down.sql 생성 스크립트` / FEATURES: F02
- [ ] 첫 마이그레이션 — 위시리스트·아이템·공지·문의 (FK 인덱스, `price` 숫자형, 상태값 영어 소문자). 인증 테이블은 F08에서
  - 완료 조건: `migration.sql` + `down.sql`, up/down/up 수동 확인 / 커밋: `feat(db): 첫 스키마 마이그레이션` / FEATURES: F02
- [ ] 시드 `prisma/seed.ts` + 환경 가드(운영·원격 DB면 즉시 종료)
  - 완료 조건: 로컬 시드 후 앱 기동, 가드 단위 테스트 / 커밋: `feat(db): 개발·테스트 시드와 환경 가드` / FEATURES: F02
- [ ] 헬스 체크 `GET /api/health` (실패 시 일반 문구)
  - 완료 조건: 단위 테스트 — DB 실패 시 내부 메시지 없음 / 커밋: `feat(api): 헬스 체크 API 추가` / FEATURES: I01
- [ ] 디자인 토큰 `@theme` 적용 (`decisions/design-tokens.md` 기준, 라이트·다크)
  - 완료 조건: 원색 클래스 0, 토큰만 사용 / 커밋: `design(ui): 디자인 토큰 적용` / FEATURES: F03
- [ ] i18n 사전 3개(ko·en·ja) + 타입 안전 `t()` + enum→키 매핑 위치
  - 완료 조건: 단위 테스트 — 3개 사전 키 집합 동일 / 커밋: `feat(i18n): 사전 3개와 타입 안전 t()` / FEATURES: F04
- [ ] root layout `<html lang>` + `[locale]` 레이아웃 + 언어 코드 `ko/en/ja` 검증
  - 완료 조건: E2E — 주요 경로에 `<html lang>` / 커밋: `feat(i18n): 언어별 레이아웃과 html lang` / FEATURES: F03
- [ ] `proxy.ts` — `/` 요청을 Accept-Language 기준 언어 경로로, 미지원 언어는 `ko`
  - 완료 조건: E2E / 커밋: `feat(i18n): 언어 경로 리다이렉트 proxy` / FEATURES: F05
- [ ] `not-found`·`error`·`global-error` — 앱 테마·i18n, 다시 시도 버튼
  - 완료 조건: E2E — 없는 경로 → 앱 404, 렌더 에러 → 에러 경계 / 커밋: `feat(ui): 404·에러 경계 화면` / FEATURES: F06
- [ ] Sentry 연결 (`@sentry/nextjs`, 개인정보 제거 `beforeSend`) — 사용자: DSN 발급 선행
  - 완료 조건: 로컬에서 테스트 에러 전송 확인(수동), 이벤트에 이메일·쿠키 없음 / 커밋: `feat(config): Sentry 에러 모니터링 연결` / FEATURES: F06
