# FEATURES-before — 리뉴얼 전 기능 목록

- 기준 커밋: `eac797e` (태그 `pre-renewal`), 작성일 2026-09-27
- 판정 기준
  - **동작 확인**: 코드 경로가 완결되고 계약(요청·응답·DB)이 서로 맞음을 코드로 확인. 실행 확인은 아님(DB 미연결)
  - **추정**: 코드상 문제는 없어 보이나 실행으로 확인하지 못함
  - **깨짐**: 코드 근거로 동작하지 않음이 확인되거나, 스텁·목업
- 실행 확인: `next build` 성공 + dev DB로 `next start` 후 비로그인 경로 HTTP 확인(2026-09-27). 로그인 필요 경로는 테스트 계정이 없어 미실행.
- **실행 확인** 표시는 로컬 서버에서 실제 응답을 본 항목.

## 화면 (페이지 라우트)

| ID | 화면 | 경로 / 파일 | 인증 | 판정 | 근거 |
|---|---|---|---|---|---|
| P01 | 루트 리다이렉트 | `/` → `/kr` · app/page.tsx | — | 동작 확인 | Accept-Language 미사용 |
| P02 | 랜딩 | `/[locale]` · [locale]/page.tsx | — | 동작 확인 (**실행 확인**) | SSG, /kr·/en·/jp 200 |
| P03 | 로그인 | `/[locale]/login` | — | 화면은 동작 (**실행 확인**), NextAuth 경로는 **깨짐** | `/kr/login` 200, 미들웨어는 `/kr/login` 으로 보냄. 그러나 `/api/auth/signin` → `/login` → **404 실측** (lib/auth-config.ts:27) |
| P04 | 요금제 | `/[locale]/pricing` | — | 동작 확인 (**실행 확인**) | 200. 헤더 메뉴는 주석 처리 |
| P05 | 공지 목록 | `/[locale]/notices` | — | 동작 확인 (**실행 확인**) | 200, `/api/notices` 사용 |
| P06 | 설정 진입 | `/[locale]/settings` | 필요 | 동작 확인 | getServerSession 후 redirect |
| P07 | 내 위시리스트 목록 | `/[locale]/settings/wishlists` | 필요 | 추정 | 4상태 구현, 2개 제한 클라이언트 검사 |
| P08 | 위시리스트 생성 | `/[locale]/settings/wishlists/create` | 필요 | 추정 | 링크 붙여넣기 → 메타데이터 자동 추출 |
| P09 | 위시리스트 상세·편집 | `/[locale]/settings/wishlists/[id]` | 필요 | 화면 동작 (**실행 확인**, 사용자 촬영), 공유 링크 복사 **깨짐**, 카테고리 표시 **깨짐** | 아이템 추가·수정·삭제·완료·일괄삭제·DnD 재정렬. 링크 `/w/w/<id>` 생성 (page.tsx:98). 카테고리 칩에 `wishlist.categories.GENERAL` 키 노출 — enum 대문자 vs 번역 키 소문자 (page.tsx:426) |
| P10 | 꾸미기 | `/[locale]/settings/customize` | 필요 | 추정 (미리보기 열기 **깨짐**) | 테마·레이아웃·색·프로필·소셜링크. `window.open('/w/'+shareUrl)` 이중 prefix (wishlist-selector.tsx:163) |
| P11 | 프로필 | `/[locale]/settings/profile` | 필요 | 추정 | 이름·bio·아바타·locale. DataImport는 주석 처리 |
| P12 | 통계 | `/[locale]/settings/analytics` | 필요 | 추정 | viewCount·clickCount, `as any` 로 접근 |
| P13 | 내 문의 | `/[locale]/settings/inquiries` | 필요 | 추정 | 에러 상태 없음(catch에서 삼킴) |
| P14 | 화면 설정 | `/[locale]/settings/appearance` | 필요 | **깨짐(스텁)** | 저장이 setTimeout만 (appearance/page.tsx:23) |
| P15 | 알림 설정 | `/[locale]/settings/notifications` | 필요 | **깨짐(스텁)** | notifications/page.tsx:39 |
| P16 | 관리자 대시보드 | `/[locale]/admin` | admin | 추정 | 권한 확인은 클라이언트 layout |
| P17 | 관리자 사용자 | `/[locale]/admin/users` | admin | 추정 | |
| P18 | 관리자 공지 | `/[locale]/admin/notices` | admin | 추정 | CRUD |
| P19 | 관리자 문의 | `/[locale]/admin/inquiries` | admin | 추정 | |
| P20 | 관리자 통계 | `/[locale]/admin/analytics` | admin | 추정 | |
| P21 | 관리자 에러 로그 | `/[locale]/admin/errors` | admin | **깨짐(데이터 없음)** | `logError()` 호출처 0 |
| P22 | 관리자 위시리스트·콘텐츠·설정·리포트 | `/[locale]/admin/{wishlists,content,settings,reports}` | admin | **깨짐(목업)** | 하드코딩 배열. reports는 메뉴에도 없음 |
| P23 | 컴포넌트 쇼케이스 | `/[locale]/components` | — | 추정 (정리 대상) | 개발용, 운영 공개 |
| P24 | 인증 디버그 | `/[locale]/debug-auth`, `/[locale]/test-auth` | — | 추정 (정리 대상) | 개발용, 운영 공개 |
| P25 | 공개 위시리스트 | `/w/[shareUrl]` · app/w/ | — | 기존 데이터 동작 (**실행 확인**), **신규 생성분 깨짐** | dev DB 공개 위시리스트 shareUrl은 10자 형식(보정 완료)이라 `/w/a87rzv5d6a` 정상 렌더. 신규는 `w/<id>` 저장 → `/w/w/<id>`. `<title>`·`lang`·메타 설명 없음(Lighthouse), 제목 대비 부족(스크린샷) |
| P26 | 404 / 500 / 에러 경계 | — | — | **없음** (**실행 확인**) | `/kr/nope` → Next 기본 흰 404 화면. not-found·error·global-error 파일 없음 |

