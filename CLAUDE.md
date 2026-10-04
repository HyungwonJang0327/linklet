# CLAUDE.md

> 결정 맥락은 `decisions/`, 확정 목록은 `planning.md`.
> **리뉴얼 진행 중**: 기준표는 `audit/FEATURES.md`, 전략은 `decisions/renewal-strategy.md`.

> `v2/AGENTS.md`(create-next-app 생성, Next 16 문서 안내)와 이 파일이 충돌하면 **이 파일이 우선**한다.

## 1. 개요

Linklet — 요즘 갖고 싶은 것들, 링크만 붙여 넣으면 예쁘게 모아지는 내 위시리스트 페이지. 친구에게 링크 하나로 공유.
지금은 리뉴얼 중이다. 루트의 기존 앱은 운영 중인 채로 동결하고, 새 앱을 `v2/` 에 병행 재구축한 뒤 교체한다.
왜 만드는지·완료 기준·비목표는 [INTENT.md](INTENT.md).

## 2. 아키텍처

### 리포 구성 (리뉴얼 기간)

```
linklet/
├─ v2/                  # 새 앱 (여기서만 개발) — 8단계 환경 세팅에서 생성
├─ app/ components/ hooks/ lib/ prisma/ middleware.ts ...   # 기존 앱 (동결, 운영 배포 중)
├─ audit/               # 감사 산출물 — AUDIT·BASELINE·FEATURES(판정표)·legacy-docs
├─ decisions/           # 주제별 결정 (왜)
├─ worklog/             # 날짜별 작업 일지 (오늘 무엇을)
├─ todo/                # Phase별 작업 (누가 다음에 무엇을)
├─ docs/                # 사용자 문서 자리
├─ INTENT.md planning.md COMMIT_CONVENTION.md README.md CLAUDE.md
```

### v2 구조 (`decisions/architecture.md`)

```
[Server Component] ─────────────────┐   읽기 (초기 렌더·공유 페이지 SSR)
[Client + TanStack Query 훅] ─fetch─> [app/api/* Route Handler]  얇게: Zod 파싱 → 서비스 → 응답 헬퍼
                                     ▼
                        [features/*/server/service]     도메인 로직 + 권한 판정 (한 곳)
                                     ▼
                        [features/*/server/repository]  → [server/db: Prisma 인스턴스 1개]
외부: server/auth (Better Auth) · server/storage (R2) · shared/lib/safe-fetch (SSRF 방어)
```

```
v2/
├─ src/
│  ├─ app/                      # 라우트 파일만 (얇게)
│  │  ├─ [locale]/(public)/     # 랜딩·로그인·공지
│  │  ├─ [locale]/(app)/        # 로그인 필요: 위시리스트·설정·문의
│  │  ├─ [locale]/admin/        # 관리자 (최소)
│  │  ├─ w/[id]/                # 공유 페이지 (서버 렌더 + OG 메타)
│  │  ├─ api/                   # Route Handlers
│  │  └─ not-found.tsx · error.tsx · global-error.tsx
│  ├─ features/{도메인}/        # components/ hooks/ server/{service,repository}.ts schema.ts index.ts
│  ├─ shared/ui/                # 디자인 토큰 기반 공통 컴포넌트
│  ├─ shared/lib/               # api-error·응답 헬퍼, fetch 클라이언트, safe-fetch, rate-limit
│  ├─ shared/i18n/              # 사전 3개(ko·en·ja) + 타입 안전 t()
│  ├─ shared/config/env.ts      # Zod 환경변수 스키마 (부팅 검증)
│  ├─ server/                   # 서버 전용: db.ts · auth.ts · storage.ts · logger.ts
│  └─ proxy.ts                  # Next 16 (middleware 아님)
├─ prisma/  schema.prisma · migrations/(migration.sql + down.sql) · seed.ts
└─ e2e/                         # Playwright
```

의존 방향: `app → features → shared`, `features/*/server → server`. 역방향 금지. 기능끼리는 `features/{x}/index.ts` 로만. 클라이언트 코드에서 `server/`·`features/*/server/` import 금지 — ESLint로 강제.

