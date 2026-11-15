# 데이터 모델 (v2 첫 마이그레이션)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| D1 | 첫 마이그레이션 범위 | `User`(최소) · `Wishlist` · `WishlistItem` · `Notice` · `Inquiry`. 인증 테이블(session·account·verification)과 admin 플러그인 필드(role·banned…)는 F08 마이그레이션에서 추가. 꾸미기(F27) 컬럼은 F27 때 |
| D2 | User 를 지금 포함 | Better Auth 핵심 필드 `id`·`name`(필수)·`email`(필수·unique)·`emailVerified`(boolean)·`image?`·`createdAt`·`updatedAt`(공식 문서 2026-11-14 확인) + 앱 필드 `bio?`·`locale`(ko·en·ja, 기본 ko)·`skin`(canvas·paper·pop, 기본 canvas)·`mode`(light·dark·system, 기본 system). Wishlist·Inquiry 의 소유자 FK 를 처음부터 건다(Cascade). 기존 앱의 "소유자 없는 위시리스트(SetNull)" 는 폐기 |
| D3 | 공통 규칙 | PK `uuid(7) @db.Uuid`(db-migration M5), FK 컬럼도 `@db.Uuid`, DateTime 은 전부 `@db.Timestamptz(3)`(UTC 규약), 테이블 이름 `@@map` snake_case 복수형, 컬럼은 camelCase(`@map` 없음), 상태·구분 값은 **소문자 영어 Prisma enum**, 문자열 길이 제한은 Zod 가(DB 는 text) |
| D4 | Wishlist | `userId` 필수, `shareId String @unique @default(nanoid(12))`(R8 — 값에 경로 접두사 없음), `isPublic` 기본 true(F15), `category WishlistCategory?`(F16 — birthday·occasion·someday, 미선택 null). 조회·클릭 카운트 없음(FEATURES D05) |
| D5 | WishlistItem | `price Decimal? @db.Decimal(14,2)` + `currency String? @db.Char(3)`(ISO 4217, 파서가 못 정하면 둘 다 null — F02 "price 숫자형"), `position Int`(F22 순서, 기존 `priority` 이름 변경), `isReceived`(용어표, 기존 `isCompleted`), `@@index([wishlistId, position])` |
| D6 | Notice | 기존 필드 유지(title·content·isPublished·isPinned), `@@index([isPublished, isPinned, createdAt])` |
| D7 | Inquiry | `type`(question·feedback·bug_report·feature_request)·`subject`·`content`·`response?`·`status`(pending·in_progress·answered·closed, 기본 pending)·`respondedAt?`. **기존 `priority`·`category` 제거**(FEATURES F30 비고 갱신) |
| D8 | 폐기 모델 | QnA(D03)·ErrorLog(Sentry 대체)·VerificationToken/Account/Session(NextAuth 형식 — F08 에서 Better Auth 형식으로 새로 생성) |

## 이유

- User 를 뒤로 미루면 Wishlist.userId 가 FK 없는 uuid 가 되어 시드·서비스 권한 테스트가 임의 값으로 돌고 참조 무결성이 한 단계 늦게 생긴다. Better Auth 는 테이블·컬럼 이름 재매핑과 DB 측 ID 생성(`generateId: false`)을 지원하므로 먼저 만들어도 F08 에서 충돌이 없다
- 문의 `priority`(사용자가 자기 문의의 우선순위를 매김)는 캐주얼 컨셉·관리자 최소 범위(FEATURES Q6)와 맞지 않고, `category` 는 자유 문자열이라 값 관리가 안 된다
- `price` 를 숫자형으로 두는 것은 F02 재설계 근거. 파서 정답(fixture 12쌍)의 가격은 `"₩45,000"`·`"€19,99"`·`"KRW 59000"` 처럼 통화 표기가 섞여 있어 통화 컬럼을 분리해야 정렬·표시가 가능하다. 변환 규칙은 F19(아이템 추가)에서 정한다
- `Timestamptz`: Prisma 기본 `timestamp(3)`(tz 없음)도 UTC 로 저장되지만, 세션·서드파티 도구에서 tz 해석이 어긋나는 사고를 막는다

## 기각된 대안

- User 는 F08 에서 (todo 원문) — FK 지연·시드 임의 uuid (사용자: 포함 추천안 선택, 2026-11-14)
- Inquiry 기존 필드 전부 유지 — FEATURES 변경은 없지만 쓰지 않을 입력을 검증·번역·UI 까지 끌고 간다 (사용자: 제거 추천안 선택)
- DB `VarChar(n)` 길이 제한 — 한도 변경마다 마이그레이션. Zod 한 곳이 한다
- 카테고리·상태를 `String` 으로 — enum 이 DB 수준에서 값 집합을 고정한다. 소문자 값이라 함정 11(대문자 enum 을 번역 키에 직접 사용)과 무관

## 확장 지점

- F08: session·account·verification + User 에 admin 플러그인 필드(`role` 기본 `user` 등) — 같은 `uuid(7)` 기본값
- F27: Wishlist 에 `themePreset`·`layout`(grid·list)·`accentColor`·소셜 링크 컬럼
- 새 상태 값은 enum 에 추가(마이그레이션 1개)

## 결정일

2026-11-14

## 갱신 이력

- 2026-11-14 최초 결정 (사용자: User 최소 포함·Inquiry priority/category 제거 — 둘 다 추천안. 나머지는 메인이 FEATURES F02 범위 안에서 확정)
