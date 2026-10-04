# planning — 확정 사항

> 확정된 것만 적는다. 결정 맥락은 `decisions/`, 오늘 한 일은 `worklog/`, 다음 작업은 `todo/`.
> 이 파일과 충돌하는 새 결정은 덮어쓰지 않고 "결정 변경 확인 필요"로 표시한다.

## 서비스 개요

- **한 줄**: 요즘 갖고 싶은 것들, 링크만 붙여 넣으면 예쁘게 모아지는 내 위시리스트 페이지. 친구에게 링크 하나로 공유.
- **대상**: 평소 갖고 싶은 물건을 가볍게 모아 두고 지인에게 보여주고 싶은 개인 (캐주얼 컨셉)
- **리뉴얼 목적**: 기술 부채 정리 + 포트폴리오 품질 → [INTENT.md](INTENT.md)
- **리뉴얼 방식**: 병행 재구축(`v2/`), 규모 FULL → `decisions/renewal-strategy.md`
- **현재 운영**: https://link-let.vercel.app/ (리뉴얼 전 앱, 실사용자 0, 교체 전까지 동결)

### 완료 기준 (INTENT.md 목표와 동일)

- [ ] 1. `audit/FEATURES.md` 유지·개선 행 전부 동등성 확인 통과
- [ ] 2. 공유 링크가 신규·기존 모두 열리고 메신저 링크 미리보기 표시
- [ ] 3. AUDIT high 12개 해결 또는 미해결 사유를 `decisions/` 에 기록
- [ ] 4. audit critical·high 0
- [ ] 5. 핵심 흐름(로그인·생성·아이템 추가·공유 열람) E2E가 CI 통과
- [ ] 6. 순수 로직(검증·파싱·권한) 커버리지 80% 이상
- [ ] 7. 에러 응답 스키마 단일화, 404·500·에러 경계가 앱 테마
- [ ] 8. 주요 화면 키보드 조작 (모달 포커스 트랩·Esc·폼 라벨)
- [ ] 9. README 전후 비교 + 설계 결정 링크, 운영 URL 배포
- [ ] 10. 로그인 후 첫 공유 링크 복사까지 3분 이내

성공 지표(완료 기준 아님): 공유 페이지 Lighthouse 모바일 하한 83/88/82(리뉴얼 전), 목표 90/95/95 (성능/접근성/SEO)

## 확정된 기술 스택 (v2)

근거: `decisions/tech-stack.md`. 실제 설치 버전은 `CLAUDE.md` §3 "설치" 열.

| 영역 | 선택 | 버전 기준 |
|---|---|---|
| 런타임 | Node.js | 24.x LTS |
| 프레임워크 | Next.js App Router (`cacheComponents` 끔) | 16.3.x |
| 인증 | Better Auth + Prisma 어댑터 | 1.7.x |
| ORM·DB | Prisma + Neon 어댑터 / PostgreSQL(Neon Free) | 7.10.0 고정 |
| 입력 검증 | Zod | 4.x |
| 서버 상태·스타일 | TanStack Query / Tailwind CSS | 5.x / 4.x |
| 이미지 저장소 | Cloudflare R2 | — |
| 요청 빈도 제한 | Vercel WAF(`/api/link-previews`) + Better Auth 내장 | — |
| 테스트 | Vitest / Playwright | 최신 / 1.63.x |
| 에러 모니터링 | Sentry (Developer 무료 플랜) | @sentry/nextjs 11.x |
| 아이콘 | lucide-react | 1.x |
| 시크릿 스캔 | gitleaks (pre-commit + CI) | — |
| 린트·포맷 | ESLint flat + Prettier | — |
| 패키지 매니저 | pnpm | 10.x |
| 배포 | Vercel Hobby | — |

## 확정 기능 범위

기준표: `audit/FEATURES.md` (ID별 처분·이식 순서·동등성 확인 방법). 2026-09-27 확정.

### 포함 (v2로 이식)

| 영역 | 기능 (FEATURES ID) |
|---|---|
| 기반 | 환경변수 검증(F01), DB 스키마·마이그레이션·시드(F02), 공통 레이아웃(F03), i18n 3개 언어(F04), 언어 경로 `ko/en/ja`(F05), 404·500·에러 경계(F06), API 응답·에러 스키마(F07), Google 로그인(F08), 라우트 보호(F09), 인증·권한 계층(F10), 외부 URL 안전 fetch(F11), 요청 빈도 제한(F12) |
| 위시리스트·아이템 | 목록(F13), 생성 — 캐주얼 3분 흐름(F14), 기본 공개(F15), 카테고리 3~4종(F16), 편집·삭제(F17), 메타데이터 파서(F18), 아이템 추가(F19), 이미지 업로드(F20), 아이템 수정·삭제·받음·일괄삭제(F21), 순서 변경(F22), 남용 방지 상한(F39) |
| 공유 | `/w/{shareId}` 공유 URL(F23), 서버 렌더 공유 페이지 + 링크 미리보기(F24), 링크 복사(F25), GA(F26) |
| 꾸미기·설정 | 꾸미기 축소판(F27), 프로필(F28), 화면 설정 — 테마·언어(F29), 사용자 문의(F30), 공지 열람(F31), 세션 관리(F32) |
| 관리자 (최소) | 접근 제어(F33), 공지 관리(F34), 문의 관리(F35), 사용자 목록(F36), 대시보드 숫자 3개(F37) |
| 인프라 | 헬스 체크(I01), 시크릿 스캔(I02), CI(I03) |

