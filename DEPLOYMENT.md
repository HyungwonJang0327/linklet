# 🚀 프로덕션 배포 가이드

이 문서는 Linklet 프로젝트를 프로덕션 환경에 배포하기 위한 완전한 체크리스트입니다.

## 목차

1. [데이터베이스 설정](#1-데이터베이스-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [보안 설정](#3-보안-설정)
4. [인프라 설정](#4-인프라-설정-vercel)
5. [배포 전 테스트](#5-배포-전-테스트)
6. [모니터링 설정](#6-모니터링-및-로깅-설정)
7. [배포 실행](#7-배포-실행)
8. [배포 후 운영](#8-배포-후-운영-가이드)

---

## 1. 데이터베이스 설정

### 1.1 프로덕션 DB 마이그레이션

프로덕션 데이터베이스 생성 후 다음 명령어를 실행하세요:

```bash
# .env.production에 프로덕션 DB URL 설정 후

# Prisma 클라이언트 생성
npx prisma generate

# 스키마를 프로덕션 DB에 적용
npx prisma migrate deploy

# 또는 (개발 환경에서 작업한 경우)
npx prisma db push
```

### 1.2 첫 Admin 유저 생성

프로덕션 배포 후 **수동으로** admin 유저를 설정해야 합니다:

**방법 1: SQL 직접 실행**
```sql
-- 1. 먼저 Google OAuth로 로그인하여 계정 생성
-- 2. DB에서 해당 유저의 isAdmin을 true로 변경

UPDATE "User"
SET "isAdmin" = true
WHERE email = 'your-admin-email@gmail.com';
```

**방법 2: Prisma Studio 사용**
```bash
npx prisma studio
# User 테이블에서 해당 유저의 isAdmin을 true로 변경
```

### 1.3 DB 백업 설정 (Neon 사용 시)

- Neon Dashboard에서 자동 백업 활성화
- Point-in-Time Recovery 설정
- 백업 주기 설정 (일일 권장)

---

## 2. 환경 변수 설정

### 2.1 필수 Secret 생성

강력한 랜덤 secret을 생성하세요 (최소 32자):

```bash
# NEXTAUTH_SECRET 생성
openssl rand -base64 32

# REVALIDATE_SECRET_TOKEN 생성
openssl rand -base64 32
```

### 2.2 .env.production 완성 체크리스트

`.env.production` 파일에서 모든 플레이스홀더를 실제 값으로 교체하세요:

```bash
# ========================================
# 데이터베이스 (필수)
# ========================================
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# ========================================
# NextAuth 설정 (필수)
# ========================================
NEXTAUTH_URL="https://your-actual-domain.com"
NEXTAUTH_SECRET="[위에서 생성한 32자 이상의 secret]"

# ========================================
# Google OAuth (필수)
# ========================================
# Google Cloud Console에서 프로덕션용 생성
GOOGLE_CLIENT_ID="[프로덕션 Client ID]"
GOOGLE_CLIENT_SECRET="[프로덕션 Secret]"

# ========================================
# AWS S3 (필수)
# ========================================
AWS_REGION="ap-northeast-2"
AMPLIFY_BUCKET="linklet-production"
AWS_ACCESS_KEY_ID="[프로덕션 Access Key]"
AWS_SECRET_ACCESS_KEY="[프로덕션 Secret Key]"

# ========================================
# Revalidation (필수)
# ========================================
REVALIDATE_SECRET_TOKEN="[위에서 생성한 secret]"

# ========================================
# Google Analytics (권장)
# ========================================
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# ========================================
# 앱 설정 (필수)
# ========================================
NEXT_PUBLIC_APP_URL="https://your-actual-domain.com"
NEXT_PUBLIC_APP_NAME="Linklet"
NODE_ENV="production"
```

### 2.3 Google OAuth 프로덕션 설정

Google Cloud Console에서 다음 설정을 완료하세요:

1. **새 OAuth 클라이언트 ID 생성**
   - 프로젝트: linklet-production
   - 애플리케이션 유형: 웹 애플리케이션

2. **승인된 JavaScript 원본 추가**
   ```
   https://your-domain.com
   ```

3. **승인된 리디렉션 URI 추가**
   ```
   https://your-domain.com/api/auth/callback/google
   ```

4. **OAuth 동의 화면 설정**
   - 프로덕션 상태로 전환
   - 또는 테스트 모드에서 테스트 사용자 추가

### 2.4 환경 변수 검증

배포 전에 환경 변수가 올바르게 설정되었는지 확인:

```bash
npm run check-env
```

출력 예시:
```
🔍 Checking production environment variables...

✅ Required variables:
   ✅ DATABASE_URL: postgresql...
   ✅ NEXTAUTH_SECRET: Hx7kP9mN2...
   ...

🔐 Security checks:
   ✅ NEXTAUTH_SECRET: Length OK
   ✅ NEXTAUTH_URL: Using HTTPS

✅ SUCCESS: All environment variables are properly configured
```

---

## 3. 보안 설정

### 3.1 CORS 설정 확인

✅ 이미 설정 완료 - `NEXT_PUBLIC_APP_URL`을 기반으로 자동 적용됨

### 3.2 보안 헤더 설정 (권장)

`next.config.ts` 파일에 보안 헤더를 추가하세요:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'linklet-image.s3.ap-northeast-2.amazonaws.com'
    ],
  },

  // 프로덕션 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 3.3 Rate Limiting 확인

✅ 다음 엔드포인트에 이미 적용됨:
- `/api/metadata` - 10 req/min
- `/api/image` - 5 req/min
- `/api/inquiries` - 3 req/hour
- `/api/qna` - 3 req/hour

---

## 4. 인프라 설정 (Vercel)

### 4.1 Vercel CLI 설치 및 설정

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 프로젝트 연결
vercel link
```

### 4.2 Vercel 환경 변수 설정

**방법 1: CLI로 설정**
```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
# ... (모든 환경 변수)
```

**방법 2: Dashboard에서 설정 (권장)**

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들을 추가:

| 변수명 | 환경 | 비고 |
|--------|------|------|
| `DATABASE_URL` | Production | Neon Pooled URL |
| `NEXTAUTH_URL` | Production | https://your-domain.com |
| `NEXTAUTH_SECRET` | Production | 32자 이상 secret |
| `GOOGLE_CLIENT_ID` | Production | 프로덕션 OAuth |
| `GOOGLE_CLIENT_SECRET` | Production | 프로덕션 OAuth |
| `AWS_ACCESS_KEY_ID` | Production | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | Production | S3 credentials |
| `AWS_REGION` | Production | ap-northeast-2 |
| `AMPLIFY_BUCKET` | Production | S3 bucket 이름 |
| `REVALIDATE_SECRET_TOKEN` | Production | ISR revalidation |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Production, Preview | GA tracking |
| `NEXT_PUBLIC_APP_URL` | Production | https://your-domain.com |
| `NEXT_PUBLIC_APP_NAME` | Production, Preview | Linklet |

### 4.3 도메인 설정

**Vercel에 커스텀 도메인 추가**
1. Vercel Dashboard → Domains → Add Domain
2. `your-domain.com` 입력
3. `www.your-domain.com` 추가 (선택사항)

**DNS 레코드 설정**

도메인 registrar에서 다음 DNS 레코드 추가:

```
Type    Name    Value
----    ----    -----
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

**SSL/TLS 인증서**
- Vercel이 자동으로 Let's Encrypt 인증서 발급
- HTTPS 강제 활성화 (Vercel Dashboard에서 설정)

---

## 5. 배포 전 테스트

### 5.1 로컬에서 프로덕션 빌드 테스트

```bash
# 프로덕션 환경으로 빌드
NODE_ENV=production npm run build

# 빌드 결과 확인
# ✓ Compiled successfully
# ✓ Generating static pages (103/103)

# 프로덕션 서버 실행
npm run start
```

### 5.2 주요 기능 수동 테스트

로컬 프로덕션 서버에서 다음을 테스트하세요:

- [ ] Google OAuth 로그인/로그아웃
- [ ] Wishlist 생성/수정/삭제
- [ ] 아이템 추가/수정/삭제
- [ ] 이미지 업로드
- [ ] 공유 페이지 접근 (`/w/[shareUrl]`)
- [ ] 문의하기 기능
- [ ] Admin 기능 (세션 정리 등)

### 5.3 보안 취약점 스캔

```bash
# npm audit 실행
npm audit --production

# 결과: found 0 vulnerabilities (이어야 함)
```

### 5.4 테스트 실행

```bash
npm run test

# 결과:
# ✓ Test Files: 3 passed (3)
# ✓ Tests: 49 passed (49)
```

---

## 6. 모니터링 및 로깅 설정

### 6.1 Vercel Analytics 설치 (권장)

```bash
npm install @vercel/analytics
```

`app/[locale]/layout.tsx` 파일에 추가:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html lang={locale}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 6.2 에러 추적 - Sentry (선택사항)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

`.env.production`에 추가:
```bash
SENTRY_DSN="your_sentry_dsn_here"
```

### 6.3 로그 모니터링

**Vercel Dashboard 활용**
- Dashboard → Logs 탭
- 실시간 함수 호출 로그 확인
- 에러 발생 시 알림 설정

**알림 설정**
- Vercel Dashboard → Settings → Notifications
- 배포 실패, 에러율 증가 시 Slack/Email 알림

---

## 7. 배포 실행

### 7.1 배포 전 최종 체크

```bash
# 1. 환경 변수 검증
npm run check-env

# 2. 테스트 실행
npm run test

# 3. 프로덕션 빌드
npm run build

# 4. Git 상태 확인
git status
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### 7.2 배포 방법

**방법 1: Git 연동 자동 배포 (권장)**

```bash
# main 브랜치에 push하면 자동으로 Vercel에 배포됨
git push origin main
```

Vercel이 자동으로:
1. 코드 변경 감지
2. 빌드 실행
3. 프로덕션 배포
4. 도메인 업데이트

**방법 2: CLI 직접 배포**

```bash
vercel --prod
```

### 7.3 배포 후 즉시 확인사항

**1. Health Check**
```bash
curl https://your-domain.com/api/health

# 응답: { "status": "ok", ... }
```

**2. 첫 로그인 테스트**
- Google OAuth 로그인 시도
- 사용자 프로필 정상 생성 확인
- 개발자 도구에서 콘솔 에러 확인

**3. Admin 유저 설정**

프로덕션 DB에 접속하여:
```sql
UPDATE "User"
SET "isAdmin" = true
WHERE email = 'your-admin@email.com';
```

또는 Prisma Studio:
```bash
npx prisma studio
# 프로덕션 DATABASE_URL로 연결
```

**4. 주요 기능 프로덕션 테스트**

실제 프로덕션 URL에서 다음을 테스트:
- [ ] 로그인/로그아웃
- [ ] Wishlist CRUD
- [ ] 이미지 업로드 (S3)
- [ ] 공유 페이지
- [ ] Google Analytics 추적 (실시간 보고서)
- [ ] 문의하기
- [ ] Admin 기능

**5. 보안 헤더 확인**
```bash
curl -I https://your-domain.com

# 확인할 헤더:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
```

**6. HTTPS 강제 확인**
```bash
curl -I http://your-domain.com
# Location: https://your-domain.com (리디렉션 확인)
```

---

## 8. 배포 후 운영 가이드

### 8.1 정기 점검 일정

**일일 점검**
- [ ] Vercel Dashboard에서 에러 로그 확인
- [ ] 비정상적인 트래픽 패턴 모니터링
- [ ] 응답 시간 확인

**주간 점검**
- [ ] DB 백업 상태 확인 (Neon Dashboard)
- [ ] S3 스토리지 사용량 확인
- [ ] 의존성 보안 업데이트 확인 (`npm audit`)
- [ ] Google Analytics 주간 리포트 검토

**월간 점검**
- [ ] DB 성능 최적화 (느린 쿼리 확인)
- [ ] 사용자 피드백 검토 (문의/QnA)
- [ ] 인프라 비용 분석
- [ ] 사용자 증가 추세 분석

### 8.2 일반적인 운영 작업

**만료된 세션 정리**
```bash
# Admin 로그인 후
# Settings → 만료 세션 정리 버튼 클릭

# 또는 Cron Job으로 자동화
curl -X POST "https://your-domain.com/api/auth/cleanup-sessions?token=YOUR_REVALIDATE_SECRET_TOKEN"
```

**DB 백업 복원** (긴급 상황)
```bash
# Neon Dashboard → Project → Restore
# Point-in-Time Recovery 사용
# 특정 시점으로 복원 가능
```

**환경 변수 업데이트**
```bash
# Vercel Dashboard → Settings → Environment Variables
# 변수 업데이트 후 자동 재배포됨
```

### 8.3 긴급 상황 대응

**보안 침해 의심 시**

1. **즉시 모든 Secret 교체**
   ```bash
   # 새로운 secret 생성
   openssl rand -base64 32

   # Vercel에서 다음 변수 업데이트:
   # - NEXTAUTH_SECRET
   # - REVALIDATE_SECRET_TOKEN
   # - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
   ```

2. **모든 세션 무효화**
   ```sql
   DELETE FROM "Session";
   ```

3. **의심스러운 활동 조사**
   - Vercel Logs에서 비정상 요청 패턴 확인
   - DB에서 최근 생성된 데이터 확인
   - S3에서 업로드된 파일 확인

4. **보안 패치 적용**
   ```bash
   npm audit
   npm audit fix
   git commit -m "security: emergency security patches"
   git push
   ```

**DB 장애 시**

1. **Neon 상태 확인**
   - https://neonstatus.com

2. **백업에서 복원**
   - Neon Dashboard → Restore
   - 최근 정상 시점 선택

3. **연결 재시도**
   - Vercel Dashboard → Deployments → Redeploy

**배포 실패 시**

1. **에러 로그 확인**
   ```bash
   vercel logs
   ```

2. **이전 버전으로 롤백**
   - Vercel Dashboard → Deployments
   - 이전 정상 배포 선택 → Promote to Production

3. **로컬에서 재현**
   ```bash
   npm run build
   # 에러 수정 후
   git push
   ```

### 8.4 성능 최적화

**느린 쿼리 식별**
```bash
# Prisma Studio에서 쿼리 성능 확인
# 또는 Neon Dashboard → Monitoring
```

**이미지 최적화**
- Next.js Image 컴포넌트 사용 확인
- S3에서 불필요한 이미지 정리
- CloudFront CDN 설정 (선택사항)

**캐싱 전략**
- ISR (Incremental Static Regeneration) 활용
- API 응답 캐싱
- CDN 캐시 설정

---

## 📋 최종 배포 체크리스트

### 필수 항목 (배포 전 완료 필요)

- [ ] 프로덕션 DB 생성 및 마이그레이션 완료
- [ ] `.env.production` 모든 플레이스홀더를 실제 값으로 교체
- [ ] `npm run check-env` 통과
- [ ] Google OAuth 프로덕션 설정 완료
- [ ] Vercel 프로젝트 생성 및 환경 변수 설정
- [ ] 도메인 연결 및 DNS 설정
- [ ] SSL/TLS 인증서 확인
- [ ] 로컬 프로덕션 빌드 테스트 통과
- [ ] Git 저장소에 최신 코드 push

### 권장 항목

- [ ] 보안 헤더 설정 (`next.config.ts`)
- [ ] Vercel Analytics 설치
- [ ] DB 자동 백업 활성화
- [ ] 에러 추적 도구 설치 (Sentry)
- [ ] 로그 알림 설정

### 배포 후 확인 항목

- [ ] Health check API 응답 확인
- [ ] 첫 로그인 테스트
- [ ] Admin 유저 생성
- [ ] 주요 기능 프로덕션 테스트
- [ ] 보안 헤더 확인
- [ ] HTTPS 강제 확인
- [ ] Google Analytics 데이터 수집 확인

---

## 🎯 빠른 배포 명령어

```bash
# 1단계: 환경 변수 검증 및 빌드
npm run check-env && npm run build

# 2단계: Git push (자동 배포)
git add .
git commit -m "chore: production deployment"
git push origin main

# 3단계: 배포 상태 확인
vercel --prod

# 4단계: Health check
curl https://your-domain.com/api/health
```

---

## 📞 지원 및 문의

- **Vercel 문서**: https://vercel.com/docs
- **Next.js 문서**: https://nextjs.org/docs
- **Prisma 문서**: https://www.prisma.io/docs
- **Neon 문서**: https://neon.tech/docs

배포 성공을 기원합니다! 🚀
