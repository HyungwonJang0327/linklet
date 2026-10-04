# 테스트 기준선 (v2)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| T1 | 반드시 테스트 | 순수 로직(Zod 스키마·메타데이터 파서·권한 판정·순서 계산·에러 매핑), 서비스 계층(실제 DB 통합 테스트), API 계약(응답이 `{data}`/`{error}` 스키마 준수), 핵심 흐름 E2E |
| T2 | 테스트하지 않음 | 단순 렌더·스냅샷, 스타일, 라이브러리 자체 동작. 상호작용 UI는 E2E로 확인 |
| T3 | "테스트 없는 기능 금지"의 정의 | 새 서비스 함수·API·순수 로직은 같은 PR에 테스트 동반. 화면은 `audit/FEATURES.md` 동등성 확인 방법(E2E) 필수 |
| T4 | 커버리지 80% 대상 | `src/shared/lib/**`, `src/features/*/schema.ts`, `src/features/*/server/service.ts`. Vitest v8 커버리지, CI에서 80% 미만이면 실패 |
| T5 | 통합 테스트 DB | Docker Postgres — 로컬(Docker 설치·실행 확인 2026-09-27)과 CI(GitHub Actions service container). 테스트마다 깨끗한 DB |
| T6 | 파일 위치 | 단위·통합은 소스 옆 `*.test.ts`, E2E는 `e2e/*.spec.ts` |
| T7 | 기존 앱 기준선 E2E | `v2/e2e/baseline/` — v2의 Playwright를 쓰고, 기존 앱(`next start -p 3001`)을 대상으로 하는 별도 project. 기본 `pnpm test:e2e` 에서는 제외. 실행 DB는 Phase 0에서 결정. 교체 시 함께 정리 |

E2E 인증: Google OAuth는 자동화하지 않는다. 테스트 DB에 시드한 사용자·세션을 주입해 로그인 상태를 만든다. 실제 Google 로그인은 수동 확인(FEATURES F08).

## 이유

- 리뉴얼 전 테스트는 순수 유틸 49개뿐(AUDIT H10). 권한·SSRF·계약처럼 깨지면 보안·호환에 직결되는 곳부터 고정한다
- 서비스 계층은 권한 판정이 모이는 곳(architecture A3)이라 실제 DB로 확인해야 IDOR를 잡는다
- 완료 기준 5(E2E CI 통과)·6(순수 로직 커버리지 80%)
- T7: 루트에 Playwright를 설치하면 "기존 앱 수정 금지"의 예외가 늘어난다. v2에 이미 설치된 Playwright로 기존 앱을 URL로만 바라보면 루트 변경이 없다

## 기각된 대안

- Neon 테스트 브랜치 — 네트워크 의존·무료 컴퓨트 소모, 병렬 실행 시 충돌
- repository mock — 권한·쿼리 버그를 놓침
- 스냅샷 테스트 — 변경 때마다 갱신만 반복, 결함 검출력 낮음
- 전체 코드 커버리지 목표 — UI 렌더까지 세면 의미 없는 테스트를 부름
- 기준선 E2E를 루트 `e2e-baseline/` 에 — 루트에 Playwright 설치 필요(기존 앱 수정)

## 확장 지점

새 기능의 테스트는 `src/features/{x}/` 안에, E2E 시나리오는 `e2e/{x}.spec.ts` 하나를 추가한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
- 2026-10-04 T7 기준선 E2E 위치 추가 (사용자: 추천대로)