## 3. 기술 스택

> 버전 기준은 `decisions/tech-stack.md`. "설치" 열은 `v2/` 에 실제 설치된 버전 (2026-09-28). 아직 설치 안 된 것은 해당 기능 이식 때 설치한다.

| 영역 | 선택 | 버전 기준 | 설치 |
|---|---|---|---|
| 런타임 | Node.js (`v2/.nvmrc`, `engines`) | 24.x LTS | 24 |
| 프레임워크 | Next.js App Router (`cacheComponents` 끔) | 16.3.x | 16.3.6 |
| UI | React | 19.x | 19.2.8 |
| 언어 | TypeScript (strict + `noUncheckedIndexedAccess`) | 5.x | 5.9.3 |
| 인증 | Better Auth + Prisma 어댑터 (Google, DB 세션, admin 플러그인) | 1.7.x | — (F08) |
| ORM·DB | Prisma + Neon 어댑터 / PostgreSQL (Neon Free, 로컬 Docker) | **7.10.0 고정** | — (F02) |
| 입력 검증 | Zod | 4.x | — (F07) |
| 서버 상태 | TanStack Query | 5.x | — (F13) |
| 스타일 | Tailwind CSS (`@theme` 토큰) | 4.x | 4.3.3 |
| 아이콘 | lucide-react | 1.x | — (첫 UI) |
| 이미지 저장소 | Cloudflare R2 (S3 호환 SDK) | — | — (F20) |
| 요청 빈도 제한 | Vercel WAF(`/api/link-previews`) + Better Auth 내장 | — | — |
| 에러 모니터링 | Sentry Developer 무료 플랜 | @sentry/nextjs 11.x | — (F06) |
| 단위·통합 테스트 | Vitest + @vitest/coverage-v8 (통합은 Docker Postgres) | 최신 메이저 | 5.0.2 |
| E2E | Playwright | 1.63.x | 1.63.0 |
| 린트·포맷 | ESLint(flat, eslint-config-next) + Prettier + eslint-config-prettier | — | 9.39.5 / 3.9.9 / 10.1.8 |
| 패키지 매니저 | pnpm (`packageManager`) | 10.x | 10.34.5 |
| 시크릿 스캔 | gitleaks — pre-commit(`.githooks`) + CI(gitleaks-action v3) | — | 8.30.1 (로컬) |
| 배포 | Vercel Hobby (비상업·개인) | — | — (첫 배포) |

기존 앱(루트)은 npm + Next 15 + NextAuth v4 + Prisma 6 그대로다(`audit/AUDIT.md` §2).

## 4. 코딩 컨벤션

### 네이밍·파일
- 파일·폴더: `kebab-case` (`wishlist-card.tsx`, `use-wishlists.ts`). Next 예약 파일(`page.tsx`, `route.ts` 등)은 그대로
- 컴포넌트: `PascalCase`. 훅: `useXxx`. 상수: `UPPER_SNAKE_CASE`. 타입: `PascalCase`, 접미사 `Input`(요청)·`Dto`(응답) 구분
- export: **named export만**. default export는 Next가 요구하는 파일(page·layout·route 등)에서만
- 한 파일 250줄을 넘기면 분리를 검토한다 (리뉴얼 전 710줄 페이지 재발 방지)

### 스타일
- 색·간격·반경·그림자는 `@theme` 토큰으로만. 컴포넌트에 `bg-slate-800` 같은 원색 클래스를 직접 쓰지 않는다
- 라이트·다크·시스템 테마는 토큰 값 교체로 처리 (F29)
- 공통 요소는 `shared/ui` 컴포넌트를 쓴다. 같은 역할의 컴포넌트를 두 벌 만들지 않는다 (리뉴얼 전 Dialog·Toast·WishlistCard 이중화)
- 아이콘 라이브러리는 하나만 (8단계에서 결정해 `decisions/dependencies.md` 에 기록)

