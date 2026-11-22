const L = require('./lib'); const { DATA, run, p, h1, h2, h3, bullet, numbered, note, code, table, kv, pageBreak } = L
const S = []

S.push(h1('1. 설계 개요'))
S.push(h2('1.1 문서 목적과 범위'))
S.push(p('이 문서는 요건정의서의 요구사항을 만족하는 v2 의 전체 구조를 정한다. 시스템 구성, 기술 스택, 코드 구조와 의존 방향, 화면 구성과 이동, 데이터 모델 개요, API·에러 규약, 인증·권한, 보안, 디자인 시스템, i18n, 로그·모니터링, 테스트·CI·배포, 로드맵을 다룬다. 테이블 컬럼·API 요청/응답·화면 요소 수준의 명세는 상세설계서에 있다.'))
S.push(h2('1.2 설계 원칙'))
;['같은 일을 하는 경로는 하나 — 데이터 접근·인증 체크·fetch·모달·토스트를 두 벌 만들지 않는다 (리뉴얼 전 이원화 재발 방지)',
  '규칙은 문서가 아니라 구조와 도구로 강제한다 — ESLint import 경계, Zod 스키마 공유, 응답 헬퍼, 토큰만 쓰는 Tailwind 테마, 로컬 DB 가드',
  '권한 판정은 서비스 계층 한 곳 — Route Handler 와 Server Component 는 요청자만 넘긴다',
  '기능(도메인)별 폴더 — FEATURES 한 행을 한 폴더로 이식·검증·제거한다',
  '예상된 실패와 예상 못한 실패를 구분하고, 후자만 기록한다. 개인정보는 어떤 로그에도 남기지 않는다',
  '모바일 우선, 한 화면에 한 가지 일, 콘텐츠가 주인공, 비어 있음이 안내서 (UX 원칙 12개 중)',
  '무료 티어 안에서만. 유료가 필요한 선택지는 채택하지 않는다'].forEach(t => S.push(bullet(t)))

S.push(h1('2. 시스템 구성'))
S.push(h2('2.1 전체 구성도'))
S.push(...code(`[브라우저 / 메신저 크롤러]
      │ HTTPS
      ▼
[Vercel Hobby] ── WAF 레이트 리밋(/api/link-previews)
  ├─ Next.js 16 App Router (Node 24, Turbopack)
  │    ├─ proxy.ts        : / → /{locale} 307 (Accept-Language), 보호 구간 세션 확인(F09)
  │    ├─ app/[locale]/…  : 랜딩·로그인·앱·관리자 (Server/Client Component)
  │    ├─ app/w/[id]      : 공유 페이지 (서버 렌더 + OG 메타, 별도 root layout)
  │    └─ app/api/*       : Route Handler (Zod 파싱 → 서비스 → 응답 헬퍼)
  │           │
  │    features/*/server/service ──► repository ──► server/db (Prisma 7 + adapter-pg, 인스턴스 1개)
  │           │                                        │
  │    server/auth (Better Auth, DB 세션)           [Neon PostgreSQL] (운영) / [Docker Postgres] (로컬·CI)
  │    server/storage (R2, S3 SDK)  ──────────────► [Cloudflare R2]
  │    shared/lib/safe-fetch ─────────────────────► [상품 사이트] (DNS→IP 검사, 리다이렉트 재검사)
  │    server/logger ─────────────────────────────► stdout JSON + [Sentry] (개인정보 제거)
  └─ 공유 페이지 GA page_view ─────────────────────► [Google Analytics]`))
