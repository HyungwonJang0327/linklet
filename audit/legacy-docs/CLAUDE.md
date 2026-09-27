# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 프로젝트 개요

Linklet은 Next.js 15, React 19, TypeScript, Prisma ORM, PostgreSQL로 구축된 위시리스트 공유 플랫폼입니다. 사용자는 카테고리화, 국제화, 커스터마이징 가능한 공유 페이지와 함께 위시리스트를 생성, 관리, 공유할 수 있습니다.

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 린팅 실행
npm run lint

# 데이터베이스 명령어
npx prisma generate          # 스키마 변경 후 Prisma 클라이언트 생성
npx prisma db push          # 스키마 변경사항을 데이터베이스에 푸시
npx prisma studio          # 데이터베이스 검사를 위한 Prisma Studio 열기
```

개발 서버는 http://localhost:3000에서 실행됩니다 (3000 포트가 사용 중이면 다음 사용 가능한 포트).

## 아키텍처 개요

### 핵심 기술
- **프레임워크**: Next.js 15.5.2 with App Router
- **UI**: React 19.1.0 with TypeScript 5
- **데이터베이스**: PostgreSQL with Prisma ORM 6.15.0
- **스타일링**: Tailwind CSS v4 with inline theme configuration
- **상태 관리**: TanStack Query 5.85.6 (서버 상태 관리)
- **인증**: NextAuth.js 4.24.11 with Google OAuth
- **파일 저장소**: AWS S3 SDK (이미지 업로드)
- **HTML 파싱**: Cheerio 1.1.2 (URL 메타데이터 추출)
- **아이콘**: Heroicons and Lucide React
- **국제화**: 커스텀 i18n 시스템 (한국어(kr), 영어(en), 일본어(jp) 지원)

### 데이터베이스 아키텍처

애플리케이션은 다음 핵심 모델들과 함께 PostgreSQL을 사용합니다:

- **User**: 프로필 정보(bio, avatar, locale)를 포함한 사용자 계정
- **Wishlist**: 카테고리, 프라이버시 설정, 공유 가능한 URL을 포함한 메인 위시리스트 엔티티
- **WishlistItem**: 제품 URL, 이미지, 우선순위를 포함한 위시리스트 내 개별 아이템
- **Session**: 사용자 인증 세션
- **WishlistCategory**: 위시리스트 카테고리화를 위한 Enum (GENERAL, BIRTHDAY, CHRISTMAS 등)

주요 관계:
- User → Wishlists (일대다)
- Wishlist → WishlistItems (일대다, cascade delete)
- User → Sessions (일대다, cascade delete)

### 데이터베이스 레이어 (`/lib/db/`)

데이터베이스 레이어는 다음과 같이 모듈화되어 있습니다:

- **`client.ts`**: 글로벌 인스턴스 관리를 포함한 Prisma 클라이언트 싱글톤
- **`index.ts`**: 모든 데이터베이스 함수를 재export하는 중앙 export 허브
- **`wishlist.ts`**: 포괄적인 CRUD를 포함한 모든 위시리스트 및 위시리스트 아이템 작업
- **`user.ts`**: 사용자 관리 및 세션 작업

**중요**: 데이터베이스 모듈은 순환 의존성을 피하기 위해 `./client`에서 클라이언트를 import합니다. API 라우트는 `@/lib/db` 또는 `@/lib/db/wishlist`와 같은 특정 모듈에서 import해야 합니다.

### API 아키텍처 (`/app/api/`)

Next.js 15 규칙을 따르는 RESTful API 라우트:

**위시리스트**:
- **`/api/wishlists`**: 위시리스트 목록/생성 (GET, POST)
- **`/api/wishlists/[id]`**: 개별 위시리스트 작업 (GET, PUT, DELETE)
- **`/api/wishlists/[id]/items`**: 아이템 추가 (POST)
- **`/api/wishlists/[id]/items/reorder`**: 아이템 순서 변경 (POST)
- **`/api/wishlists/share/[shareUrl]`**: 공유 가능한 URL을 통한 공개 접근 (GET)

**아이템**:
- **`/api/items/[id]`**: ISR 재검증을 포함한 아이템 작업 (GET, PUT, DELETE)
- **`/api/items/[id]/toggle-complete`**: 완료 상태 토글 (POST)

**사용자**:
- **`/api/users`**: 사용자 계정 관리 (GET, POST, PUT)
- **`/api/users/[id]/wishlists`**: 사용자의 위시리스트 (GET)
- **`/api/users/[id]/stats`**: 사용자 통계 (GET)

**메타데이터 & 미디어**:
- **`/api/metadata`**: 제품 링크의 URL 메타데이터 추출 (POST)
- **`/api/image`**: AWS S3에 이미지 업로드 (POST)

**재검증**:
- **`/api/revalidate`**: 단일 경로에 대한 ISR 재검증 (POST)
- **`/api/revalidate-batch`**: 배치 재검증 (POST)

모든 API 라우트는 적절한 에러 처리, 유효성 검사, ISR 재검증 지원을 포함합니다.

### 국제화 시스템 (`/lib/i18n/`)

- **지원 로케일**: 한국어(kr), 영어(en), 일본어(jp), 기본값은 한국어
- **라우트 기반**: app 디렉토리에서 `[locale]` 동적 세그먼트 사용
- **정적 생성**: 모든 로케일 페이지가 빌드 시 사전 생성됨
- **미들웨어**: 위시리스트 공유 라우트를 위한 지역 기반 로케일 감지
- **사전 시스템**: 타입 안전한 접근을 가진 JSON 기반 번역

### 컴포넌트 아키텍처 (`/components/`)

기능별로 구성:

- **`ui/`**: 재사용 가능한 UI 컴포넌트 (Button, Input, Card, Dialog, ImageUpload, Loading 등)
- **`layout/`**: 레이아웃 컴포넌트 (Header, ConditionalHeader)
- **`providers/`**: Context 제공자 (Auth, Query, I18n, Dialog)
- **`wishlist/`**: 위시리스트 전용 컴포넌트
- **`forms/`**: 유효성 검사가 포함된 폼 컴포넌트
- **`customize/`**: 위시리스트 커스터마이징 컴포넌트
- **`settings/`**: 사용자 설정 인터페이스
- **`auth/`**: 인증 컴포넌트
- **`errors/`**: 에러 처리 컴포넌트 (ErrorBoundary)

**Provider 계층**: QueryProvider → AuthProvider → DialogProvider → I18nProvider → children

### 커스텀 훅 (`/hooks/`)

데이터 관리를 위한 TanStack Query 기반 훅:

- **`use-user.ts`**: 낙관적 업데이트를 포함한 사용자 프로필 작업
- **`use-wishlists.ts`**: 5분 캐시를 포함한 모든 위시리스트
- **`use-wishlist.ts`**: 단일 위시리스트 상세정보
- **`use-shared-wishlist.ts`**: 공개 위시리스트 (10분 캐시, 404/403에서 재시도 안함)
- **`use-url-metadata.ts`**: URL 메타데이터 추출 (단일 및 배치 처리)
- **`use-debounce.ts`**: 디바운싱 유틸리티

모든 훅은 적절한 로딩 상태, 에러 처리, TanStack Query를 이용한 캐시 관리를 포함합니다.

### 유효성 검사 & 데이터 정제 (`/lib/validations/`)

- **폼 유효성 검사**: 위시리스트 및 아이템에 대한 클라이언트 및 서버 측 유효성 검사
- **데이터 정제**: 자동 트림 및 타입 강제 변환
- **URL 유효성 검사**: 제품 및 이미지 URL에 대한 강력한 URL 유효성 검사
- **카테고리 유효성 검사**: 타입 안전한 위시리스트 카테고리 유효성 검사

### 페이지 구조 (`/app/[locale]/`)

동적 로케일 기반 라우팅:

- **홈 페이지**: 기능 쇼케이스를 포함한 랜딩 페이지
- **가격 페이지**: 국제화를 포함한 무료/프로 티어 비교
- **설정 페이지**: 프로필, 위시리스트, 외형, 알림이 포함된 중첩 설정
- **위시리스트 공유**: `/w/[shareUrl]`의 공개 위시리스트 페이지

## 중요한 개발 참고사항

### Next.js 15 호환성
- 페이지 컴포넌트의 모든 `params`는 await되어야 합니다 (Promise 객체입니다)
- 로케일 기반 정적 생성을 위해 `generateStaticParams()` 사용
- 미들웨어는 위시리스트 공유 라우트에만 구성됨

### 데이터베이스 함수 사용
- 편의를 위해 `@/lib/db`에서 import하거나 특정 모듈을 위해 `@/lib/db/wishlist`에서 import
- 모든 데이터베이스 함수는 적절한 TypeScript 타입 및 에러 처리를 포함
- 다단계 작업을 위한 트랜잭션 지원 사용 (예: `reorderWishlistItems`)

### 인증 & 권한 부여
- NextAuth.js를 통한 Google OAuth 통합
- Prisma 어댑터를 사용한 데이터베이스 기반 세션
- 로그인 배리어가 설정 페이지를 보호
- bio, 아바타, 로케일 선호도를 포함한 사용자 프로필 관리

### URL 메타데이터 추출
- `/api/metadata` 엔드포인트가 URL에서 제목, 설명, 이미지, 가격을 추출
- 속도 제한(IP당 분당 10개 요청) 및 SSRF 공격에 대한 보안 조치
- 클라이언트 측 메타데이터 가져오기를 위한 `useUrlMetadata` 및 `useBatchUrlMetadata` 훅
- `/lib/services/url-metadata.ts` 서비스가 HTML 파싱 및 Open Graph/Twitter Card 추출 처리
- 위시리스트 생성 페이지의 제품 링크가 메타데이터 표시로 자동으로 향상됨
- 로딩 상태를 포함한 대량 추출 및 개별 URL 처리 지원

### ISR 및 재검증
- 공유 위시리스트는 `revalidateSharedWishlist()` 함수를 사용한 ISR 사용
- 아이템이 수정되면 API 라우트가 자동으로 재검증
- 미들웨어가 지역 기반 기능을 위한 국가 헤더 추가

### 상태 관리 & 쿼리 설정
- 서버 상태 캐싱 및 동기화를 위한 **TanStack Query**
  - Stale time: 5분
  - GC time: 30분
  - 지수 백오프를 포함한 최대 3회 재시도 (404는 건너뛰기)
  - SSR을 위한 별도의 쿼리 클라이언트
- i18n 및 인증 상태를 위한 **React Context**
- **전역 클라이언트 상태 없음** - 서버 상태 패턴 선호
- 낙관적 업데이트를 포함한 재사용 가능한 데이터 작업을 위한 **커스텀 훅 패턴**
- **쿼리 키 전략**: 일관된 키 패턴 (예: `['users', id]`, `['wishlists', 'detail', id]`)

### S3 이미지 저장소 아키텍처

이미지는 환경 기반 폴더 구조로 AWS S3에 업로드됩니다:

```
linklet-image/
├── production/
│   ├── uploads/      # 사용자 업로드 이미지 (프로필 사진, 커스텀 아이템 이미지)
│   └── metadata/     # 제품 URL에서 자동 추출된 이미지
└── development/
    ├── uploads/      # 개발 환경의 사용자 업로드 이미지
    └── metadata/     # 개발 환경의 자동 추출 이미지
