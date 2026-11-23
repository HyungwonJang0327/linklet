# 권한 판정 (v2)

> 아키텍처 A3("권한 판정은 서비스 계층 한 곳")의 구체 규칙. 구현은 `v2/src/features/auth/server/authorization.ts`, 판정표 테스트는 같은 폴더 `authorization.test.ts`. FEATURES F10.

## 결정

| # | 항목 | 결정 |
|---|---|---|
| P1 | 요청자(Requester) | 서비스는 세션이 아니라 요청자를 받는다 — `anonymous` 또는 `user { userId, role: 'user' \| 'admin' }`. 세션 → 요청자 변환은 `toRequester` 하나. Route Handler·Server Component 는 세션을 읽어 넘기기만 하고 판정하지 않는다 |
| P2 | 판정 함수 | `requireUser`(로그인) · `requireAdmin`(관리자) · `requireOwner`(소유자만 — 수정·추가) · `requireOwnerOrAdmin`(소유자 또는 관리자 — 삭제=제재) · `canView`(열람, throw 없음). 새 동작은 이 다섯 중 하나를 쓴다. 서비스가 직접 `role`·`userId` 를 비교하지 않는다 |
| P3 | 관리자는 소유자가 아니다 | 관리자는 남의 위시리스트·아이템을 **수정·추가하지 못한다**. 할 수 있는 것은 **제재** — 삭제(내리기)와 사용자 차단(admin 플러그인). 위법 상품·링크 게재를 제지할 수단은 두되, 사용자 콘텐츠를 관리자가 고쳐 쓰는 경로는 만들지 않는다 (사용자 결정 2026-11-23) |
| P4 | 차단 중 사용자의 세션 | `banned` 이고 `banExpires` 가 없거나 지나지 않았으면 요청자는 `anonymous`(비로그인과 같다). Better Auth admin 플러그인은 **세션 생성 시에만** 차단을 검사하므로(`plugins/admin/admin.mjs` `session.create.before`, 2026-11-23 확인) 살아 있는 세션은 여기서 한 번 더 거른다. 기한이 지난 차단은 플러그인과 같은 기준으로 해제로 본다 (사용자 결정 2026-11-23) |
| P5 | 타인 리소스의 응답 | 비로그인은 항상 `401 UNAUTHENTICATED`. 로그인한 타인은 리소스가 **비공개면 `404 NOT_FOUND`**(존재를 숨긴다 — error-handling E1 표), **공개면 `403 FORBIDDEN`**(존재는 이미 공개). `isPublic` 을 모르면 404(안전한 쪽). 열람(`canView`)은 소유자는 항상, 그 외(관리자 포함)는 공개일 때만 |
| P6 | role 값 | `'admin'` 만 관리자. `'user'`·없음·모르는 값은 전부 일반 사용자(열린 값을 관리자로 해석하지 않는다). DB `role` 은 admin 플러그인이 문자열로 다루므로 enum 이 아니다(data-model D3 예외) |
| P7 | 라우트 보호(F09) | 판정은 **구간 layout 한 곳** — `[locale]/(app)/layout.tsx`(로그인 필요)·`[locale]/admin/layout.tsx`(관리자). `getRequester()`(헤더 → `getSession` → `toRequester`, React `cache`) 로 요청자를 읽고, 비로그인은 `unauthorized()` → `[locale]/unauthorized.tsx` **401 제자리 안내**(로그인 안내 + Google 버튼, `returnTo='current'` 라 로그인 뒤 원래 경로로 돌아온다), 로그인했지만 관리자가 아니면 `forbidden()` → `[locale]/forbidden.tsx` **403**. `experimental.authInterrupts` 플래그(Next 16.3 실험, `unauthorized.md`·`forbidden.md` — root layout 에서는 못 부른다). proxy 는 세션 쿠키를 보지 않는다. 로그인 상태로 `/login` 에 오면 서버 세션 검증 뒤 랜딩으로. 데이터 권한은 서비스가 P2 함수로 따로 본다 (사용자 결정 2026-11-23) |