S.push(h2('2.2 요청 흐름'))
S.push(table(['흐름', '경로'], [
  ['읽기(초기 렌더·공유 페이지)', 'Server Component → features/*/server/service 직접 호출 → repository → db. API 왕복 없음'],
  ['읽기·쓰기(클라이언트)', 'Client Component → TanStack Query 훅(features/*/hooks) → fetch 클라이언트 → app/api Route Handler → Zod 파싱 → service(권한 판정) → repository → db → 응답 헬퍼 { data } / { error }'],
  ['인증', 'Better Auth 핸들러 /api/auth/[...all]. 세션은 DB 저장, 쿠키. 서비스는 세션에서 뽑은 요청자(userId·role)만 받는다'],
  ['외부 URL', 'Route Handler → safe-fetch(DNS 해석 → 사설·링크로컬·IPv6 차단 → 리다이렉트마다 재검사 → 크기·시간 제한) → 파서'],
  ['에러', '서비스 AppError(code) → 응답 헬퍼가 상태·본문 생성. 그 외 예외 → 500 INTERNAL + logger(JSON) + Sentry'],
], [1.3, 4]))
S.push(h2('2.3 실행 환경'))
S.push(table(['환경', '앱', 'DB', '비고'], [
  ['로컬 개발', 'pnpm dev (3000)', 'Docker Postgres 5433 linklet_dev', '.env.local. 시드 pnpm db:seed'],
  ['로컬 테스트', 'Vitest / Playwright(3002, 빌드)', 'Docker Postgres 5434 linklet_test (tmpfs)', 'setup 이 DATABASE_URL 을 덮음. 미기동이면 통합 skip'],
  ['CI (GitHub Actions)', 'lint·format·typecheck·test:coverage·build', 'service container postgres:17 → 5434', 'LINKLET_REQUIRE_TEST_DB=1. 빌드는 더미 env, DB 미접속'],
  ['운영', 'Vercel Hobby (v2/ 루트)', 'Neon Free (pooled + unpooled)', 'sslmode 필수, https 강제. 마이그레이션은 사용자가 직접'],
  ['기존 앱 기준선', 'next start 3001 (루트, 동결)', '전용 컨테이너 54329 (db push 예외)', '동등성 비교 전용, 로컬만'],
], [1, 1.6, 1.8, 2.2]))

S.push(h1('3. 기술 스택'))
S.push(table(['영역', '선택', '버전', '설치(2026-11-22)', '선택 이유 요약'], [
  ['런타임', 'Node.js', '24.x LTS', '24', 'Active LTS, Vercel 기본'],
  ['프레임워크', 'Next.js App Router (cacheComponents 끔)', '16.3.x', '16.3.6', 'proxy.ts·await 요청 API·Turbopack. PPR 은 TanStack Query 충돌로 끔'],
  ['UI', 'React', '19.x', '19.2.8', '—'],
  ['언어', 'TypeScript strict + noUncheckedIndexedAccess', '5.x', '5.9.3', 'any 금지'],
  ['인증', 'Better Auth + Prisma 어댑터 (Google, DB 세션, admin 플러그인)', '1.7.x', '— (F08)', 'NextAuth v4 critical·유지보수 모드. 세션 목록·role 기본 제공'],
  ['ORM·DB', 'Prisma + @prisma/adapter-pg / PostgreSQL (Neon Free, 로컬 Docker)', '7.10.0 고정', '7.10.0', 'latest 태그가 8 RC. adapter-pg 하나로 로컬·CI·운영 동일'],
  ['입력 검증', 'Zod (zod/mini 만 import)', '4.x', '4.6.7', 'classic 92KB vs mini 5.5KB gzip'],
  ['서버 상태', 'TanStack Query', '5.x', '— (F13)', '쿼리 키 팩토리 기능별 하나'],
  ['스타일', 'Tailwind CSS (@theme 토큰)', '4.x', '4.3.3', '기본 팔레트 비움, 토큰만 유틸리티로'],
  ['아이콘', 'lucide-react', '1.x', '— (첫 UI)', '한 벌만'],
  ['이미지 저장소', 'Cloudflare R2 (S3 SDK)', '—', '— (F20)', '기한 없는 무료 10GB, 송신 무료. S3 는 유료 전환'],
  ['빈도 제한', 'Vercel WAF 규칙 1개 + Better Auth 내장', '—', '—', '추가 서비스 없음'],
  ['모니터링', 'Sentry Developer', '@sentry/nextjs 11.x', '— (F06)', '30일 보관, 개인정보 제거'],
  ['테스트', 'Vitest + coverage-v8 / Playwright', '최신 / 1.63.x', '5.0.2 / 1.63.0', '통합은 Docker Postgres'],
  ['린트·포맷', 'ESLint flat(eslint-config-next) + Prettier', '—', '9.39.5 / 3.9.9', 'jsx-a11y 에러, import 경계'],
  ['패키지', 'pnpm', '10.x', '10.34.5', 'Vercel 지원 범위'],
  ['시크릿 스캔', 'gitleaks pre-commit + CI', '—', '8.30.1', '리포 PUBLIC'],
  ['배포', 'Vercel Hobby', '—', '— (첫 배포)', '비상업·개인'],
], [0.9, 2.2, 0.8, 0.9, 2.2], { fontSize: 15 }))
S.push(note('의존성 추가는 5가지 기준(직접 구현 비용·유지보수·번들·라이선스·비용)을 확인하고 decisions/dependencies.md 에 기록한 뒤에만 한다. 설치 예정: better-auth, @tanstack/react-query, @aws-sdk/client-s3, @sentry/nextjs, cheerio, @dnd-kit/*.'))