## API

| ID | 메서드 · 경로 | 인증 | 판정 | 근거 |
|---|---|---|---|---|
| A01 | GET/POST `/api/auth/[...nextauth]` | — | 동작 확인 | Google, database session |
| A02 | GET `/api/auth/active-sessions` | 필요 | 추정 (미사용) | 호출처 없음, 토큰 앞 8자 응답 |
| A03 | POST `/api/auth/revoke-all-sessions` | 필요 | 추정 (미사용) | |
| A04 | POST `/api/auth/cleanup-sessions` | admin 또는 `?token=` | 추정 | 토큰 쿼리스트링, REVALIDATE 토큰 재사용 |
| A05 | GET `/api/wishlists` | userId 있을 때만 | 동작 확인 (**실행 확인**) | 비로그인 호출 시 공개 위시리스트 8개 반환(dev DB) — 전체 공개 목록 노출이 의도인지 확인 필요 |
| A06 | POST `/api/wishlists` | 필요 | 동작 확인 (제한 우회 있음) | productLinks로 아이템 10개 제한 우회, 비트랜잭션. shareUrl `w/` prefix 생성 |
| A07 | GET/PUT/DELETE `/api/wishlists/[id]` | 필요+소유 | 동작 확인 | |
| A08 | GET `/api/wishlists/[id]/items` | **없음** | 동작하나 **IDOR** | 비공개 아이템 노출, 호출처 없음 |
| A09 | POST `/api/wishlists/[id]/items` | 필요+소유 | 동작 확인 | 개수 확인 경쟁 조건 |
| A10 | POST `/api/wishlists/[id]/items/reorder` | 필요+소유 | 동작하나 **권한 누수** | 다른 위시리스트 아이템 priority 변경 가능 (lib/db/wishlist.ts:300) |
| A11 | PUT `/api/wishlists/[id]/customization` | 필요+소유 | 추정 | JSON 무검증 |
| A12 | GET/POST `/api/wishlists/[id]/analytics` | **없음** | 추정 | POST 공개 의도, GET은 비공개 제목 노출, itemId 소속 미확인 |
| A13 | GET `/api/wishlists/share/[shareUrl]` | 공개 (봇 403, rate limit) | 동작 확인 (email 노출) | 소유자 email 포함 |
| A14 | PUT/DELETE `/api/items/[id]` | 필요+소유 | 동작 확인 (재검증은 **깨짐**) | shareUrl 미select → revalidate 미실행 |
| A15 | POST `/api/items/[id]/toggle-complete` | 필요+소유 | 동작 확인 (재검증 동일) | |
| A16 | GET/PUT `/api/users` | 본인 | 동작 확인 | |
| A17 | POST `/api/users` | **없음** | 동작하나 **위험** | 임의 User 생성, 미사용 |
| A18 | POST `/api/image` | 필요 + rate limit | 추정 | 에러 전부 400, SVG 허용 |
| A19 | POST `/api/metadata` | **없음** + rate limit | 추정 (SSRF 취약) | S3 업로드 유발 |
| A20 | POST `/api/revalidate` | secret | 추정 (사실상 no-op) | 공유 페이지가 클라이언트 렌더 |
| A21 | GET `/api/health` | 공개 | 동작 확인 (**실행 확인**) | `healthy` 응답. 실패 시 DB 에러 메시지 노출(코드), 문서는 `ok` 로 오기 |
| A22 | GET/POST `/api/notices` | GET 공개 / POST admin | 추정 | POST는 admin/notices와 중복·미사용 |
| A23 | GET/POST `/api/qna` | 필요 | 추정 (미사용) | UserInquiry와 중복 |
| A24 | GET/POST `/api/inquiries` | 필요 | 추정 | type/priority 미검증 |
| A25 | GET `/api/admin/{stats,analytics,users,dashboard}` | 인라인 admin | 추정 | dashboard 한국어 상대시간·admin email 로그, users limit 상한 없음 |
| A26 | `/api/admin/{inquiries,notices,errors}` CRUD | 인라인 admin | 추정 | errors는 데이터 없음 |
| A27 | `/api/admin/qna` GET/PUT/DELETE | 인라인 admin | 추정 (미사용) | |
| A28 | (문서에만 존재) `/api/users/[id]/wishlists`, `/api/users/[id]/stats`, `/api/revalidate-batch` | — | **없음** | CLAUDE.md·docs/API.md 오기 |

## 백그라운드·기타

| ID | 기능 | 위치 | 판정 | 근거 |
|---|---|---|---|---|
| B01 | 세션 쿠키 기반 라우트 가드 | middleware.ts | 동작 확인 | 쿠키 존재만 확인 |
| B02 | 국가 헤더 주입 | middleware.ts:69 | **깨짐/죽음** | `req.geo` Next 15 제거, 읽는 곳 없음 |
| B03 | 만료 세션 정리 | /api/auth/cleanup-sessions | 추정 | 외부 cron 설정 흔적 없음 |
| B04 | 스크랩 이미지 S3 재업로드 | lib/services/s3-upload.ts | 추정 | 프리뷰 배포가 production/ 폴더로 업로드 |
| B05 | 에러 로그 DB 기록 | lib/utils/error-logger.ts | **깨짐(미호출)** | |
| B06 | 공유 페이지 GA | app/w/layout.tsx | 추정 | |
| B07 | 1회성 데이터 스크립트 | scripts/*.ts | 추정 | npm script 미등록, tsx 미설치, 환경 가드 없음 |