### 타입
- TypeScript strict. **`any` 금지** (ESLint 에러). 외부 데이터는 `unknown` 으로 받아 Zod로 좁힌다
- 요청·폼 타입은 Zod 스키마에서 `z.infer` 로 만든다. DB 타입을 손으로 복제하지 않는다 (리뉴얼 전 `types/index.ts` 드리프트)
- 서버 전용 모듈은 `import 'server-only'`

### 상태 관리
- 서버 상태: TanStack Query. 쿼리 키는 기능별 `queryKeys` 팩토리 하나 (`features/{x}/hooks/query-keys.ts`). 같은 도메인 키 팩토리를 두 벌 만들지 않는다
- 필터·정렬·탭: URL 쿼리 (`decisions/url-design.md` U4)
- 모달 열림·입력 중 값: 로컬 상태
- 전역 클라이언트 스토어 없음
- 컴포넌트에서 raw `fetch` 금지 → 기능 훅 경유

### 언어 규칙
- 코드·식별자: 영어 / 주석·문서·커밋 메시지: 한국어
- 도메인 용어의 영어 표기 (이 표를 벗어난 이름을 새로 만들지 않는다)

| 한국어 | 영어 (식별자) | 비고 |
|---|---|---|
| 위시리스트 | `wishlist` | |
| 아이템 | `item` | 위시리스트 안의 상품 한 개 (모델명 `WishlistItem`) |
| 상품 링크 | `productUrl` | |
| 링크 미리보기 | `linkPreview` | URL 메타데이터(제목·이미지·가격·사이트명) |
| 받음 표시 | `isReceived` | 리뉴얼 전 `isCompleted` |
| 공유 ID / 공유 링크 | `shareId` / share link | PK와 별도 (`decisions/api-response.md` R8) |
| 공유 페이지 | share page | `/w/{shareId}` |
| 공개 여부 | `isPublic` | 기본 공개 = 링크 아는 사람만 |
| 꾸미기 | `customization` | |
| 테마 프리셋 | `themePreset` | |
| 강조색 | `accentColor` | |
| 카테고리 | `category` | 3~4종 |
| 남용 방지 상한 | `usageLimit` | F39 |
| 문의 | `inquiry` | 리뉴얼 전 QnA 폐기 |
| 공지 | `notice` | |
| 관리자 | `admin` | Better Auth `role: 'admin'` |
| 세션 | `session` | |

## 4-1. 에러 처리 (`decisions/error-handling.md`)

- API 에러 응답은 하나: `{ error: { code, message, details? } }` + HTTP 상태
  - `code`: `VALIDATION_FAILED` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `LIMIT_REACHED` 422 · `RATE_LIMITED` 429 · `UPSTREAM_FAILED` 502 · `INTERNAL` 500
  - `message`: 개발자용 영어, 화면에 표시하지 않는다. `details`: 검증 실패 필드 `{ path, code }[]`
- 예상된 실패: 서비스가 `AppError(code, status)` throw. 그 외 모든 예외는 예상 못한 실패 → `500 INTERNAL` + 일반 메시지 + 로그
- 응답은 공용 헬퍼로만 만든다. Route Handler에서 에러 JSON을 직접 만들지 않는다
- 재시도 여부는 `code` 로 판단 (`RATE_LIMITED`·`UPSTREAM_FAILED`·`INTERNAL` 만)
- 사용자 문구: 프론트가 `code` → `errors.{CODE}` i18n 키로 변환. **다음에 할 수 있는 행동**을 알려준다. 내부 코드·스택·영어 원문 노출 금지
- 에러 경계: `app/global-error.tsx`, 구간별 `error.tsx`·`not-found.tsx` — `(app)`, `admin`, `w/[id]`. 앱 테마·i18n 적용
- 로그: 예상 못한 실패에서만. 서버 구조화 로그(JSON) + Sentry. 지점: 응답 헬퍼, Server Component 데이터 로드, 에러 경계, 외부 fetch 실패

## 4-2. 데이터 규약