## 이유

- 기존 앱은 헬퍼 1종(`lib/auth-helpers.ts`) + admin 라우트 10개 파일에 인라인 `isAdmin` 체크 15회+(AUDIT M5), 인증 없는 읽기 API(M1 IDOR)가 있었다. 판정을 한 파일의 순수 함수로 모으고 서비스만 쓰게 하면 "라우트에서 체크를 빠뜨리는" 실수가 구조로 막힌다
- 순수 함수(DB·요청 객체 없음)라 판정표를 단위 테스트로 통째로 고정할 수 있다 — FEATURES F10 의 동등성 확인 방법
- 관리자에게 소유자 권한을 주면 구현은 단순하지만 사용자 데이터를 관리자가 편집하는 경로가 생긴다. 필요한 것은 "내리기" 뿐이라 삭제·차단으로 한정한다

## 기각된 대안

- 관리자 = 모든 리소스의 소유자 (P3) — 최소 권한 원칙 위반, 제재에는 삭제·차단이면 충분
- 차단은 플러그인에만 맡김 (P4) — DB 에서 직접 차단한 경우 살아 있는 세션이 남는다
- 타인 리소스를 항상 403 — 비공개 위시리스트 id 의 존재가 드러난다
- 타인 리소스를 항상 404 — 공개 위시리스트 수정 시도까지 "없음" 으로 답하면 클라이언트가 잘못된 안내를 하게 된다
- (P7) proxy 에서 세션 쿠키 존재로 리다이렉트 — 쿠키 없음은 확실하지만 만료·위조 쿠키는 어차피 서버에서 다시 봐야 해 판정이 두 곳이 된다. Next 인증 가이드도 proxy 는 선택(optimistic)이라 한다
- (P7) 비관리자 `/admin` → 404 로 존재 숨김 — 메인 추천이었으나 기각(갱신 이력)

## 확장 지점

- 관리자 콘텐츠 제재 화면·API(위시리스트·아이템 내리기, 사용자 차단) — FEATURES 에 새 행 필요(Q6 관리자 범위에 없음). 서비스는 `requireOwnerOrAdmin`·admin 플러그인 `banUser` 를 쓴다 (todo/migrator-todo "F40 후보")
- 역할이 늘면 `Role` 유니온과 `toRequester` 의 매핑만 바꾼다. Better Auth admin 플러그인의 세분 권한(`ac`·`roles`)은 지금 필요 없다
- 보호 화면이 늘면 `(app)`·`admin` 그룹 아래에 두기만 하면 된다 — 페이지마다 세션을 읽지 않는다. 서버에서 세션이 필요한 페이지는 `getRequester()` 를 다시 불러도 같은 렌더에서는 cache 된다
- 로그인 뒤 돌아갈 곳: `unauthorized.tsx` 는 현재 경로, `/login` 페이지와 기본 버튼은 랜딩(F13 뒤 `/{locale}/wishlists`)

## 결정일

2026-11-23

## 갱신 이력

- 2026-11-23 최초 작성 (F10)
- 2026-11-23 P7 라우트 보호 추가 (F09). 사용자 결정: 비로그인은 리다이렉트 대신 **제자리 401**(기각: `/login` 리다이렉트 + proxy 쿠키 확인 — 돌아오기(`?next=`)가 후속으로 남고 만료 쿠키 처리가 두 곳), 비관리자는 **403**(메인이 404 를 추천했으나 사용자 지적 "보통은 403" — `/admin` 경로는 자명해 숨길 이득이 없고 API `requireAdmin` 이 403 이라 화면도 맞춤. 기각: 랜딩 리다이렉트). 레이아웃이 직접 그리면 상태 200 이라 `authInterrupts` 플래그를 켠다