S.push(h1('4. 코드 구조'))
S.push(h2('4.1 폴더 구조'))
S.push(...code(`v2/
├─ src/
│  ├─ app/                      # 라우트 파일만 (얇게)
│  │  ├─ [locale]/layout.tsx    # root layout (A6): <html lang data-skin data-mode>, I18nProvider, Topbar
│  │  ├─ [locale]/(public)/     # 랜딩·로그인·공지
│  │  ├─ [locale]/(app)/        # 로그인 필요: 위시리스트·설정·문의
│  │  ├─ [locale]/admin/        # 관리자
│  │  ├─ w/[id]/                # 공유 페이지 (별도 root layout, 서버 렌더 + OG)
│  │  ├─ api/                   # Route Handlers
│  │  └─ global-error.tsx · global-not-found.tsx · [locale]/{error,not-found}.tsx
│  ├─ features/{도메인}/        # components/ hooks/ server/{service,repository}.ts schema.ts i18n-keys.ts index.ts
│  │     wishlist · item · link-preview · share · customize · profile · inquiry · notice · admin · session
│  ├─ shared/ui/                # 토큰 기반 공통 컴포넌트 (Topbar, EmptyState, Dialog(Radix), Button, Input, Card, Sheet, Toast…)
│  ├─ shared/lib/               # api-error · api-response · validation · redact · log-format · safe-fetch · rate-limit · fetch 클라이언트
│  ├─ shared/i18n/              # config · dictionaries/{ko,en,ja}.ts · t · keys · negotiate · client(Provider)
│  ├─ shared/config/env.ts      # Zod 환경변수 (서버) · env.client.ts (NEXT_PUBLIC_)
│  ├─ server/                   # 서버 전용: db.ts · api-handler.ts · logger.ts · auth.ts · storage.ts · test-db.ts(테스트 전용)
│  ├─ instrumentation.ts        # 부팅 시 env 검증
│  └─ proxy.ts                  # Next 16 (middleware 아님)
├─ prisma/  schema.prisma · migrations/*/(migration.sql + down.sql) · seed.mts · lib/(local-db·test-db-url·tcp-probe)
├─ scripts/db-migrate.mts       # migrate dev + down.sql + generate 래퍼 (로컬 가드)
└─ e2e/                         # Playwright (+ baseline/ 기존 앱 기준선)`))
S.push(h2('4.2 의존 방향과 경계'))
S.push(bullet('app → features → shared, features/*/server → server. 역방향 금지'))
S.push(bullet('기능끼리는 features/{x}/index.ts 공개 API 로만 import. 같은 기능 안에서는 상대 경로'))
S.push(bullet('클라이언트 코드(features/*/components·hooks, shared/ui)에서 server/·features/*/server import 금지'))
S.push(bullet('서버 전용 모듈은 import "server-only". 환경변수는 shared/config/env 로만 읽는다(process.env 직접 참조 금지)'))
S.push(bullet('모두 ESLint no-restricted-imports / no-restricted-syntax 로 강제. 추가 금지: any, classic zod, dark: 변형, prisma/seed import, test-db 비테스트 import'))
S.push(h2('4.3 계층 책임'))
S.push(table(['계층', '책임', '하지 않는 것'], [
  ['Route Handler (app/api)', 'body·query·params Zod 파싱, 세션에서 요청자 추출, 서비스 호출, 응답 헬퍼', '권한 판정, DB 접근, 에러 JSON 직접 작성'],
  ['Server Component', '초기 렌더·공유 페이지 데이터 로드(서비스 직접 호출), 메타데이터', '쓰기, 권한 판정'],
  ['service', '도메인 로직, 권한 판정, 상한 검사, 트랜잭션 경계, AppError throw', 'HTTP 형식, 요청 파싱'],
  ['repository', 'Prisma 쿼리, 공개용 select 명시', '권한 판정, 비즈니스 규칙'],
  ['hooks (TanStack Query)', '쿼리 키 팩토리, fetch 클라이언트 호출, 무효화, signal 전달', 'raw fetch, 전역 스토어'],
  ['components', '표시, 로컬 상태(모달·입력 중 값), 4상태 렌더', 'fetch, 서버 모듈 import'],
  ['shared/ui', '토큰 기반 공통 컴포넌트, 접근성 기준선 내장', '도메인 지식'],
], [1.3, 3, 2]))