**고정 규약 (묻지 않고 적용)**
- **시간**: DB는 항상 UTC. 직렬화는 ISO 8601. 지역 시간대 변환·표시는 프론트에서만. 서버가 지역 시간으로 저장·포맷·상대시간("N분 전")을 만들어 내려주지 않는다
- **값의 언어**: 상태·구분·코드 값은 영어로 저장(`'pending'`, `'answered'`). 화면 문구는 프론트에서 그 나라 언어로 변환. 사람이 읽을 한국어 문자열을 DB에 넣지 않는다
- **로그**: 키·토큰·비밀번호·세션 ID·이메일·이름·요청 본문 등 개인정보를 어떤 레벨의 로그·Sentry 이벤트에도 남기지 않는다. 예시 로그에도 넣지 않는다. 사용자 식별은 내부 ID만

**응답 형태** (`decisions/api-response.md`)
- 성공은 `{ data: T }` 또는 `{ data: T[], nextCursor: string | null }`. 실패는 `{ error }`. 그 밖의 형태 없음
- 페이지네이션은 커서 하나. 목록은 항상 빈 배열(`null` 금지). 단일 리소스 없음은 `404 NOT_FOUND`. 삭제는 `204`
- 값 없는 필드는 생략하지 않고 `null`. id는 문자열
- 공개 응답(공유 페이지 등)은 **공개용 select를 명시**한다. 이메일 등 개인정보를 포함하지 않는다

**입력 검증**
- `features/{x}/schema.ts` 의 Zod 스키마 하나를 클라이언트 폼과 서버가 같이 쓴다. URL·이메일 같은 공통 규칙은 `shared/lib/` 에 한 번만
- Route Handler가 body·query·params를 Zod로 파싱한 뒤 서비스 호출. 실패 시 `400 VALIDATION_FAILED`
- 환경변수는 `shared/config/env.ts` 로 부팅 시 검증. 클라이언트 노출 변수만 `NEXT_PUBLIC_` 접두사

## 4-3. 접근성 기준선 (reviewer는 이 기준으로 본다)

- 키보드만으로 모든 동작이 가능하다. 클릭 가능한 요소는 `<button>`·`<a>` (클릭 가능한 `<div>` 금지)
- 포커스가 항상 보인다 (`focus-visible` 스타일, `outline-none` 단독 금지)
- 본문 텍스트 대비 4.5:1 이상 (공유 페이지 테마 포함)
- 모든 폼 요소에 연결된 라벨 (`<label htmlFor>` 또는 `aria-label`). 오류는 `aria-invalid` + `aria-describedby`
- 모달: `role="dialog"`·`aria-modal`, 포커스 가두기, Esc 닫기, 닫은 뒤 포커스 복귀 — `shared/ui` Dialog(Radix 기반)만 사용
- 이미지 `alt`, 아이콘 버튼 `aria-label`, `<html lang>`

## 4-4. 화면 4상태

목록·상세 화면은 **로딩·비어 있음·에러·정상** 4상태를 같은 작업에서 함께 만든다.
- 에러 상태: `errors.{CODE}` 문구 + 다시 시도 버튼
- 비어 있음: 다음 행동 안내 (예: "첫 링크를 붙여 넣어 보세요")
- 화면을 떠나거나 조건이 바뀌면 진행 중인 요청을 취소한다 (TanStack Query `signal`)
- 제출 버튼은 진행 중 중복 실행을 막는다
- 본보기: 위시리스트 목록 (FEATURES F13)

## 5. "중요" 함정 목록

리뉴얼 전 감사(`audit/AUDIT.md`)에서 실제로 겪은 문제다. **재도입 금지.**