```

**환경 감지** (`lib/services/s3-upload.ts`):
- Production: `VERCEL_ENV === 'production'` 또는 `NODE_ENV === 'production'`
- Development: 그 외 모든 경우 (로컬 개발, 프리뷰 배포)

**업로드 함수**:
- `uploadImageToS3(file, options)`: 유효성 검사를 포함한 File/Blob 업로드 (매직 바이트, MIME 타입, 크기 제한)
- `downloadAndUploadToS3(url, options)`: 외부 이미지 다운로드 및 S3 업로드

**보안 기능**:
- 파일 크기 제한: 최대 10MB
- 허용된 MIME 타입: jpeg, jpg, png, gif, webp, svg
- 파일 타입 스푸핑 방지를 위한 매직 바이트 검증
- 경로 탐색 공격 방지를 위한 파일명 정제
- 외부 URL 다운로드를 위한 SSRF 보호

**API 엔드포인트**:
- `/api/image`: 직접 파일 업로드 → `production/uploads/` 또는 `development/uploads/`
- `/api/metadata`: URL 메타데이터 추출 → `production/metadata/` 또는 `development/metadata/`

### 필수 환경 변수
```bash
# 데이터베이스
DATABASE_URL="postgresql://..."

# 앱
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 인증
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3 (이미지 업로드용)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AMPLIFY_BUCKET="linklet-image"
AWS_REGION="ap-northeast-2"