S.push(pageBreak())
S.push(h1('5. 화면 설계 (기본)'))
S.push(h2('5.1 화면 목록'))
S.push(table(['ID', '화면', '경로', '구간·권한', '주된 행동', 'FEATURES'], DATA.SCREENS.map(s => [s[0], s[1], s[2], s[3], s[6], s[8]]), [0.5, 1.4, 2, 1.2, 2.4, 1.2], { fontSize: 15 }))
S.push(h2('5.2 화면 이동 흐름'))
S.push(...code(`/  ─(Accept-Language)─► /{locale} 랜딩 S01 ──► 로그인 S02 ──(Google)──► 내 위시리스트 목록 S03
                                                                              │  (0개면 S04 직행 여부 미결)
     설정 허브 S07 ◄──(아바타)── Topbar ──────────────────────────────────────┤
       ├─ 프로필 S08 · 화면 설정 S09 · 로그인 기기 S10 · 문의 S11 · 공지 S12 · 로그아웃      │ 새 위시리스트 만들기
                                                                              ▼
                      생성 3분 흐름 S04: 제목 → 링크 붙여 넣기(미리보기) → 완료(링크 복사) ──► 상세 S05
                                                                                              │
                 상세 S05: 링크 추가(시트) · 편집/삭제(Dialog) · 순서 변경 · 받음 · 공개 토글 · 공유 링크 복사
                           ├─ 꾸미기 S06 (프리셋·레이아웃·강조색·소셜) ─► 저장 → S05
                           └─ 공유 페이지 S17 /w/{shareId} (새 탭) ─► 상품 사이트 / "나도 만들어 보기" → S01
관리자: S13 대시보드 ─► S14 공지 관리 · S15 문의 관리 · S16 사용자 목록 (role=admin 서버 확인)
공통: 매치 안 되는 URL → 404 S18, 렌더 에러 → 에러 경계 S19`))
S.push(h2('5.3 레이아웃·내비게이션'))
S.push(bullet('모바일 우선(390px 기준). 데스크톱은 그 확장. 주요 버튼은 하단 고정(엄지 영역), 모달은 시트형'))
S.push(bullet('글로벌 nav — 모바일: 워드마크 + 아바타(탭 → /settings 허브, 드롭다운 없음). 데스크톱: 워드마크 + "위시리스트 · 설정" + 아바타'))
S.push(bullet('설정은 허브(그룹별 행) + 항목별 페이지. 데스크톱은 같은 목록이 왼쪽 사이드바(한 컴포넌트, aria-current)'))
S.push(bullet('꾸미기 진입점은 상세 화면 버튼 하나. 공지·문의는 설정 허브 "도움말" 그룹에만'))
S.push(bullet('필터·정렬·탭은 URL 쿼리(U4). 모달 열림·입력 중 값은 로컬 상태. 전역 스토어 없음'))
S.push(h2('5.4 화면 4상태 규칙'))
S.push(p('목록·상세 화면은 로딩(스켈레톤)·비어 있음(다음 행동 안내 + 예시)·에러(errors.{CODE} 문구 + 다시 시도)·정상 네 상태를 같은 작업에서 함께 만든다. 화면을 떠나면 진행 중 요청을 취소하고(TanStack Query signal), 제출 버튼은 진행 중 중복 실행을 막는다. 본보기는 F13 목록이다.'))

S.push(h1('6. 데이터 모델 (개요)'))
S.push(h2('6.1 엔티티 관계'))
S.push(...code(`users ──1:N──► wishlists ──1:N──► wishlist_items
  │  (Cascade)      │ shareId UNIQUE (nanoid 12, 경로 접두사 없음)
  ├──1:N──► inquiries
  ├──1:N──► sessions   [예정 F08, Better Auth]
  └──1:N──► accounts   [예정 F08]        verifications [예정 F08]        notices (독립)`))