| # | 금지 패턴 | 대신 | 근거 |
|---|---|---|---|
| 1 | 공유 ID·slug 저장값에 경로 접두사(`w/`) 섞기 | 값은 ID만, 경로는 라우트에서 조합 | AUDIT H1 (공유 링크 `/w/w/` 깨짐) |
| 2 | 외부 URL을 서버에서 `fetch` 로 직접 요청 | `shared/lib/safe-fetch` (DNS→IP 검사, 리다이렉트 재검사, 크기·시간 제한) | H2 SSRF |
| 3 | 공개 응답에서 `include: { user: true }` 등 관계 전체 select | 공개용 select 명시, 테스트로 이메일 부재 확인 | H3 이메일 노출 |
| 4 | 인증 없는 쓰기 API, route마다 따로 하는 권한 체크 | 서비스 계층에서 권한 판정 | H4, M1 IDOR |
| 5 | `prisma db push` | `prisma migrate dev` + `down.sql` (예외: 기존 앱 기준선 E2E 전용 로컬 컨테이너, `decisions/testing.md` T8) | H5 드리프트 |
| 6 | `new PrismaClient()` 를 두 곳 이상 | `server/db.ts` 하나 | H6 |
| 7 | Route Handler에서 에러 JSON 직접 작성, `details: error.message` | 응답 헬퍼 + `AppError` | H8, 내부 메시지 노출 |
| 8 | 클릭 가능한 `<div>`, 직접 만든 모달 | `<button>`, `shared/ui` Dialog | H9 |
| 9 | 운영 DB에 붙을 수 있는 스크립트를 가드 없이 작성 | 환경 가드(운영이면 즉시 종료) | H12 |
| 10 | `t('key') \|\| '한국어'` fallback | 키 누락은 사전 키 테스트로 잡는다 (`t()` 는 누락 시 키 문자열을 반환해 fallback이 절대 실행되지 않음) | 스크린샷 `wishlist.categories.GENERAL` 노출 |
| 11 | DB enum 값(대문자)을 그대로 번역 키 일부로 사용 | enum → 키 매핑을 한 곳에 정의 | 같은 버그 |
| 12 | 서버에서 한국어 상대시간·날짜 포맷 생성, 로그에 이메일 | ISO 문자열 반환, 내부 ID만 로그 | 고정 규약 위반 |
| 13 | `pnpm add prisma` (태그 `latest` = 8.0 RC) | `prisma@7.10.0` 명시 | tech-stack |
| 14 | `middleware.ts` 작성, 요청 API 동기 사용 | `proxy.ts`, `await cookies()`·`await params` | Next 16 |
| 15 | `cacheComponents: true` 켜기 | 결정 없이 켜지 않는다 (TanStack Query 충돌 이슈) | tech-stack |
| 16 | 컴포넌트에서 raw `fetch` + `refetch()` | 기능 훅 + 쿼리 무효화 | M6 |

## 6. 금지

- 결정(`decisions/dependencies.md` 기록) 없는 라이브러리 추가
- `any`
- 테스트 없는 기능 (`decisions/testing.md` T3의 정의)
- 회사 코드 복사
- WIP·무의미 커밋 (`fix`, `update`, `wip` 같은 메시지)
- `audit/FEATURES.md` 에 근거 없는 기존 동작 변경 — 없으면 멈추고 묻는다
- 대체 증명(동등성 확인) 없는 기존 코드 삭제
- **시크릿(API 키·토큰·비밀번호·접속 문자열)을 git에 올리기** — 리포는 PUBLIC. 커밋 전 staged diff 확인, CI·pre-commit 시크릿 스캔
- `.env*` 파일 내용 읽기·출력 (키 이름만: `grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env*`)
- 운영 DB·운영 API·결제·메일 발송에 연결될 수 있는 명령 실행 (필요하면 사용자가 직접 실행)
- 기존 앱(루트) 수정 — 예외: `v2/` 를 검사 대상에서 제외하는 루트 `tsconfig`·ESLint 최소 수정, 교체 시점의 일괄 제거
- 사용자 요청 없는 `git push`, 태그 삭제, 강제 push

## 7. 작업 흐름

1. `todo/` 에서 다음 작업 확인 (한 번에 하나)
2. main에서 짧은 기능 브랜치 생성
3. 구현 — 이식 작업은 `audit/FEATURES.md` 한 행 단위
4. 테스트 (T1 기준) → lint·typecheck 통과
5. 기능 최소 단위마다 즉시 커밋 (staged diff 시크릿 확인)
6. `/log` 로 worklog·decisions·planning·todo 갱신 (7단계 전에는 worklog에 직접 기록)
7. 결과 보고 → "다음 진행할까?" 묻고 멈춘다
8. PR·push는 사용자가 요청할 때

