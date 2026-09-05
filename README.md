# Linklet

받고 싶은 상품 링크를 모아 위시리스트로 만들고, URL 하나로 공유하는 개인 위시리스트 서비스.

**배포:** https://link-let.vercel.app/

<!-- TODO: screenshot — 랜딩 페이지 (히어로 + 서비스 소개) -->
<!-- TODO: screenshot — 위시리스트 편집 화면 (상품 URL 붙여넣기 → 메타데이터 자동 추출) -->
<!-- TODO: gif — 드래그 앤 드롭으로 아이템 순서 변경 -->
<!-- TODO: screenshot — 공유 페이지 (/w/:shareUrl) + 테마 커스터마이징 결과 -->

## ✨ 핵심 기능

- **URL 메타데이터 자동 추출** — 상품 링크를 붙여넣으면 제목·이미지·가격·사이트명을 자동으로 채움 (Open Graph / Twitter Cards / JSON-LD 파싱)
- **공유 URL** — 위시리스트마다 고유 주소(`/w/:shareUrl`)가 생성되어 로그인 없이 누구나 열람 가능
- **드래그 앤 드롭 정렬** — 아이템 우선순위를 끌어서 재배치
- **공유 페이지 커스터마이징** — 테마·레이아웃·프리셋·소셜 링크로 나만의 페이지 꾸미기
- **조회수·클릭수 분석** — 위시리스트/아이템 단위 방문·클릭 통계 대시보드
- **다국어 지원** — 한국어·영어·일본어, 접속 지역/브라우저 언어 기반 자동 감지
- **관리자 대시보드** — 사용자·문의·공지·에러 로그·통계 운영 페이지

## 🛠 기술 스택

| 구분 | 스택 |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 |
| Database | PostgreSQL + Prisma 6 |
| 인증 | NextAuth 4 (Google OAuth, Prisma Adapter) |
| 상태/데이터 | TanStack Query 5 |
| UI | Tailwind CSS 4, Radix UI, dnd-kit, sonner |
| 인프라 | Vercel, AWS S3 (이미지 업로드) |
| 테스트 | Vitest 4, Testing Library |
| 기타 | cheerio (HTML 파싱), date-fns |

## 📁 프로젝트 구조

```
app/
├── [locale]/          # 다국어 페이지 (kr/en/jp) — 설정·커스터마이징·관리자
├── api/               # REST API 라우트 (wishlists, items, metadata, admin 등)
└── w/[shareUrl]/      # 공개 공유 페이지 (ISR)
components/            # 공용 UI·폼·커스터마이징 컴포넌트
hooks/                 # TanStack Query 기반 데이터 훅
lib/
├── services/          # URL 메타데이터 추출, S3 업로드
├── db/                # Prisma 쿼리 레이어
├── i18n/              # 다국어 설정·사전
├── rate-limit.ts      # 인메모리 레이트 리미터
└── revalidation.ts    # 온디맨드 ISR 재검증 클라이언트
middleware.ts          # 인증 가드 + 지역 기반 언어 감지
prisma/                # 스키마·마이그레이션
tests/                 # Vitest 단위 테스트
docs/                  # API·컴포넌트 개발 문서
```

## 🔍 기술적으로 신경 쓴 점

- **SSRF 방어** — 외부 URL 메타데이터를 서버에서 fetch하므로, 사설 IP 대역(IPv4/IPv6)·localhost·클라우드 메타데이터 엔드포인트(169.254.169.254 등)를 요청 전에 차단 (`lib/services/url-metadata.ts`)
- **Rate Limiting + 봇 필터링** — 조회수 1회/시간, 업로드 5회/분 등 이벤트별 정책을 IP 단위로 적용하고, User-Agent 기반 봇 트래픽은 통계에서 제외 (`lib/rate-limit.ts`)
- **ISR + 온디맨드 재검증** — 공유 페이지는 10분 주기 ISR로 캐싱하되, 위시리스트 수정 시 시크릿 토큰 검증을 거친 revalidate API로 즉시 갱신 (`app/w/[shareUrl]/page.tsx`, `app/api/revalidate/route.ts`)
- **업로드 파일 검증** — MIME 타입 선언만 믿지 않고 매직 바이트로 실제 이미지 여부를 확인한 뒤 S3 업로드, 10MB 크기 제한 (`lib/services/s3-upload.ts`)
- **낙관적 업데이트** — 프로필 수정 시 TanStack Query `onMutate`로 UI를 먼저 반영하고 실패하면 롤백 (`hooks/use-user.ts`)

## 🚀 로컬 실행

```bash
npm install            # postinstall에서 prisma generate 실행
npx prisma migrate dev # DB 마이그레이션
npm run dev            # http://localhost:3000
```

필요한 환경변수 (`.env.development`):

```
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AMPLIFY_BUCKET
REVALIDATE_SECRET_TOKEN
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

배포 전 `npm run check-env`로 환경변수 누락 여부를 검사할 수 있습니다.

## 🧪 테스트

```bash
npm test               # Vitest 실행 (유틸·검증 로직 단위 테스트)
npm run test:coverage  # 커버리지 리포트
```

---

Claude Code를 활용한 1인 개발 프로젝트입니다. 아키텍처, 데이터 모델, 기술 스택 선택은 직접 결정했습니다.