S.push(h2('6.2 공통 규칙'))
S.push(table(['항목', '규칙'], [
  ['PK', 'UUID v7 — String @id @default(uuid(7)) @db.Uuid. Better Auth 는 generateId:false 로 같은 방식. 번호 id 없음'],
  ['공유 ID', 'PK 와 별도 nanoid(12) @unique. 재발급으로 옛 링크 무효화. URL 은 라우트가 조합(/w/{shareId})'],
  ['시간', '전부 Timestamptz(3), UTC. 직렬화 ISO 8601. 지역 시간·상대시간은 프론트에서'],
  ['이름', '테이블 snake_case 복수형(@@map), 컬럼 camelCase, 상태·구분은 소문자 영어 Prisma enum'],
  ['길이 제한', 'DB 는 text, 제한은 Zod 스키마 한 곳(features/*/schema.ts)'],
  ['삭제', 'User 삭제 시 Cascade. 소유자 없는 위시리스트(SetNull) 폐기'],
  ['폐기', 'QnA, ErrorLog, viewCount·clickCount, customization Json(→ 컬럼), NextAuth 형식 세션 테이블'],
], [1, 4]))
S.push(h2('6.3 테이블 요약'))
S.push(table(['테이블', '설명', '키·인덱스', '상태'], DATA.TABLES.map(t => [t.name, t.desc, t.idx.join('\n'), t.status]), [1, 2.4, 2, 1.1]))
S.push(h2('6.4 마이그레이션·시드'))
S.push(bullet('prisma migrate dev 로만 생성, db push 금지. 마이그레이션마다 down.sql 동봉(pnpm db:migrate {이름} 래퍼: diff → migrate dev → down.sql 이동 → generate)'))
S.push(bullet('적용 순서: 로컬 Docker → CI(빈 DB 전체 적용) → dev DB → 운영. 운영 적용은 사용자가 직접'))
S.push(bullet('Prisma CLI 는 DATABASE_URL_UNPOOLED 호스트가 로컬이 아니면 throw(fail-closed). 우회는 셸 값 LINKLET_ALLOW_REMOTE_DB=1 만'))
S.push(bullet('시드: 개발용 사용자 1·위시리스트 3·아이템 6·공지 2·문의 1, 고정 UUID upsert 멱등, 3단계 가드. 테스트는 시드에 의존하지 않는다'))

S.push(pageBreak())
S.push(h1('7. API 설계 (기본)'))
S.push(h2('7.1 응답 규약'))
S.push(...code(`// 성공
{ data: T }                                   // 단일 리소스
{ data: T[]; nextCursor: string | null }      // 목록 (커서 하나로 통일, 빈 결과는 [])
// 실패
{ error: { code: ErrorCode; message: string; details?: { path: string; code: string }[] } }`))
S.push(table(['#', '규칙'], [
  ['R1·R2', '목록은 { data, nextCursor }. 위시리스트(상한 20)·아이템(100)은 한 번에(nextCursor null), 관리자 목록은 커서 + 더 보기. limit 은 서버 상한'],
  ['R4·R5·R6', '빈 목록은 []. 단일 없음은 404 NOT_FOUND. 삭제는 204. 값 없는 필드는 null 명시'],
  ['R7·R8·R9', 'id 는 문자열(UUID v7). 공유 URL 값은 shareId. 날짜는 ISO 8601 UTC 문자열'],
  ['U1', '경로는 복수형 명사 + 케밥. 동사 금지. 부분 수정 PATCH, 집합 교체 PUT'],
  ['V1·V2', 'features/{x}/schema.ts Zod 스키마를 폼과 서버가 공유. Route Handler 가 파싱, 실패는 400 VALIDATION_FAILED + details'],
  ['헬퍼', 'ok(data) · list(data, nextCursor) · noContent() · createHandler(). Route Handler 에서 NextResponse.json({error}) 직접 금지'],
], [0.8, 5]))
S.push(h2('7.2 에러 코드'))
S.push(table(['code', 'HTTP', '의미', '재시도'], DATA.ERRORS.map(e => [e[0], String(e[1]), e[2], e[3]]), [1.4, 0.5, 3.5, 0.6]))
S.push(p('예상된 실패는 서비스가 AppError(code, details?) 를 throw 한다(message 는 코드 표의 고정 문구만 — 커스텀 문구 인자 없음). 그 외 예외는 응답 헬퍼가 500 INTERNAL 로 바꾸고 로그를 남긴다. 프론트는 code → i18n 키 errors.{CODE} 로 변환해 "다음에 할 수 있는 행동"을 안내하고, 재시도 여부도 code 로 판단한다.'))
S.push(h2('7.3 엔드포인트 목록'))
S.push(table(['ID', '메서드', '경로', '용도', '인증', 'FEATURES', '상태'], DATA.APIS.map(a => [a[0], a[1], a[2], a[3], a[4], a[8], a[9]]), [0.45, 1, 2, 2.6, 0.8, 0.8, 0.9], { fontSize: 15 }))