작업 중 계획에 없던 문제(버그·부채)를 발견하면 고치지 말고 `todo/` 에 추가하고 보고한다.
문서와 코드가 어긋나면 문서를 먼저 고친다. 상태는 `planning.md`·`todo/`·`worklog/`·`audit/FEATURES.md` 에만 적는다.

### 에이전트·커맨드 (`.claude/`)

| 에이전트 | 언제 | 수정 권한 |
|---|---|---|
| `reviewer` | diff 리뷰 (`/review`) | 없음 |
| `security-reviewer` | 인증·권한·safe-fetch·업로드·공개 응답·시크릿 변경 | 없음 |
| `migrator` | FEATURES.md 한 행 이식 + 동등성 확인 | v2만 (기존 코드 삭제 금지) |
| `tester` | 기준선 E2E, 커버리지, 실패 분석 | 테스트만 |
| `designer` | 흐름·정보 구조·토큰·접근성 판단 | 없음 |

커맨드: `/log` `/review` `/parity` `/baseline` `/audit` `/decide` `/status` `/brief` `/retro` `/retro-public` `/agent` `/demo`.
`.claude/settings.json`: `git push`·`rm -r`·태그 삭제·배포·publish·마이그레이션 적용/초기화/`db push` 는 항상 확인, `.env*` 읽기 차단(`.env.example` 제외).

## 8. 커밋 단위 규칙

- 한 커밋 = 한 가지 변경 (기능 하나·버그 하나·리팩토링 하나). 여러 작업을 모아 한 번에 커밋 금지
- 큰 기능은 "타입·스키마 → 서비스 로직 → API → UI → 테스트" 처럼 독립적으로 되돌릴 수 있는 단위로 쪼갠다
- 어떤 커밋을 revert해도 나머지가 깨지지 않아야 한다
- 이식은 [이식] → [동등성 확인] → (교체 시점) [기존 코드 제거] 를 서로 다른 커밋으로
- 메시지 형식은 [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md)

## 9. 진행 단위 규칙

작업은 항상 작은 기능 단위 하나씩. 끝나면 [테스트 → 커밋 → `/log` → 결과 보고] 후 "다음 진행할까?" 묻고 멈춘다. 승인 없이 다음 작업으로 넘어가지 않는다. 결정은 사용자가 한다 — 선택지와 근거를 제시한다. 라이브러리 API는 추측하지 말고 문서를 확인한다.

## 10. 자주 쓰는 명령어

### 처음 한 번 (클론마다)

```bash
git config core.hooksPath .githooks   # 커밋 전 gitleaks 시크릿 스캔 활성화
brew install gitleaks                 # 없으면 설치 (훅이 없으면 커밋을 막는다)
cd v2 && pnpm install --frozen-lockfile
pnpm exec playwright install chromium # E2E를 로컬에서 돌릴 때
```

### v2

```bash
cd v2
pnpm dev                   # 개발 서버
pnpm lint                  # ESLint (any·접근성·import 경계 포함)
pnpm format / format:check # Prettier
pnpm typecheck             # next typegen && tsc --noEmit
pnpm test                  # Vitest (src/**/*.test.ts)
pnpm test:coverage         # 커버리지 — T4 대상 80% 미만이면 실패
pnpm test:e2e              # Playwright (e2e/, 포트 3002에 빌드·실행)
pnpm build
# DB 작업은 Phase 1에서 스크립트 확정: prisma migrate dev 는 로컬 DB만, 운영 적용은 사용자가 직접
```

CI(`.github/workflows/v2-ci.yml`)는 PR마다 lint → format:check → typecheck → test:coverage → build 를 돈다. 시크릿 스캔(`secret-scan.yml`)은 모든 PR·main push.

### 기존 앱 (루트, 동결 — 비교·측정용)

```bash
npm ci                   # lock 변경 금지
npx tsc --noEmit --incremental false
npx eslint .
npx vitest run
```

런타임 비교(동등성 확인)는 `audit/BASELINE.md` §6의 래퍼로 dev DB(`.env.development`)를 로드해 `next start -p 3001` 로 띄운다. 운영 env로 실행하지 않는다.
