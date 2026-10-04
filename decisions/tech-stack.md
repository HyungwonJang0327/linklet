# 기술 스택 (v2)

조사 근거: 2026-09-27 npm 레지스트리 + 공식 문서 (각 항목 출처 URL). 예산 제약: 무료 티어 안에서만 (`INTENT.md`).

## 결정

| 영역 | 선택 | 버전 기준 |
|---|---|---|
| 런타임 | Node.js | 24.x LTS (Vercel 기본) |
| 프레임워크 | Next.js App Router | 16.3.x |
| UI | React | 19.x |
| 인증 | Better Auth + `@better-auth/prisma-adapter` | 1.7.x |
| ORM | Prisma + `@prisma/adapter-neon` | **7.10.0 고정** |
| DB | PostgreSQL (Neon Free) | — |
| 입력 검증 | Zod | 4.x |
| 서버 상태 | TanStack Query | 5.x |
| 스타일 | Tailwind CSS | 4.x |
| 이미지 저장소 | Cloudflare R2 (S3 호환, AWS SDK 사용) | — |
| 요청 빈도 제한 | Vercel WAF 규칙 1개(링크 미리보기 API — `url-design.md` 에서 `/api/link-previews`) + Better Auth 내장 제한(DB 저장) | — |
| 단위 테스트 | Vitest | 최신 메이저 |
| E2E | Playwright | 1.63.x |
| 에러 모니터링 | Sentry Developer 무료 플랜 (`decisions/error-handling.md` E5) | @sentry/nextjs 11.x |
| 린트·포맷 | ESLint(flat config) + Prettier | — |
| 패키지 매니저 | pnpm | **10.x** |
| 배포 | Vercel Hobby (비상업·개인 용도) | — |

## 이유와 기각된 대안

### Node 24.x
- 이유: 현재 Active LTS, Vercel 기본값. Next 16(20.9+)·Prisma 7(20.19+) 최소 요구 충족
- 기각: Node 26 — 2026-10-28 Active LTS 전환 예정, Vercel 지원 확인 후 올린다
- 출처: https://endoflife.date/nodejs, https://vercel.com/docs/functions/runtimes/node-js/node-js-versions

### Next.js 16.3.x
- 이유: 스택 부분 교체 결정(인터뷰 6번). 15.x는 백포트 라인
- 적용 원칙: `middleware.ts` 대신 `proxy.ts`(Node 런타임), 요청 API(`cookies`·`headers`·`params`·`searchParams`) 전부 await, Turbopack 기본, **`cacheComponents`(PPR)는 끈 채로 시작** — TanStack Query `prefetchQuery` + `'use cache'` 충돌 이슈
- 출처: https://nextjs.org/docs/app/guides/upgrading/version-16, https://github.com/TanStack/query/issues/9499

### Better Auth
- 이유: Google 로그인, DB 세션, 세션 목록·다른 기기 로그아웃(F32), 관리자 role(F33·admin 플러그인)을 기본 제공. 무료·자체 호스팅, 기존 Prisma·Neon 사용. Auth.js 팀이 2025-09 Better Auth에 합류하며 신규 프로젝트에 권장
- 기각: NextAuth v4 유지 — 보안 패치만, audit critical / Auth.js v5 — 2026-07에도 beta, 유지보수 모드 / Lucia — npm deprecated
- 출처: https://better-auth.com/blog/authjs-joins-better-auth, https://www.better-auth.com/docs/concepts/session-management, https://www.better-auth.com/docs/plugins/admin

### Prisma 7.10.0 (고정)
- 이유: 스키마 문법 유지로 이식 비용 최소. 7부터 Rust-free `prisma-client` 생성기, driver adapter 필수, `prisma.config.ts` 필수, 생성 경로(`output`) 필수, ESM 전용, `.env` 자동 로드 없음
- 주의: `prisma` 패키지 `latest` 태그가 8.0 RC를 가리킨다 → 설치 시 버전 명시. 런타임은 pooled `DATABASE_URL`, CLI는 `DATABASE_URL_UNPOOLED`
- 기각: Prisma 8 — RC, Better Auth peer 범위(5~7) 밖. 정식판 이후 별도 결정 / Drizzle — 데이터 계층 전면 재작성 필요
- 출처: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7, https://neon.com/docs/guides/prisma

### Zod 4
- 이유: 가장 넓은 생태계, Better Auth도 사용. 클라이언트·서버 공유 스키마에 적합(입력 검증 위치는 별도 결정)
- 기각: Valibot — 번들이 작지만 이 앱은 번들 크기가 병목이 아님
- 출처: https://zod.dev/v4