S.push(h1('8. 인증·권한 설계'))
S.push(h2('8.1 인증'))
S.push(bullet('Better Auth + Prisma 어댑터. Google 소셜 로그인만(추가 소셜은 언젠가). DB 세션(sessions 테이블), 쿠키. 운영은 https 일 때만 Secure 쿠키이므로 production 에서 NEXT_PUBLIC_APP_URL·BETTER_AUTH_URL https 강제'))
S.push(bullet('BETTER_AUTH_SECRET 32자 이상, BETTER_AUTH_URL origin == NEXT_PUBLIC_APP_URL origin 교차 검증(env 스키마)'))
S.push(bullet('generateId:false → 인증 테이블도 UUID v7. Better Auth logger 는 우리 logger 로 연결(개인정보 유출 방지)'))
S.push(bullet('admin 플러그인: users.role (user·admin). 세션 목록·다른 기기 로그아웃(F32)은 내장 API 활용'))
S.push(bullet('E2E 는 Google OAuth 를 자동화하지 않고 시드 사용자·세션을 주입한다'))
S.push(h2('8.2 라우트 보호 (F09)'))
S.push(bullet('proxy.ts: (app)·admin 구간은 세션 쿠키 없으면 /{locale}/login 으로. 쿠키 존재는 1차 필터일 뿐, 페이지·API 는 서버에서 세션을 다시 확인한다'))
S.push(bullet('admin 은 서버에서 role 확인. 클라이언트 체크만으로 숨기지 않는다'))
S.push(h2('8.3 권한 판정 (F10)'))
S.push(p('판정은 features/*/server/service 한 곳에서 한다. 타인 리소스는 존재를 숨기기 위해 403 이 아니라 404 를 돌려준다. 관리자도 타인 위시리스트를 편집하지 않는다(관리자 범위는 공지·문의·사용자 읽기·숫자).'))
S.push(table(['동작', '비로그인', '본인', '타인·관리자', 'FEATURES'], DATA.PERMS, [1.8, 1, 2, 1.4, 0.8], { fontSize: 15 }))

S.push(h1('9. 보안 설계'))
S.push(table(['위협·결함(감사)', '설계'], [
  ['SSRF (H2)', 'shared/lib/safe-fetch 만 사용. URL 파싱 → http/https 만 → DNS 해석 → 사설·루프백·링크로컬·IPv6 특수 범위 차단 → 리다이렉트마다 재검사(최대 횟수) → 응답 크기·시간 제한 → og:image 도 동일 검사. 호출 API 는 로그인 필수 + WAF 레이트 리밋'],
  ['공개 응답 개인정보 노출 (H3)', '공개용 select 명시(users 는 name·image 만). 테스트로 이메일 부재 확인. 응답은 공개 DTO 타입'],
  ['무인증 쓰기·IDOR (H4, M1)', '모든 쓰기 API 로그인 필수. 서비스가 소유 확인. 아이템 순서 변경은 itemIds 전부 해당 위시리스트 소속인지 검사'],
  ['내부 에러 노출 (H8)', 'AppError 고정 message, 예상 못한 예외는 일반 문구. details 에 error.message 금지(린트+헬퍼)'],
  ['운영 DB 파괴 스크립트 (H12)', 'Prisma CLI·시드·테스트 setup 모두 로컬 호스트 가드(fail-closed, 쿼리 파라미터 host 우회 차단). 운영 적용은 사용자 직접'],
  ['시크릿 이력 노출 (H13)', 'gitleaks pre-commit + CI. .env* 읽기 차단. 커밋 전 staged diff 확인. 문서·로그에 값 금지'],
  ['업로드 (M20)', '허용 MIME 화이트리스트 + 매직바이트 검사, SVG 금지, 크기 제한, 확장자는 검사 결과로 결정, 환경별 폴더'],
  ['레이트 리밋 (M4)', 'Vercel WAF(/api/link-previews, IP 기준) + Better Auth 내장(DB 저장). 인메모리 금지'],
  ['로그 개인정보', '허용 목록 키만, redact(접속 문자열·JWT·Bearer·Cookie·이메일·URL 쿼리·32자+ 토큰), requestId 는 서버 생성 UUID, Sentry sendDefaultPii:false·beforeSend·리플레이 미사용'],
  ['TLS', 'production DB 접속 sslmode 필수(부팅 실패), 공개 URL https 강제'],
], [1.4, 4.4]))

