# tester todo

> 규칙은 `todo/README.md`. Phase 전체는 `mvp-todo.md`. Phase 2 이후는 Phase 1 완료 시 세분화한다.
> 에이전트 정의: `.claude/agents/tester.md`

## Phase 0 — 기준선

기존 앱(루트) 코드는 수정하지 않는다. 대상: `next start -p 3001` 로 띄운 기존 앱. 실행 DB·실행 방식은 `decisions/testing.md` T8.

- [ ] 기준선 DB·기존 앱 실행 스크립트 — `v2/e2e/baseline/` 에 전용 Docker 컨테이너 기동·`db push`(루트 prisma 6 CLI, 로컬 접속 문자열만), 기존 앱 env 래퍼(키 전부 로컬·더미 지정, 빠진 키 있으면 중단), 빌드·`next start -p 3001`, 종료 후 정리
  - 완료 조건: 스크립트 한 번으로 기존 앱이 로컬 DB로 뜨고 `/api/health` healthy, 운영·dev 접속 문자열이 프로세스 env에 없음을 스크립트가 검사 / 커밋: `test(config): 기존 앱 기준선 실행 스크립트 추가`
- [ ] 기준선 E2E Playwright project 추가 — `v2/e2e/baseline/`, baseURL `http://localhost:3001`, 기본 `pnpm test:e2e` 에서 제외
  - 완료 조건: `pnpm exec playwright test --project=baseline` 이 동작, `pnpm test:e2e` 영향 없음 / 커밋: `test(config): 기존 앱 기준선 E2E project 추가`
- [ ] 비로그인 흐름 — 랜딩, 공유 페이지 열람(제목·아이템·상품 링크), 비공개 위시리스트 접근, 없는 경로
  - 완료 조건: 기존 앱에서 통과. 알려진 버그(H1 `/w/w/`, `/login` 404)는 현재 동작으로 고정하고 주석에 FEATURES ID / 커밋: `test(share): 기존 앱 공유 페이지 기준선 E2E` / FEATURES: F23–F25
- [ ] 로그인 흐름 — 세션 주입 → 위시리스트 생성 → 아이템 수동 추가 → 수정·받음 표시·삭제
  - 완료 조건: 기존 앱에서 통과 / 커밋: `test(wishlist): 기존 앱 핵심 흐름 기준선 E2E` / FEATURES: F13–F17, F19, F21
- [ ] 메타데이터 파서 정답 fixture — 쇼핑몰 HTML 저장본 + 기존 파서 출력 JSON 쌍 (수집 스크립트는 네트워크 없이 기존 파서만 실행)
  - 완료 조건: `v2/src/features/link-preview/server/__fixtures__/` 에 쌍, 사이트 종류(OG·JSON-LD·셀렉터)별 1개 이상 / 커밋: `test(link-preview): 기존 파서 정답 fixture 추가` / FEATURES: F18

## Phase 1

- [ ] 첫 단위 테스트가 생기면 `v2/vitest.config.mts` 의 `passWithNoTests: true` 제거 — 완료 조건: 설정에서 제거 후 `pnpm test` 통과 / 커밋: `chore(config): Vitest passWithNoTests 제거`
- [ ] CI에 Docker Postgres service container + 통합 테스트 실행 — T5
  - 완료 조건: PR에서 DB 통합 테스트가 깨끗한 DB로 실행 / 커밋: `ci(ci): v2 CI에 테스트용 Postgres 추가`
- [ ] CI에 E2E 단계 추가 (Playwright chromium 설치, 시드 DB)
  - 완료 조건: PR에서 v2 E2E 실행·통과, 기준선 project는 제외 / 커밋: `ci(ci): v2 CI에 E2E 단계 추가`
- [ ] Phase 1 커버리지 점검 — T4 대상 80%
  - 완료 조건: 보고서 수치, 미달 파일 목록 (커밋 없음)
