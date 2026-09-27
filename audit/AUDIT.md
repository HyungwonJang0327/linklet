# AUDIT — 리뉴얼 전 현황 감사

- 감사일: 2026-09-27
- 기준 커밋: `eac797e` (태그 `pre-renewal`)
- 방법: 읽기 전용. 영역별(app / lib·hooks / components / prisma·문서·설정) 탐색 후 요약. 핵심 주장(공유 URL 이중 prefix)은 직접 재확인.
- `.env*` 값은 읽지 않았다. 키 이름만 확인.

---

## 1. 한 줄 요약

Google 로그인 사용자가 상품 링크를 붙여 넣으면 메타데이터(제목·이미지·가격)를 긁어 위시리스트를 만들고, 테마를 꾸며 `/w/{id}` 공개 링크로 공유하는 Next.js 풀스택 앱. 여기에 12월에 관리자 콘솔(공지·문의·사용자·에러로그)이 덧붙었다.

---

## 2. 스택과 실제 버전 (package-lock 기준)

패키지 매니저: **npm** (`package-lock.json`). 로컬 Node v24.21.0 / npm 11.19.0. `engines`·`.nvmrc` 없음.

| 영역 | 패키지 | 설치 | 최신 | 신호 |
|---|---|---|---|---|
| 프레임워크 | next | 15.5.9 | 16.3.6 | 메이저 1 뒤처짐, **audit critical** |
| UI | react / react-dom | 19.1.2 | 19.3.0 | 마이너 |
| 언어 | typescript | 5.9.2 | 7.0.2 | 메이저 뒤처짐(7은 Go 포트) |
| DB | prisma / @prisma/client | 6.15.0 | 7.10.0 (8 RC) | 메이저 1 뒤처짐, audit high |
| 인증 | next-auth | 4.24.13 | 4.24.15 | **v4는 유지보수 모드**(Auth.js v5 후속), audit critical |
| 인증 | @next-auth/prisma-adapter | 1.0.7 | — | **deprecated**(→ @auth/prisma-adapter) |
| 서버 상태 | @tanstack/react-query | 5.85.6 | 5.104.0 | 마이너 |
| 스타일 | tailwindcss | 4.1.12 | 4.3.3 | 마이너 |
| 스토리지 | @aws-sdk/client-s3 | 3.887.0 | 3.1141.0 | audit moderate |
| 파싱 | cheerio | 1.1.2 | 1.2.0 | `@types/cheerio`는 불필요(1.x 자체 타입) |
| 아이콘 | @heroicons/react 2.2.0 + lucide-react 0.542.0 | | lucide 1.48 | 두 벌 혼용 |
| DnD | @dnd-kit/* | 6.3.1 / 10.0.0 | | |
| 토스트 | sonner 2.0.7 | | | 자체 toast와 이중화 |
| 테스트 | vitest 4.0.14 | | 5.0.2 | audit critical(UI 서버), coverage/ui 플러그인 미설치 |
| 린트 | eslint 9.34 / eslint-config-next 15.5.2 | | 10 / 16 | Prettier 없음 |

`npm audit`: **총 50건 — critical 5 / high 19 / moderate 24 / low 2**. direct: next, next-auth, vitest(critical), prisma(high), @aws-sdk/client-s3(moderate).
`npm outdated`: 31개 패키지 뒤처짐(메이저 뒤처짐: next, prisma, typescript, eslint, vitest, jsdom, lucide-react, @vitejs/plugin-react, @paralleldrive/cuid2, @types/node).
extraneous 패키지 5개(@emnapi/*, @napi-rs/wasm-runtime, @tybys/wasm-util) — node_modules가 lock과 약간 어긋남.

---

## 3. 폴더 구조와 아키텍처

```
app/
├─ layout.tsx                 # <html> 없이 children만 반환 (root layout 분리 구조)
├─ page.tsx                   # / → /kr 고정 리다이렉트
├─ [locale]/                  # kr·en·jp. 자체 root layout(<html>) + globals.css
│  ├─ page.tsx                # 랜딩 (SSG)
│  ├─ login/ pricing/ notices/
│  ├─ components/ debug-auth/ test-auth/   # 개발용 페이지, 운영에 공개됨
│  ├─ settings/               # 사용자 영역 (wishlists, customize, profile, analytics, inquiries, appearance*, notifications*)
│  │  └─ wishlists/[id]/page.tsx  # 710줄 — 최대 파일
│  └─ admin/                  # 관리자 콘솔 (일부 목업)
├─ w/                         # 공유 페이지. 별도 root layout(GA 포함), [locale] 밖
│  └─ [shareUrl]/shared-wishlist-client.tsx  # 447줄, 클라이언트 렌더
└─ api/                       # 29개 route.ts (아래 FEATURES-before 참조)
components/  ui/ customize/ settings/ layout/ providers/ auth/ errors/ forms*(미사용) wishlist/
hooks/       TanStack Query 훅 (wishlistKeys 두 벌)
lib/
├─ db.ts                      # ⚠ 두 번째 PrismaClient — @/lib/db 가 이 파일로 resolve됨
├─ db/{client,index,wishlist,user}.ts
├─ auth-config.ts auth-helpers.ts auth.ts(죽은 Kakao 코드) session-security.ts
├─ services/url-metadata.ts(442) s3-upload.ts(262)
├─ rate-limit.ts              # 인메모리 Map
├─ revalidation.ts            # 자기 자신 /api/revalidate 로 HTTP 호출
├─ i18n/                      # config, dictionary(JSON lazy import), context(t())
├─ validations/ utils/ constants/ types/ styles/ theme/
middleware.ts                 # /w, /(kr|en|jp)/settings|admin — 세션 쿠키 존재만 확인
prisma/schema.prisma          # 11 모델, migrations 4개(2025-09-02에서 멈춤)
scripts/                      # 운영 DB에 붙을 수 있는 1회성 스크립트 4개 (가드 없음)
tests/lib/utils/              # 순수 유틸 테스트 3파일
```

```
[Browser]
  ├─ /[locale]/* (대부분 'use client')
  │     └─ hooks (TanStack Query) ──fetch──┐   ※ 상당수 컴포넌트는 훅을 우회해 raw fetch
  ├─ /w/[shareUrl] (client) ──fetch────────┤
  ▼                                        ▼
[middleware: 쿠키 존재 확인] → [app/api/* route handlers]
                                   ├─ requireAuth / verify*Ownership (lib/auth-helpers)
                                   │   또는 getServerSession + 인라인 isAdmin (admin 10개 파일)
                                   ├─ lib/db/* 또는 @/lib/db(별도 PrismaClient) 또는 prisma 직접
                                   ├─ lib/services/url-metadata → fetch(외부) → s3-upload → S3
                                   └─ lib/revalidation → HTTP POST 자기 자신 /api/revalidate
                                              ▼
                                   [Neon Postgres (추정)]   [S3 linklet-image, ap-northeast-2]
NextAuth(Google, database session 3일) ↔ Prisma adapter ↔ Account/Session 테이블
```

---

## 4. 데이터

- **DB**: PostgreSQL. 키 이름 조합(`POSTGRES_PRISMA_URL`, `PGHOST_UNPOOLED`, `DATABASE_URL_UNPOOLED`)으로 보아 **Vercel–Neon 통합**으로 추정. 스키마는 `DATABASE_URL`만 사용, `directUrl` 없음.
- **모델 (11)**: User, Wishlist, WishlistItem, Account, Session, VerificationToken (NextAuth), Notice, QnA, ErrorLog, UserInquiry. enum: WishlistCategory(10), InquiryType, InquiryStatus, Priority. 테이블은 snake_case `@@map`.
- 주목할 점
  - `WishlistItem.price` 가 **String**
  - `Wishlist.userId` nullable + `onDelete: SetNull` → 사용자 삭제 시 주인 없는 위시리스트 잔존
  - `Wishlist.isPublic @default(true)` 인데 API는 `isPublic ?? false`
  - `customization Json?` 무검증 저장
  - `QnA.status` 는 enum 아닌 String("pending"), `UserInquiry.status` 는 enum(PENDING) — 같은 개념 두 표기
  - `User.locale @default("kr")` — 비표준 코드(ko/ja가 표준)
  - FK 인덱스 없음: `Wishlist.userId`, `WishlistItem.wishlistId`, `QnA.userId`
  - DateTime은 전부 `timestamp(3)`(tz 없음). Prisma가 UTC로 쓰므로 사실상 UTC
- **마이그레이션 이력**: `prisma/migrations` 4개(마지막 `20250902053659_refresh_database`, `update_user_id_to_uuid` 는 빈 파일). 이후 Account·VerificationToken·Notice·QnA·ErrorLog·UserInquiry·isAdmin·view/clickCount·customization·siteName·avatar→image 변경이 **마이그레이션에 없음** → 2025-12 이후 `db push` 운용. enum 이름도 드리프트(`wishlist_category` vs `WishlistCategory`). README/DEPLOYMENT의 `migrate dev/deploy` 안내대로 새 DB를 만들면 스키마가 어긋난다.
- **Seed**: 없음.
- **실데이터**: README에 운영 URL(`link-let.vercel.app`)이 있고 `fix-share-urls.ts` 같은 데이터 보정 스크립트가 존재 → **운영 데이터 존재 가능성 높음. 규모 미확인(질문 Q1).**
- **외부 저장소**: S3 `linklet-image` — `{production|development}/{uploads|metadata}/`. 공개 버킷 URL 방식.

---

## 5. 외부 연동과 환경변수

| 연동 | 사용처 | 비고 |
|---|---|---|
| Google OAuth (NextAuth v4) | lib/auth-config.ts | database session, maxAge 3일. `pages.signIn: '/login'`(locale 없음) |
| AWS S3 | lib/services/s3-upload.ts | 프리뷰 배포가 `NODE_ENV=production` 이라 **production/ 폴더로 업로드됨** |
| 외부 웹 스크래핑 | lib/services/url-metadata.ts | SSRF 방어 취약(§7) |
| Google Analytics | app/w/layout.tsx | `NEXT_PUBLIC_GA_MEASUREMENT_ID`, 공유 페이지만 |
| Vercel | 배포, `VERCEL_ENV`/`VERCEL_URL` | revalidation이 VERCEL_URL로 자기 호출 |
| 결제·메일 | 없음 | 요금제 메뉴는 주석 처리 |

**환경변수 키 (값 미출력)** — `.env.development`/`.env.production` 둘 다 같은 28개 키, git 미추적·이력 유출 없음 확인.
- 코드가 실제 쓰는 키: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AMPLIFY_BUCKET`, `REVALIDATE_SECRET_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, (플랫폼) `VERCEL_ENV`, `VERCEL_URL`, `NODE_ENV`
- 파일에만 있고 미사용: `DATABASE_URL_UNPOOLED`, `PG*` 5개, `POSTGRES_*` 8개, `NEXT_PUBLIC_APP_NAME`(check-env만 필수 검사)
- 죽은 코드만 참조: `NEXT_PUBLIC_KAKAO_CLIENT_ID`, `NEXT_PUBLIC_KAKAO_REDIRECT_URI`
- `.env.example` **없음**. 부팅 시 스키마 검증 없음(`scripts/check-env.js` 는 predeploy에서만, 그리고 **값 앞 10자를 출력**).
- `AMPLIFY_BUCKET` 은 이름만 Amplify, 실제는 S3 버킷명. `next.config.ts` 에 버킷 도메인 하드코딩.

---

## 6. git 이력 신호

- 커밋 107개. 2025-08-30 시작. 월별: 08월 3 / **09월 49** / 11월 5 / **12월 49** / 2026-09 1(README).
- **마지막 코드 활동: 2025-12-29**. 이후 9개월 방치(README만 2026-09-05 수정).
- 가장 자주 바뀐 파일 Top 10

| # | 파일 | 변경 수 |
|---|---|---|
| 1 | lib/i18n/locales/en.json | 31 |
| 2 | lib/i18n/locales/kr.json | 29 |
| 3 | lib/i18n/locales/jp.json | 29 |
| 4 | components/settings/settings-sidebar.tsx | 17 |
| 5 | prisma/schema.prisma | 13 |
| 6 | package.json | 12 |
| 7 | app/[locale]/settings/wishlists/page.tsx | 11 |
| 8 | app/[locale]/settings/wishlists/create/page.tsx | 10 |
| 9 | app/[locale]/settings/wishlists/create/components/product-links.tsx | 10 |
| 10 | package-lock.json | 10 |

- 오래 방치된 영역: `app/globals.css`·`postcss`·`tsconfig`(2025-08-30 이후 무변경), `eslint.config`(08-31), `blog/`(09-04), `history/`(09-05 이후 기록 중단), `config/`(09-14, 빈 파일).
- 커밋 메시지 규약 불일치: `[feat] ...`, `feat: ...`, 한국어 서술형 혼재.

---

## 7. 부채 목록

심각도 기준 — high: 보안·데이터 손상·핵심 기능 깨짐 / med: 유지보수·정확성 위험 / low: 품질·일관성.

### High

| # | 항목 | 근거 |
|---|---|---|
| H1 | **신규 위시리스트 공유 링크 깨짐**: DB에 `w/<cuid>` 저장, 링크는 `/w/${shareUrl}` → `/w/w/<cuid>` (라우트 불일치). 과거 데이터는 `scripts/fix-share-urls.ts` 로 보정했으나 생성 코드는 그대로 | lib/db/wishlist.ts:64, app/[locale]/settings/wishlists/[id]/page.tsx:98, components/customize/wishlist-selector.tsx:163 |
| H2 | **SSRF**: 호스트명 문자열 정규식만 검사, DNS·IP 검사 없음, `redirect:'follow'`, IPv6(`[::1]`) 패턴 미매칭, og:image 다운로드는 무검사. `/api/metadata` 는 **비로그인 허용** + S3 쓰기 유발 | lib/services/url-metadata.ts:49-111, 110 / lib/services/s3-upload.ts:222 / app/api/metadata/route.ts:95-107 |
| H3 | **공개 공유 API가 소유자 email 노출** | lib/db/wishlist.ts:183-190, app/api/wishlists/share/[shareUrl]/route.ts |
| H4 | **`POST /api/users` 인증 없음** — 임의 email로 User 생성 가능(미사용 라우트) | app/api/users/route.ts:66 |
| H5 | **마이그레이션 드리프트** — 2025-09 이후 스키마 변경이 migrations에 없음, 문서는 migrate 안내 | prisma/migrations, prisma/schema.prisma, README, DEPLOYMENT.md |
| H6 | **PrismaClient 두 개** — `lib/db.ts` 가 `lib/db/index.ts` 를 가려 `@/lib/db` import가 별도 클라이언트 생성(운영에서 커넥션 풀 2개) | lib/db.ts, lib/db/client.ts (5곳에서 `@/lib/db` 사용) |
| H7 | **에러 경계 부재** — error.tsx / not-found.tsx / global-error.tsx / loading.tsx 하나도 없음. root layout에 `<html>` 없음 | app/ |
| H8 | **API 응답 형태 6종 이상** — `{error}`, `{error,message,limit}`, `{success:false,error}`, `{data:null,message}`, `{error,details:error.message}`(내부 에러 노출), health 전용 | app/api/** |
| H9 | **접근성 기준선 미달** — 클릭 div에 role/tabIndex/키보드 0건, 직접 만든 모달 4개에 role·Esc·포커스 트랩 없음, `Input` label-input 미연결(13곳), ToggleSwitch role 없음 | components/ui/input.tsx, image-upload.tsx:161, privacy-settings.tsx:28,53, settings/wishlists/[id]/components/*-dialog.tsx |
| H10 | **테스트 사실상 부재** — 순수 유틸 49개뿐. DB·API·인증·SSRF·훅·컴포넌트 0 | tests/ |
| H11 | **보안 패치 누락** — audit critical 5 (next, next-auth, vitest 등) | npm audit |
| H12 | **운영 DB에 붙을 수 있는 파괴적 스크립트** — 환경 가드 없음(`fix-share-urls.ts` 는 공유 링크 전부 재발급, `add-test-customizations.ts` 는 사용자 데이터 덮어쓰기) | scripts/ |

### Med

| # | 항목 | 근거 |
|---|---|---|
| M1 | IDOR: `GET /api/wishlists/[id]/items`·`GET .../analytics` 인증 없음(비공개 위시리스트 노출), reorder가 wishlistId로 필터 안 함 | app/api/wishlists/[id]/items/route.ts:8-19, lib/db/wishlist.ts:300-308 |
| M2 | 아이템 10개 제한 우회(생성 시 productLinks), 트랜잭션 없음, count-then-create 경쟁 | lib/db/wishlist.ts:116-135 |
| M3 | 서버측 입력 검증 부재/산발 — productUrl·imageUrl scheme 미검증, customization JSON 무검증, inquiries type/priority 미검증. `isValidUrl` **5벌** 구현이 서로 다르게 동작 | lib/utils/index.ts:42, validation.ts:6, url-validator.ts:7, validations/wishlist.ts:92, validations/user.ts:41 |
| M4 | 인메모리 rate limit — 서버리스 인스턴스마다 분리, `x-forwarded-for` 첫 값 신뢰 | lib/rate-limit.ts:13 |
| M5 | 인증 체크 이원화 — 헬퍼 vs admin 10개 파일 인라인 `session.user.isAdmin`(15회+ 복붙) | app/api/admin/** |
| M6 | 데이터 패칭 이원화 — 훅이 있는데 컴포넌트가 raw fetch + refetch. `wishlistKeys` 두 벌(모양 다름), 메타데이터 훅 3벌 | hooks/use-wishlist.ts:44, use-wishlists.ts:9, app/[locale]/settings/wishlists/[id]/page.tsx |
| M7 | 아이템 수정 시 ISR 재검증이 실행되지 않음(`shareUrl` 미select를 `as any` 로 읽음). 공유 페이지는 클라이언트 렌더라 ISR 자체가 빈 껍데기 캐싱 | app/api/items/[id]/route.ts:37, lib/db/wishlist.ts:276-282, app/w/[shareUrl]/page.tsx:4 |
| M8 | 공유 페이지 OG 미리보기 없음(generateMetadata 없음 + 봇 403) — 공유 서비스의 핵심 가치 손실 | app/w/[shareUrl]/ |
| M9 | 디자인 토큰 부재 — `@theme` 은 create-next-app 기본값, slate/blue 하드코딩(bg-slate-* 219회). Button/Card 기본값이 실제 테마와 불일치해 매번 덮어씀 | app/[locale]/globals.css, components/ui/button.tsx, card.tsx |
| M10 | UI 이중화 — Radix Dialog+DialogProvider(미사용) vs 직접 만든 모달 vs native confirm/alert; sonner vs 자체 toast | components/ui/dialog*.tsx, toast.tsx |
| M11 | 거대 파일 20개(>250줄). 최대 710줄 | app/[locale]/settings/wishlists/[id]/page.tsx 등 |
| M12 | `any` 63곳 (ESLint `no-explicit-any: off`) | eslint.config.mjs |
| M13 | 요청 취소 0건(AbortController 없음), [id] 페이지 토글·삭제·재정렬 중복 실행 가드 없음 | settings/inquiries/page.tsx, [id]/page.tsx |
| M14 | i18n 우회 — 하드코딩 한국어(아이템 카드, 다이얼로그 기본값, admin 전체), `t('x') \|\| '한국어'` fallback 약 40건. locale 코드 `kr/jp` 가 5곳+ 하드코딩 | components/wishlist/wishlist-item-card.tsx 등 |
| M15 | 목업·스텁 화면 운영 노출 — appearance/notifications 저장(setTimeout), admin wishlists/content/settings/reports 목업, admin/errors(ErrorLog 쓰는 곳 없음), debug-auth/test-auth/components 공개 | app/[locale]/** |
| M16 | QnA 와 UserInquiry 병행(모델·API 두 벌), admin 배지는 QnA 기준 | prisma/schema.prisma, app/api/qna, app/api/inquiries |
| M17 | 로그인 리다이렉트 경로 `pages.signIn: '/login'`(locale 없음) → `/login` 은 `[locale]=login` 으로 해석될 가능성 | lib/auth-config.ts:27-28 |
| M18 | 문서-코드 불일치 — CLAUDE.md·docs/API.md에 없는 엔드포인트 3개·없는 훅, 12월 기능 누락, S3 환경 판정 설명 틀림, DEPLOYMENT SQL 테이블명 틀림 | CLAUDE.md, docs/API.md, DEPLOYMENT.md |
| M19 | middleware `req.geo`(Next 15에서 제거) 사용, `x-user-country` 헤더는 아무도 읽지 않음 | middleware.ts:69 |
| M20 | S3 업로드 SVG 허용(stored XSS 위험), 확장자를 파일명에서 취함, WebP 매직바이트는 RIFF만 확인 | lib/services/s3-upload.ts |

### Low

| # | 항목 | 근거 |
|---|---|---|
| L1 | 죽은 코드 약 85개 export — lib/auth.ts(Kakao), validations/wishlist.ts, utils/validation.ts 대부분, styles/, theme/, forms/*, ui/error-boundary, image-upload-example, 미사용 API 5개 | 영역별 보고 |
| L2 | 아이콘 두 벌(heroicons 37파일 / lucide 13파일) | components/** |
| L3 | 중복 포매터 — `formatPrice` 2벌(시그니처 다름), 상대시간 2벌, `formatFullDate` 한국어 고정 | lib/utils/index.ts:13, format.ts:33, date.ts |
| L4 | dnd-kit 3열 grid에 `verticalListSortingStrategy` | [id]/page.tsx |
| L5 | 대비 미달 `text-slate-500` on slate-800/900 `text-xs` 14곳 | profile-form.tsx:135 등 |
| L6 | `images.domains` deprecated + 잘못된 항목 | next.config.ts:6 |
| L7 | 린트 경고 24(unused-vars 18, exhaustive-deps 6), `tw-animate` 미설치인데 animate-in 클래스 사용 | |
| L8 | `test:ui`·`test:coverage` 스크립트는 플러그인 미설치로 실패, `tests/setup.ts` 미등록 | package.json, vitest.config.ts |
| L9 | Prettier·engines·CI·pre-commit 없음 | |
| L10 | history/ 파일 날짜 오기(2025-01-05, 실제 2025-09-05), 기록 중단 | history/ |

### 고정 규약 위반

| 규약 | 위반 | 근거 |
|---|---|---|
| 시간: UTC 저장·ISO 직렬화·변환은 프론트만 | 서버가 한국어 상대시간("N분 전") 생성 / `toISOString().split('T')[0]` 로 서버 포맷 / 서버 로컬시간 `setHours` | app/api/admin/dashboard/route.ts:345-355, admin/users/route.ts:78, lib/utils/error-logger.ts:58 |
| 코드값 영어, DB에 한국어 문구 금지 | DB 저장 한국어는 없음. 단 API 응답에 한국어 문구(`'새 위시리스트 생성'`), locale 코드 `kr/jp` 비표준, QnA status 자유 문자열 | admin/dashboard/route.ts:269, prisma/schema.prisma |
| 키·토큰·PII 로그 금지 | **admin email console.log**, check-env가 **비밀값 앞 10자 출력**, cleanup-sessions가 토큰을 쿼리스트링으로 받음, active-sessions가 세션 토큰 앞 8자 응답 | admin/dashboard/route.ts:20,27, scripts/check-env.js, app/api/auth/cleanup-sessions |

---

## 8. 문서화되지 않은 결정

1. 인증을 Kakao(localStorage) → Google OAuth(NextAuth)로 교체 (lib/auth.ts 잔재)
2. JWT 대신 **database session** — 세션 강제 종료 목적 (blog/ 글에만 설명)
3. 2025-12 이후 migrate → **db push** 운용으로 전환
4. 공유 페이지를 `[locale]` 밖 `/w/*` 로, 별도 root layout + GA는 공유 페이지만
5. 공유 페이지는 클라이언트 렌더 + 공유 API 봇 차단 (→ OG 미리보기 포기 결과)
6. `/` 는 무조건 `/kr` (Accept-Language 미사용), 공유 페이지 locale은 브라우저 언어
7. 전원 무료 티어, 위시리스트 2개·아이템 10개·생성 시 링크 10개 제한
8. 스크랩 이미지를 S3로 재업로드(핫링크 깨짐 대비), 실패 시 원본 URL
9. 신규 위시리스트 기본 비공개(API) vs 스키마 기본 공개 — 어느 쪽이 의도인지 불명
10. 신규 위시리스트 기본 테마 "modern" 다크, customization은 무타입 JSON
11. `price` 를 String으로 저장
12. `Wishlist.userId` nullable + SetNull
13. 관리자는 `User.isAdmin` 수동 지정, 페이지 권한은 클라이언트 layout에서
14. 인메모리 rate limit 수용 ("consider Redis" 주석)
15. QnA → UserInquiry 이전 중 중단(두 시스템 공존)
16. analytics는 봇·rate limit 시 조용히 200
17. 만료 세션 정리 API는 외부 cron 호출 전제

---

## 9. 살릴 가치가 있는 모듈

| 모듈 | 이유 | 조건 |
|---|---|---|
| lib/services/url-metadata.ts 의 **파싱부** (OG·Twitter·JSON-LD 가격·한국 쇼핑몰 셀렉터·srcset) | 도메인 노하우가 가장 많이 쌓인 곳 | SSRF 검사는 전면 교체(DNS→IP 검사, 리다이렉트 수동) |
| lib/services/s3-upload.ts | 매직바이트 검증·파일명 정제·환경별 폴더 | SVG 제거, MIME 기반 확장자, `VERCEL_ENV` 기준 판정 |
| lib/auth-helpers.ts | `{error}` 반환 패턴이 단순·일관 | 타입 보강, admin 라우트까지 통일 |
| 서버측 제한 + 에러 코드(`WISHLIST_LIMIT_REACHED`) | 코드 기반 에러 응답의 씨앗 | 통일 스키마로 흡수 |
| lib/query-client.ts, hooks/use-user.ts | 올바른 서버/브라우저 QueryClient, 교과서적 낙관적 업데이트 | 쿼리키 팩토리 단일화 |
| lib/i18n 코어 + 3개 언어 JSON(857줄×3) | 작고 충분. 번역 자산 | ko/ja 코드 전환 검토, 키 타입 안전 |
| lib/utils/validation-helpers.ts, api-helpers.ts | 순수·테스트 있음 | 단일 검증/fetch 계층으로 승격 |
| components/ui/dialog.tsx (Radix+cva), Button, Input, Card, Loading | 접근성 기반·널리 사용 | 토큰화, Input label 연결 |
| wishlist-item-card, sortable-item + dnd 설정 | 기능 완성도 높음, 키보드 센서 연결됨 | i18n, rectSortingStrategy |
| create/*, profile/* 페이지 분해 구조 | 컴포넌트 분해가 잘 됨 | |
| reorder `$transaction`, health 엔드포인트 | | health 에러 메시지 노출 제거 |

---

## 10. 확인할 질문

- **Q1. 실사용자·실데이터**: 운영(link-let.vercel.app)에 실제 사용자 데이터가 있나? 대략 몇 명·몇 개?
- **Q2. `.env.development` 의 DB**: 운영 DB와 다른 DB(예: Neon dev 브랜치)를 가리키나? 확인 전까지 dev 서버·Prisma 명령을 실행하지 않는다.
- **Q3. 운영 DB의 shareUrl 형식**: 현재 `w/xxx` 와 `xxx` 가 섞여 있나? (H1 영향 범위)
- **Q4. 관리자 콘솔**: 리뉴얼 범위에 포함하나, 아니면 포트폴리오 핵심에서 제외하나?
- **Q5. QnA vs UserInquiry**: 어느 쪽을 남길 의도였나?
- **Q6. 신규 위시리스트 기본 공개 여부**: 스키마(공개)와 API(비공개) 중 의도는?
- **Q7. 스크린샷·Lighthouse 도구**: `npx playwright`, `npx lighthouse` 1회 실행 승인 여부, 로그인 화면용 테스트 계정 유무.