S.push(pageBreak())
S.push(h1('10. 디자인 시스템'))
S.push(h2('10.1 시각 방향'))
S.push(p('방향 B "깨끗한 캔버스": 흰 배경·잉크·파랑 강조, 그림자 없는 1px 선, 반경 8·10·12, 2열 그리드, 시스템 산세리프(웹폰트 없음). 채택 조건: 공유 페이지 글자 15px 이상, 받음 배지 밝은 테두리, 빈 상태·랜딩 온도감 검토, 아바타 40px·터치 44px, --c-border-strong 3:1.'))
S.push(h2('10.2 토큰 4층 구조'))
S.push(...code(`<html data-skin="canvas|paper|pop" data-mode="light|dark">`))
S.push(table(['층', '토큰', '바뀌는 조건'], [
  ['공통', '타이포 --t-* (12·14·15·17·24·30 여섯 단계), 간격 --sp-*, --touch 44px, --control-h 48px', '없음'],
  ['스킨', '반경 --r-sm/md/lg/btn, 그림자 --shadow/--shadow-sheet/--shadow-float', 'data-skin'],
  ['스킨 × 모드', '색 --c-bg/surface/surface-2/text/muted/accent/on-accent/accent-text/accent-soft/border/border-strong/card-border/focus/chip/danger/success/skeleton/overlay', 'data-skin + data-mode'],
  ['공유 페이지 프리셋', '--p-* (6종 중 3종 정의: canvas·night·paper). .share 스코프가 --c-*·--r-*·--shadow* 전부를 덮어씀', 'data-preset — 소유자 설정, 보는 사람 스킨 무관'],
], [1, 3.6, 1.4]))
S.push(bullet('원본은 design/mockups/tokens.css. v2/src/app/tokens.css 는 바이트 동일 사본(테스트 강제)'))
S.push(bullet('모드 기본 system: 저장값이 있으면 서버가 <html> 속성 렌더, 없으면 <head> 인라인 스크립트가 첫 페인트 전에 matchMedia 로 채움'))
S.push(bullet('모든 색 조합은 WCAG 4.5:1(본문)·3:1(강조 테두리) 검증표 통과'))
S.push(h2('10.3 Tailwind 4 연결'))
S.push(bullet('@theme 에서 기본 팔레트·반경·그림자·텍스트·폰트 네임스페이스를 initial 로 비움 → bg-slate-800 같은 원색 클래스는 빌드에 존재하지 않음'))
S.push(bullet('@theme inline reference 로 토큰을 bg-page·text-fg·text-muted·bg-accent·border-line·rounded-btn·shadow-card 등 이름에 매핑'))
S.push(bullet('타이포 13종은 @utility text-display … 로 font 축약형 그대로. dark: 변형은 ESLint 금지(모드는 토큰이 처리)'))
S.push(h2('10.4 공통 컴포넌트 (shared/ui)'))
S.push(table(['컴포넌트', '규칙', '상태'], [
  ['Topbar', '워드마크 + (로그인 시) 아바타·링크', '구현(최소)'],
  ['EmptyState / MultilingualLines', '비어 있음·404·에러 화면 틀, 다음 행동 버튼', '구현'],
  ['Button · Input · Textarea · Select · Segmented', '--control-h 48px, focus-visible 링, 라벨 필수, aria-invalid + describedby', '예정(F13·F14)'],
  ['Card · Skeleton · Chip · Badge', 'base.css 참고 원본, 토큰만', '예정'],
  ['Dialog · Sheet', 'Radix 기반. role=dialog·aria-modal·포커스 가두기·Esc·복귀. 직접 만든 모달 금지', '예정(F17)'],
  ['Toast', '짧은 피드백, 되돌리기(삭제 직후)', '예정(F21)'],
  ['Icon', 'lucide-react 한 벌', '예정'],
], [1.8, 3.2, 1]))

S.push(h1('11. i18n 설계'))
S.push(table(['항목', '결정'], [
  ['언어', 'ko(기본)·en·ja. URL 세그먼트 /{locale}. Prisma Locale enum 과 값 동일'],
  ['라이브러리', '없음. TS 사전 3개(ko 원본 → en·ja satisfies Dictionary) + t(key, params)'],
  ['타입 안전', '키 경로 타입 DictionaryKey, 플레이스홀더 {name} 인자는 타입으로 추출. 누락·오타는 컴파일 에러'],
  ['로딩', 'getDictionary(locale) 동적 import — 클라이언트 번들에 한 언어만. 서버는 createT, 클라이언트는 I18nProvider + useT'],
  ['루트 경로', 'proxy.ts 가 Accept-Language 협상 → /{locale} 307, Vary 헤더. 공유 페이지는 언어 경로 없이 Accept-Language 로 표시'],
  ['enum → 키', 'shared 값은 shared/i18n/keys.ts, Prisma enum 은 features/{x}/i18n-keys.ts 한 곳. 문자열 결합으로 키 생성 금지'],
  ['복수형', '지금 미지원. 첫 영어 개수 문구 때 Intl.PluralRules + _one/_other 확장'],
  ['테스트', '세 사전 키 집합·플레이스홀더 집합 동일, errors 키 ↔ 에러 코드 1:1, 빈 문자열 없음'],
], [1, 4]))