### 제외

| 구분 | 항목 |
|---|---|
| 삭제 | 개발용 페이지(D01), 관리자 목업 화면(D02), QnA(D03), 데이터 가져오기(D04), 비로그인 공개 목록·데모 모드(D08), 무인증·중복·죽은 API(D09~D13), 1회성 스크립트(D14), 죽은 코드(D15), 에러 로그(D16) |
| 언젠가 (`todo/someday.md`) | 조회·클릭 통계(D05), 요금제 제한·요금제 페이지(D06), 알림 설정(D07), 사용자 페이지 `/@이름`, 결제, 푸시·이메일 알림, Google 외 소셜 로그인, 모바일 앱, QR 코드·소셜 공유 버튼·임베드, 아이템 일괄 이동·복사 |
| 하지 않음 | 소셜 기능(친구·팔로우·댓글), 선물 예약·중복 방지, 익명 위시리스트 |

## 핵심 결정 (변경 불가 — 바꾸려면 `decisions/` 에 새 결정과 "결정 변경 확인 필요")

| 주제 | 결정 | 문서 |
|---|---|---|
| 리뉴얼 전략 | 병행 재구축 `v2/`, 교체 시점에 기존 코드 일괄 제거 | renewal-strategy.md |
| 예산 | 무료 티어 안에서만 | INTENT.md, tech-stack.md |
| 아키텍처 | 기능별 폴더, REST + TanStack Query, 권한은 서비스 한 곳, ESLint import 경계 | architecture.md |
| 에러 응답 | `{ error: { code, message, details? } }`, `AppError`, code 기반 재시도·문구 | error-handling.md |
| 로그 | 예상 못한 실패만, 구조화 로그 + Sentry, 개인정보 금지 | error-handling.md |
| 정상 응답 | `{ data }` / `{ data, nextCursor }`, 커서, 빈 배열, 204, null 명시, 문자열 id | api-response.md |
| 공유 URL | `/w/{shareId}` — PK와 별도 공유 전용 ID, 재발급 가능 | api-response.md |
| 입력 검증 | `features/*/schema.ts` Zod 공유, Route Handler에서 파싱 | api-response.md |
| 테스트 | 순수 로직·서비스(Docker Postgres)·계약·E2E, 대상 한정 커버리지 80%, 기준선 E2E는 `v2/e2e/baseline/` + 로컬 Docker 전용 DB(로컬만) | testing.md |
| 로드맵 | Phase 0~8(준비·기반·인증·미리보기·핵심 흐름·공유+첫 배포·꾸미기·관리자·교체), 주당 ~10시간 | roadmap.md, todo/mvp-todo.md |
| 마이그레이션 | `migrate dev` + `down.sql`, `db push` 금지, 운영 적용은 사용자 | db-migration.md |
| URL | 복수형·케밥·동사 금지, `/{locale}/wishlists`, `ko/en/ja`, 필터는 URL 쿼리, 하위 호환 없음 | url-design.md |
| 의존성 | 5가지 기준 확인 + 기록 후 추가 | dependencies.md |
| 시간·값·로그 | UTC 저장·ISO 직렬화·표시는 프론트 / 코드 값 영어 / 로그에 시크릿·개인정보 금지 | CLAUDE.md 4-2 (고정 규약) |
| 시크릿 | git에 올리지 않는다. CI + pre-commit 스캔 (공개 여부 무관) | CLAUDE.md 6 |

## 미결 질문

| 질문 | 결정 시점 |
|---|---|
| Cloudflare 계정 유무 (R2) | 이미지 업로드 이식(F20, Phase 4) 때 — 사용자 작업 |
| Vercel 프리뷰 프로젝트(`v2/` 루트) 운영 여부 | 첫 배포 때 (Phase 5) |
| v2가 쓸 Neon DB(기존 DB의 새 브랜치 / 새 프로젝트) | 첫 배포 때 (Phase 5, 로컬은 Docker Postgres) |
| id 생성 방식 (cuid2 / UUID v7) | Phase 1 스키마 작업 |
| `down.sql` 생성 명령 | Phase 1 (Prisma 7 문서 확인) |
| 카테고리 3~4종의 구체 목록 | Phase 0 (designer) |
| 설정 사이드바 구조 유지 여부 | Phase 0 (designer) |
| 기존 S3 버킷 삭제 | 교체 후 (사용자 작업) |
| 과거 커밋에 노출된 토큰 교체 | **즉시** — 사용자 작업 (AUDIT H13) |
