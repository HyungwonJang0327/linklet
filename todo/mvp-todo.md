# mvp todo — Phase 로드맵

> 규칙은 `todo/README.md`. 역할별 세부 항목은 `{역할}-todo.md`, 사용자 작업은 `user-todo.md`.
> 이식 순서의 근거는 `audit/FEATURES.md` "순서" 열. Phase는 그 순서를 묶은 것이다.

## 운영 원칙

- **세분화 시점**: Phase 0·1은 역할별 todo에 커밋 단위로 적었다. Phase 2 이후는 여기에 FEATURES 행 단위로 두고, **이전 Phase 완료 시** 역할별 todo로 옮겨 커밋 단위로 쪼갠다(옮긴 뒤 여기서는 체크박스를 뺀 요약만 남긴다)
- **Phase 완료 조건(공통)**: 해당 FEATURES 행 상태가 `이식 완료` 이상 + main CI 통과 + `/log`. 첫 배포(Phase 5) 이후에는 프리뷰 배포까지 성공
- **배포 가능한 상태 유지**(INTENT 제약): 기존 앱은 교체 전까지 운영 중이므로, v2는 "main CI가 항상 초록"을 배포 가능 상태로 본다
- **기간**: 주당 약 10시간 기준 추정. Phase가 끝날 때마다 실제 소요와 비교해 다음 Phase 추정을 고친다

| Phase | 내용 | FEATURES | 추정 | 목표 완료 |
|---|---|---|---|---|
| 0 | 준비 — 기준선 E2E·파서 정답 fixture·UI 리디자인 시안·디자인 토큰 | — | 2주 | 2026-10-18 |
| 1 | 기반 | F01–F07, I01 | 2주 | 2026-11-01 |
| 2 | 인증 | F08–F10 | 1주 | 2026-11-08 |
| 3 | 링크 미리보기 | F11, F12, F18 | 1주 | 2026-11-15 |
| 4 | 핵심 흐름 | F13–F17, F19–F22, F39 | 3주 | 2026-12-06 |
| 5 | 공유 + 첫 배포 | F23–F26 | 1주 | 2026-12-13 |
| 6 | 꾸미기·설정 | F27–F32 | 2주 | 2026-12-27 |
| 7 | 관리자 | F33–F37 | 1주 | 2027-01-03 |
| 8 | 교체 | — (완료 기준 1·9) | 1주 | 2027-01-10 |

## Phase 0 — 준비

이식의 정답지를 먼저 만든다. 기존 앱(루트) 코드는 수정하지 않는다. 커밋 단위 항목은 역할별 todo에만 적는다(체크는 그쪽에서).

- [x] 기준선 E2E 실행 환경 결정 (2026-10-04, bddcbb5 — 로컬 Docker 전용 컨테이너 + db push, testing T8) — 기존 앱을 어떤 DB로 띄울지(로컬 Docker Postgres에 기존 스키마 적용 방식 / dev DB 읽기 전용 시나리오만). tester 규칙상 dev·운영 DB에 테스트 금지, 기존 마이그레이션은 드리프트(H5)로 그대로 재현 안 됨 → `/decide`
  - 완료 조건: `decisions/testing.md` 에 기준선 E2E 환경 추가 / 커밋: `docs(decisions): 기준선 E2E 실행 환경 결정` / 담당: 메인
- [ ] 기준선 E2E 3건 + 파서 정답 fixture → `tester-todo.md` Phase 0
- [ ] 디자인 검토(방향·핵심 화면·토큰 대비) → `designer-todo.md` Phase 0

### UI 리디자인 (담당: 메인, `decisions/roadmap.md`)

시안은 `design/mockups/` 정적 HTML. 외부 스크립트 없이 열리게, 색·간격은 CSS 변수(토큰 후보)로만 쓴다.

- [ ] 시각 방향 후보 시안 3개 — 같은 화면 2개(공유 페이지·내 위시리스트 목록)를 방향별로. 방향마다 무드 한 줄·레퍼런스·색·타이포
  - 완료 조건: `design/mockups/direction-{a,b,c}.html` + `design/README.md`(보는 법), designer 대비 검토 후 사용자 선택 / 커밋: `docs(design): 시각 방향 후보 시안 3개 추가`
- [ ] 선택한 방향 기록
  - 완료 조건: `decisions/design-direction.md` (선택·이유·기각안) / 커밋: `docs(decisions): UI 시각 방향 결정`
- [ ] 핵심 화면 시안 — 랜딩·로그인, 내 위시리스트 목록(로딩·비어 있음·에러·정상), 생성 3분 흐름, 상세(아이템 추가), 공유 페이지(프리셋 2개 이상), 라이트·다크
  - 완료 조건: `design/mockups/*.html`, designer 흐름·접근성 검토 반영, 카테고리·설정 메뉴 구조가 시안 안에 들어감 / 커밋: 화면별 `docs(design): {화면} 시안 추가`
- [ ] 시안에서 디자인 토큰 추출·결정
  - 완료 조건: `decisions/design-tokens.md` (색 라이트·다크·간격·반경·그림자·타이포, 대비 4.5:1 검증표) / 커밋: `docs(decisions): 디자인 토큰 체계 결정`

## Phase 1 — 기반 (F01–F07, I01)

순서: 공통 응답·환경 → DB → 화면 뼈대 → 에러 화면. 커밋 단위는 `migrator-todo.md`·`tester-todo.md` Phase 1. 아래는 요약이며 체크는 역할별 todo에서 한다.