S.push(h1('12. 에러 처리·로그·모니터링'))
S.push(h2('12.1 에러 경계'))
S.push(bullet('app/[locale]/not-found.tsx·error.tsx — root layout 안(토큰·i18n 적용, retry 버튼). (app)·admin·w/[id] 구간 경계는 같은 컴포넌트 재사용'))
S.push(bullet('app/global-not-found.tsx(experimental.globalNotFound) — 어느 라우트에도 매치되지 않는 URL 전부. 세 언어 고정 문구'))
S.push(bullet('app/global-error.tsx — root layout 이 깨졌을 때. 자체 <html data-skin data-mode>, 세 언어 고정'))
S.push(bullet('데이터 로드 실패는 경계가 아니라 화면 4상태의 에러 상태로'))
S.push(h2('12.2 로그'))
S.push(bullet('예상 못한 실패에서만 기록. 지점: 응답 헬퍼, Server Component 로드, 에러 경계, 외부 fetch 실패'))
S.push(bullet('서버 구조화 로그 JSON 한 줄: level·event·requestId·route·method·status·code·errorName·message·durationMs·stack(개발만)·details·meta — 허용 목록 외 키 없음, 전 문자열 redact'))
S.push(bullet('로거는 절대 throw 하지 않는다. AppError 는 기록하지 않는다'))
S.push(h2('12.3 Sentry'))
S.push(bullet('@sentry/nextjs 11.x, Developer 무료(에러 5천/월, 30일 보관). sendDefaultPii:false, IP 끔, 리플레이 미사용, 트레이스 샘플링 낮게'))
S.push(bullet('beforeSend 에서 exception.values[].value·breadcrumbs·request 에 redact 적용, console 통합 끔(이중 전송 방지)'))
S.push(bullet('클라이언트 경계([locale]/error·global-error)의 전송 지점은 Sentry 연결 때 추가'))

S.push(h1('13. 테스트·CI·배포'))
S.push(h2('13.1 테스트 전략'))
S.push(table(['ID', '항목', '결정'], DATA.TESTS, [0.7, 1.2, 4.6]))
S.push(h2('13.2 CI'))
S.push(bullet('v2-ci.yml quality 잡: pnpm install → lint → format:check → typecheck → test:coverage(service container Postgres 5434, LINKLET_REQUIRE_TEST_DB=1) → build(더미 env, DB 미접속). main 보호 필수 체크'))
S.push(bullet('secret-scan.yml: 모든 PR·main push 에 gitleaks. 주 1회 전체 이력 스캔은 예정'))
S.push(bullet('E2E 단계(Playwright chromium, 시드 DB)는 Phase 1 남은 항목. DB 가 필요한 E2E 의 연결 방식은 F13 전 결정'))
S.push(h2('13.3 배포'))
S.push(bullet('첫 배포는 Phase 5(공유)에 맞춘다 — 메신저 미리보기를 실제 URL 로 확인. Vercel 프리뷰 프로젝트(v2/ 루트) + Neon v2 DB + WAF 규칙 1개. 사용자 작업: Neon·Vercel·R2·Sentry·OAuth URI'))
S.push(bullet('운영 마이그레이션은 사용자가 LINKLET_ALLOW_REMOTE_DB=1 을 셸에 붙여 직접 실행. 롤백은 down.sql + _prisma_migrations 행 삭제'))
S.push(bullet('교체(Phase 8): 완료 기준 1·3·4·9 확인 후 v2/ 를 루트로 올리고 기존 코드 일괄 제거. pre-renewal 태그(eac797e)로 전후 비교'))

S.push(h1('14. 로드맵'))
S.push(table(['Phase', '이름', '내용', 'FEATURES', '상태'], DATA.PHASES.map(r => [String(r[0]), r[1], r[2], r[3], r[4]]), [0.5, 1, 3, 1.4, 1.6]))
S.push(note('기간은 산정하지 않는다. 다음 Phase 만 역할별 todo 에 커밋 단위로 쪼개고, 그 뒤 Phase 는 FEATURES 행 단위로 둔다.'))

L.save(L.buildDoc({ title: '기본설계서', subtitle: 'Basic Design — 시스템 구성·기술 스택·코드 구조·화면·데이터·API·보안·디자인 시스템', sections: S }), process.argv[2])