### Cloudflare R2
- 이유: 기한 없는 무료(월 10GB 저장, Class A 100만·Class B 1000만 요청, 송신 무료). S3 호환으로 기존 업로드 코드 재사용. **현재 AWS 계정은 무료 티어 기간(12개월)이 지나 S3가 유료** → 예산 원칙 위반 해소
- 기각: S3 유지 — 유료 / Vercel Blob — 1GB, 초과 시 30일 차단
- 후속: 기존 S3 버킷은 교체 후 비우고 삭제 (사용자 작업, AWS 콘솔)
- 출처: https://developers.cloudflare.com/r2/pricing/, https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/billing-free-tier.html

### Vercel WAF + Better Auth 내장 제한
- 이유: 추가 서비스 없이 무료. WAF Hobby는 규칙 1개(10초~10분 고정 창, IP 기준) → 외부 fetch를 유발하는 `/api/metadata` 에 사용. 인증 경로는 Better Auth 제한(DB 저장)
- 기각: Upstash Redis — 무료(월 50만 명령)지만 서비스 하나 추가. 트래픽 증가 시 도입 / Postgres 자체 구현 — 요청마다 DB 왕복·Neon 컴퓨트 소모 / 인메모리 — 서버리스에서 무효(AUDIT M4)
- 출처: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting, https://www.better-auth.com/docs/concepts/rate-limit

### pnpm 10
- 이유: 킥오프 기준 pnpm. Vercel 기본 지원이 pnpm 6~10
- 기각: pnpm 11·12 — Vercel 미지원(Corepack 실험 설정 필요, Node 25+는 Corepack 미포함) / npm 유지 — 킥오프 기준과 다름
- 출처: https://vercel.com/docs/package-managers, https://github.com/vercel/vercel/issues/17434

### 테스트·린트
- Vitest(기존 유지, 최신 메이저), Playwright 1.63(E2E 신규), ESLint flat + Prettier(킥오프 고정, `next lint` 는 16에서 제거)

## 무료 한도 요약 (초과 시 영향)

| 서비스 | 무료 한도 | 초과 시 |
|---|---|---|
| Vercel Hobby | 함수 최대 300s, 호출 100만/월, 전송 100GB, 이미지 변환 5천 | 30일 정지. 상업 이용 금지 |
| Neon Free | 프로젝트당 0.5GB, 100 CU-시간/월, 브랜치 10 | 쓰기 차단 / 컴퓨트 정지 |
| Cloudflare R2 | 10GB-월, Class A 100만, Class B 1000만, 송신 무료 | 과금 |
| Vercel WAF (Hobby) | 레이트 리밋 규칙 1개, 허용 요청 100만 | — |
| Sentry Developer | 사용자 1, 에러 5천/월, 스팬 500만/월, 리플레이 50/월, 보관 30일 | 초과분 미수집 |

남용 방지 고정 상한(F39)은 Neon 0.5GB를 보호하는 역할도 한다.

## 확장 지점

- 인증 방식 추가(추가 소셜 로그인 — 언젠가): Better Auth 설정의 `socialProviders` 한 곳
- 저장소 교체: 업로드 서비스 모듈의 S3 호환 클라이언트 설정(엔드포인트·버킷) 한 곳
- 빈도 제한 확장: 제한 호출부를 인터페이스 뒤에 두어, 저장소를 Upstash로 바꿀 때 구현체만 교체

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 전부 추천대로)
- 2026-09-27 에러 모니터링 Sentry 추가 (에러 처리 결정 E5에서 파생)
- 2026-09-28 환경 세팅 결정 (사용자: 추천대로)
  - 아이콘: **lucide-react** 하나만 (heroicons 제거). 기각: heroicons — 아이콘 수가 적고 두 벌 혼용이 리뉴얼 전 부채(L2)
  - create-next-app이 만든 `v2/AGENTS.md`(Next 16 문서 안내) 유지. 충돌 시 CLAUDE.md 우선
  - React Compiler 끔 — 결정된 적 없음. 필요 시 `/decide`
  - React는 create-next-app이 고정한 19.2.8로 시작 (19.x 범위)
  - pnpm은 `packageManager: pnpm@10.34.5` 로 고정 (pnpm이 자동 전환)
  - 시크릿 스캔: gitleaks — pre-commit(`.githooks/pre-commit`, `core.hooksPath`) + CI(gitleaks-action v3). 의존성 추가 없음