- Docker Postgres 로컬·CI 환경 (`v2/docker-compose.yml`, CI service container) — T5
- F07 API 응답·에러 헬퍼 + `AppError` (zod 설치 포함)
- F01 환경변수 스키마 `shared/config/env.ts`
- I01 헬스 체크 (`/api/health`, 실패 시 일반 문구)
- F02 Prisma 7.10.0 + 첫 마이그레이션(위시리스트·아이템·공지·문의 — 인증 테이블은 F08 마이그레이션) + `down.sql` 스크립트 + 시드(환경 가드)
  - 선행 결정: id 생성 방식(cuid2 / UUID v7), `down.sql` 생성 명령 (planning 미결)
- 디자인 토큰 `@theme` 적용 (`decisions/design-tokens.md` 기준) — 이후 모든 화면은 `design/mockups/` 시안 기준
- F04 i18n 사전 3개 + 타입 안전 `t()` + 키 집합 테스트
- F03 root layout `<html lang>` + `[locale]` 레이아웃
- F05 `proxy.ts` Accept-Language 리다이렉트 (`ko/en/ja`)
- F06 `not-found`·`error`·`global-error` + Sentry (사용자: Sentry DSN 발급 선행)
- CI에 E2E 단계 추가 (Playwright 브라우저 설치, Docker Postgres) — 완료 기준 5의 틀

## Phase 2 — 인증 (F08–F10)

- [ ] F08 Better Auth + Prisma 어댑터, Google 로그인·로그아웃, 인증 테이블 마이그레이션 (사용자: OAuth 리디렉션 URI 추가 선행)
- [ ] F10 권한 판정 계층 (본인·타인·관리자·비로그인 판정표 테스트)
- [ ] F09 라우트 보호 (`proxy.ts` + 서버 세션 확인)
- [ ] E2E 세션 주입 헬퍼 (시드 사용자·세션)
- [ ] security-reviewer 검토

## Phase 3 — 링크 미리보기 (F11, F12, F18)

- [ ] F11 `shared/lib/safe-fetch` (DNS→IP 검사, 리다이렉트 재검사, 크기·시간 제한)
- [ ] F18 파서 이식 — Phase 0 fixture로 동등성
- [ ] F12 요청 빈도 제한 (Vercel WAF는 첫 배포 때, 코드 측은 Better Auth 내장 + 429 스키마)
- [ ] `POST /api/link-previews` (로그인 필요)
- [ ] security-reviewer 검토

## Phase 4 — 핵심 흐름 (F13–F17, F19–F22, F39)

- [ ] F13 내 위시리스트 목록 — 4상태 본보기, TanStack Query 도입
- [ ] F14·F15·F16·F39 생성 흐름(3분), 기본 공개, 카테고리 기본값, 남용 방지 상한
- [ ] F17 편집·삭제 — `shared/ui` Dialog (Radix — `decisions/dependencies.md` 기록 선행)
- [ ] F19 아이템 추가 (링크 자동 채움)
- [ ] F20 이미지 업로드 R2 (사용자: Cloudflare R2 선행)
- [ ] F21 아이템 수정·삭제·받음 표시·일괄 삭제
- [ ] F22 아이템 순서 변경 (드래그·키보드)
- [ ] 기준선 E2E 대응 시나리오를 v2에서 통과 (동등성 확인)

## Phase 5 — 공유 + 첫 배포 (F23–F26)

- [ ] F23 `shareId` 공유 URL
- [ ] F24 공유 페이지 서버 렌더 + OG 메타 + 공개용 select
- [ ] F25 공유 링크 복사
- [ ] F26 GA
- [ ] 핵심 흐름 E2E(로그인 → 생성 → 아이템 추가 → 공유 열람) CI 통과 — 완료 기준 5
- [ ] 첫 배포: Vercel 프리뷰(`v2/` 루트) + Neon v2 DB + WAF (사용자 작업 선행)
- [ ] 수동: 카카오톡·슬랙 링크 미리보기 — 완료 기준 2

## Phase 6 — 꾸미기·설정 (F27–F32)

- [ ] F27 테마 프리셋 6 + 레이아웃 2 + 강조색 + 소셜 링크
- [ ] F28 프로필
- [ ] F29 화면 설정 (테마·언어)
- [ ] F30 사용자 문의
- [ ] F31 공지 열람
- [ ] F32 세션 관리
- [ ] 완료 기준 10 측정 (로그인 후 첫 공유 3분)

## Phase 7 — 관리자 (F33–F37)

- [ ] F33 관리자 접근 제어 (서버 확인)
- [ ] F34 공지 관리
- [ ] F35 문의 관리
- [ ] F36 사용자 목록
- [ ] F37 대시보드 숫자 3개

## Phase 8 — 교체

- [ ] `/parity` — 유지·개선 행 전부 `동등성 확인` (완료 기준 1)
- [ ] `/audit` — high 12개 해결 확인 (완료 기준 3), 취약점 0 (완료 기준 4)
- [ ] `/baseline` — `audit/BASELINE-after.md` 전후 비교
- [ ] README 전후 비교·설계 결정 링크 (완료 기준 9)
- [ ] 교체: `v2/` → 루트, 기존 코드 일괄 제거([기존 코드 제거] 커밋 분리), Vercel 운영 프로젝트 전환
- [ ] 사용자: 기존 S3 정리, 기존 환경변수 정리
