# 아키텍처와 폴더 구조 (v2)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| A1 | 폴더 구조 | 기능(도메인)별 `src/features/*` + 도메인 무관 `src/shared/*` + 서버 인프라 `src/server/*`. `src/app/` 에는 라우트만 |
| A2 | 데이터 접근 | REST Route Handler + TanStack Query. 서버 렌더가 필요한 읽기(공유 페이지, 초기 목록)는 Server Component에서 서비스를 직접 호출. Server Actions는 쓰지 않는다 |
| A3 | 권한 판정 | 서비스 계층 한 곳. Route Handler·Server Component는 "요청자(세션)"만 넘기고 판정하지 않는다 |
| A4 | import 경계 | ESLint `no-restricted-imports` 로 강제 — 다른 기능은 `features/{x}/index.ts` 로만, `server/`·`features/*/server/` 는 클라이언트 코드에서 import 금지 |
| A5 | `src/` | 사용 |

## 구조

```
[Server Component] ─────────────────┐   읽기 (초기 렌더·공유 페이지 SSR)
[Client + TanStack Query 훅] ─fetch─> [app/api/* Route Handler]  얇게: 입력 파싱(Zod) → 서비스 → 응답 헬퍼
                                     ▼
                        [features/*/server/service]     도메인 로직 + 권한 판정
                                     ▼
                        [features/*/server/repository]  → [server/db: Prisma 인스턴스 1개]
외부: server/auth (Better Auth) · server/storage (R2) · shared/lib/safe-fetch (SSRF 방어)
```

```
v2/
├─ src/
│  ├─ app/                      # 라우트 파일만
│  │  ├─ [locale]/(public)/     # 랜딩·로그인·공지
│  │  ├─ [locale]/(app)/        # 로그인 필요: 위시리스트·설정
│  │  ├─ [locale]/admin/
│  │  ├─ w/[id]/                # 공유 페이지 (서버 렌더 + OG 메타)
│  │  ├─ api/                   # Route Handlers
│  │  └─ not-found.tsx · error.tsx · global-error.tsx
│  ├─ features/                 # 도메인별 묶음 (FEATURES.md 이식 단위)
│  │  ├─ wishlist/  components/ hooks/ server/{service,repository}.ts schema.ts index.ts
│  │  └─ item/ share/ customize/ profile/ inquiry/ notice/ admin/ session/
│  ├─ shared/
│  │  ├─ ui/                    # 디자인 토큰 기반 공통 컴포넌트
│  │  ├─ lib/                   # api-error, fetch 클라이언트, safe-fetch, rate-limit
│  │  ├─ i18n/
│  │  └─ config/env.ts          # Zod 환경변수 스키마 (부팅 검증)
│  ├─ server/                   # 서버 전용 인프라: db.ts · auth.ts · storage.ts
│  └─ proxy.ts
├─ prisma/  schema.prisma · migrations/ · seed.ts
└─ e2e/                         # Playwright
```

의존 방향: `app → features → shared`, `features/*/server → server`. 역방향 금지. 기능끼리는 `index.ts` 공개 API로만.

## 이유

- 현재 코드는 같은 일을 하는 경로가 여러 개다: 데이터 접근 3가지(`lib/db/*`, `@/lib/db`, prisma 직접), 인증 체크 2가지, fetch 2가지(훅·raw fetch). 도메인 로직이 route 안에 섞여 있다(admin/dashboard 355줄) — AUDIT H6·M5·M6
- 기능별 폴더는 `audit/FEATURES.md` 한 행을 한 폴더로 이식·검증·제거할 수 있게 한다(병행 재구축 전략과 맞음)
- REST + 단일 응답 헬퍼는 에러 스키마 통일(완료 기준 7)과 API 단위 테스트에 유리하고, 언젠가의 모바일 앱이 같은 API를 쓸 수 있다
- 권한을 서비스 한 곳에서 판정하면 route마다 체크를 빠뜨리는 IDOR(AUDIT M1)를 구조로 막는다
- 경계를 ESLint로 강제하면 문서만으로 지키는 규칙이 무너지는 것을 막는다. 기본 규칙이라 의존성 추가 없음

## 기각된 대안

- 계층별 폴더(components/hooks/lib) — 기능 하나가 여러 폴더에 흩어져 이식·삭제 단위가 불명확 (현재 구조의 문제)
- 라우트 폴더 안에 모두 두기 — 공유 페이지·관리자처럼 여러 라우트가 쓰는 로직의 위치가 애매
- Server Actions 중심 — 코드는 적지만 에러 형태가 action 결과 타입으로 흩어지고 TanStack Query와 이원화, 외부 클라이언트 재사용 불가
- 읽기 RSC + 쓰기 Server Actions — 위와 같은 이유
- 경계를 문서로만 — 강제력이 없음

## 확장 지점

새 기능은 `src/features/{이름}/` 폴더와 라우트 파일만 추가한다. 새 외부 서비스는 `src/server/` 에 모듈 하나를 추가한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 전부 추천대로)