# 선택사항
REVALIDATE_SECRET_TOKEN="your-revalidate-token"
```

## 개발 패턴

### 파일 생성 가이드라인
- 새 파일을 생성하기보다 기존 파일 편집을 항상 선호
- 목표 달성을 위해 절대적으로 필요한 경우가 아니면 파일을 절대 생성하지 않음
- 명시적으로 요청되지 않는 한 문서 파일(*.md) 또는 README 파일을 절대 선제적으로 생성하지 않음

### 코드 규칙
- 파일을 변경할 때 기존 패턴을 따름
- 가용성을 가정하기 전에 라이브러리 사용을 위해 인접 파일 및 package.json 확인
- 기존 유틸리티를 사용하고 컴포넌트 전반에 걸쳐 일관된 코드 스타일 유지
- 순환 의존성을 피하기 위해 `@/lib/db` 또는 특정 모듈에서 데이터베이스 함수 import

### TanStack Query 모범 사례
- 훅에서 제공된 쿼리 키 팩토리 사용 (예: `userKeys`, `wishlistKeys`)
- 더 나은 UX를 위해 낙관적 업데이트 구현 (참조: `use-user.ts`)
- UI를 동기화 상태로 유지하기 위해 뮤테이션 후 쿼리 무효화
- 적절한 에러 처리 및 로딩 상태 사용
- 데이터 변동성에 따라 적절한 stale time 설정

## 주요 유틸리티 & 서비스

### URL 메타데이터 추출 (`/lib/services/url-metadata.ts`)
- 제품 링크 메타데이터를 위한 Cheerio 기반 HTML 파싱
- 추출: 제목, 설명, 이미지, 가격, 사이트 이름
- 지원: Open Graph, Twitter Cards, JSON-LD, 일반적인 이커머스 셀렉터
- 보안: URL 유효성 검사, SSRF 보호, 도메인 차단 목록
- 타임아웃: 요청당 15초
- 추출된 이미지에 대한 자동 S3 이미지 업로드
- 속도 제한: `/api/metadata` 엔드포인트에서 IP당 분당 10개 요청

### S3 업로드 서비스 (`/lib/services/s3-upload.ts`)
- 코드 중복을 피하기 위한 중앙집중식 S3 업로드 로직
- 환경 기반 폴더 라우팅 (production/development)
- 하위 폴더 구성 (uploads/ vs metadata/)
- 파일 유효성 검사: 크기 제한, MIME 타입, 매직 바이트 검증
- 보안을 위한 파일명 정제
- 연결 풀링을 위한 싱글톤 S3 클라이언트
- 두 가지 주요 함수:
  - `uploadImageToS3(file, options)`: 직접 파일 업로드
  - `downloadAndUploadToS3(url, options)`: URL 기반 다운로드 및 업로드

### 재검증 시스템 (`/lib/revalidation.ts`)
- `revalidateSharedWishlist(shareUrl)`: 단일 위시리스트 페이지 재검증
- `revalidateAllWishlists()`: 모든 위시리스트에 대한 대량 재검증
- `revalidatePath(path)`: 경로 기반 ISR 재검증
- API 라우트의 아이템 뮤테이션에 의해 트리거되는 자동 재검증

### 유틸리티 함수 (`/lib/utils/`)
- **`cn()`**: clsx 및 tailwind-merge를 사용한 클래스 병합
- **날짜 포맷팅**: date-fns를 사용한 로케일 인식 날짜 문자열
- **가격 포맷팅**: 한국 원화 포맷팅
- **URL 유틸리티**: cuid2를 사용한 유효성 검사 및 공유 URL 생성
- **클립보드**: 폴백 지원을 포함한 클립보드 복사
- **저장소**: 에러 처리를 포함한 localStorage 래퍼

## 애플리케이션 설정 (`/lib/constants/`)

앱 전반의 설정을 위한 중앙집중식 구성:

```typescript
export const APP_CONFIG = {
  maxWishlistsPerUser: {
    free: 2,        // 무료 티어는 최대 2개의 위시리스트 생성 가능
    pro: Infinity   // 프로 티어는 무제한 위시리스트
  }
}
```

**위시리스트 생성 제한**:
- `/app/[locale]/settings/wishlists/page.tsx`의 클라이언트 측 유효성 검사
- `/app/api/wishlists/route.ts`의 서버 측 유효성 검사
- 지역화된 메시지를 포함한 에러 처리
- `WISHLIST_LIMIT_REACHED` 에러 코드와 함께 403 상태 반환

## 대화 기록 가이드라인

이 프로젝트에서 작업할 때, 구조화된 마크다운 파일에 대화 기록을 기록하세요:

### 디렉토리 구조
모든 대화 기록을 저장하기 위해 프로젝트 루트에 `/history` 폴더를 생성합니다.

### 파일 구성
- **계획 단계**: `YYYY-MM-DD-planning.md`로 저장
- **개발 단계**: `YYYY-MM-DD-development.md`로 저장

### 콘텐츠 구조
각 대화 기록은 다음을 포함해야 합니다:
- 대화 날짜 및 시간
- 논의된 주제 요약
- 내려진 주요 결정사항
- 실행 항목 또는 다음 단계
- 논의된 코드 변경사항 또는 구현사항

이는 프로젝트 연속성을 유지하고 향후 개발 세션을 위한 컨텍스트를 제공하는 데 도움이 됩니다.