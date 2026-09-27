# BASELINE — 리뉴얼 전 수치

- 측정일: 2026-09-27
- 기준 커밋: `eac797e` (태그 `pre-renewal`)
- 환경: macOS (Darwin 25.1.0), Node v24.21.0, npm 11.19.0
- 리뉴얼 후 같은 명령으로 다시 재서 `audit/BASELINE-after.md` 에 비교표를 만든다.

## 1. 품질 게이트

| 항목 | 결과 | 수치 | 측정 명령 |
|---|---|---|---|
| 타입체크 | ✅ 통과 | 에러 0, 3.7s | `npx tsc --noEmit --incremental false` |
| 린트 | ✅ 통과 (경고만) | 에러 0 / 경고 24 (`no-unused-vars` 18, `react-hooks/exhaustive-deps` 6), 2.6s | `npx eslint .` |
| 테스트 | ✅ 통과 | 3 파일 / 49 테스트, 1.5s | `npx vitest run` |
| 커버리지 | ❌ 측정 불가 | — | `npx vitest run --coverage` → `@vitest/coverage-v8` 미설치. 설치하면 lock 변경이므로 감사 단계에서 보류 |
| 프로덕션 빌드 | ✅ 통과 | **18.6s** (real), 경고는 린트 경고와 동일 | 아래 §2 |

tsconfig는 `strict: true`. ESLint는 `no-explicit-any: off`.

## 2. 빌드 방법 (안전 조건)

`next build` 는 `.env.production` 을 읽는다. 운영 DB·S3에 연결될 수 있는 값을 쓰지 않도록, **DB·AWS·인증 관련 변수를 더미 값으로 덮어쓰고** 빌드했다(Next는 이미 있는 process.env를 .env 파일로 덮어쓰지 않는다). 빌드 전 `.next` 는 옮겨 두었다가 빌드 후 원래 것으로 되돌렸다.

```bash
NEXT_TELEMETRY_DISABLED=1 \
DATABASE_URL='postgresql://dummy:dummy@127.0.0.1:1/dummy' \
DATABASE_URL_UNPOOLED='postgresql://dummy:dummy@127.0.0.1:1/dummy' \
POSTGRES_PRISMA_URL='postgresql://dummy:dummy@127.0.0.1:1/dummy' \
POSTGRES_URL='postgresql://dummy:dummy@127.0.0.1:1/dummy' \
AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy \
GOOGLE_CLIENT_SECRET=dummy NEXTAUTH_SECRET=dummy-build-secret-000000000000000 \
NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_APP_URL=http://localhost:3000 \
REVALIDATE_SECRET_TOKEN=dummy \
/usr/bin/time -p npx next build
```

빌드 시점 DB 접근이 없음을 코드로 확인했다(generateStaticParams는 locale 배열만 사용, 서버 컴포넌트 중 prisma 직접 호출 없음, API 라우트는 전부 `ƒ` dynamic).

## 3. 번들 크기 (First Load JS)

공통 청크: **102 kB**. Middleware: **34.1 kB**. `.next/static` 전체: **1.9 MB**.

| 라우트 | 페이지 JS | First Load JS | 렌더 |
|---|---|---|---|
| `/[locale]` (랜딩) | 492 B | 106 kB | SSG |
| `/[locale]/login` | 3.62 kB | 135 kB | SSG |
| `/[locale]/pricing` | 4.56 kB | 124 kB | SSG |
| `/[locale]/settings/wishlists` | 7.11 kB | 152 kB | SSG(셸) |
| `/[locale]/settings/wishlists/create` | 11.6 kB | 168 kB | SSG(셸) |
| `/[locale]/settings/wishlists/[id]` | **26.3 kB** | **183 kB** | dynamic — 최대 |
| `/[locale]/settings/customize` | 16 kB | 158 kB | SSG(셸) |
| `/[locale]/settings/profile` | 3.97 kB | 159 kB | SSG(셸) |
| `/[locale]/settings/analytics` | 2.19 kB | 142 kB | SSG(셸) |
| `/[locale]/admin` | 3.39 kB | 105 kB | SSG(셸) |
| `/[locale]/admin/notices` | 4.72 kB | 124 kB | SSG(셸) |
| `/[locale]/components` (개발용) | 5.25 kB | 141 kB | SSG |
| `/w/[shareUrl]` (공유) | 4.29 kB | 137 kB | dynamic |

라우트 수: 페이지 30개(`[locale]` 3개 로케일로 SSG), API 29개.

## 4. 의존성

| 항목 | 수치 | 명령 |
|---|---|---|
| direct dependencies | 23 | package.json |
| devDependencies | 16 | package.json |
| 설치된 전체 패키지 | 688 | `npm ls --all --parseable \| wc -l` |
| extraneous | 5 | `npm ls --depth=0` |
| 뒤처진 패키지 | 31 (메이저 뒤처짐 10) | `npm outdated` |
| 취약점 | **50: critical 5 / high 19 / moderate 24 / low 2** | `npm audit --json` |

## 5. 코드 규모

측정 대상: git 추적 파일 중 `.ts/.tsx/.js/.mjs/.css` (생성물 제외).

| 항목 | 수치 |
|---|---|
| git 추적 파일 전체 | 218 |
| 코드 파일 수 | 188 |
| 코드 LOC | **23,662** |
| app/ | 13,409 |
| components/ | 4,485 |
| lib/ | 3,613 |
| hooks/ | 1,166 |
| tests/ | 355 |
| scripts/ | 404 |
| prisma/schema.prisma | 208 |
| i18n JSON | 857 × 3 |
| 250줄 초과 파일 | 20 (최대 710) |
| `any` 사용 줄 | 63 |
| `console.*` 호출 | 177 |
| TODO/FIXME | 3 |

```bash
F=$(git ls-files | grep -E '\.(ts|tsx|js|mjs|css)$' | grep -v generated)
echo "$F" | wc -l; echo "$F" | xargs wc -l | tail -1
echo "$F" | grep -E '\.(ts|tsx)$' | xargs grep -nE ':\s*any\b|as any|<any>|any\[\]' | wc -l
echo "$F" | grep -E '\.(ts|tsx)$' | xargs grep -n 'console\.' | wc -l
echo "$F" | grep -E '\.(ts|tsx)$' | xargs wc -l | sort -rn | awk '$1>250 && $2!="total"' | wc -l
```

## 6. 런타임 측정 환경 (Lighthouse·스크린샷 공통)

`.env.development`(운영과 분리된 dev DB — 사용자 확인 2026-09-27)를 Next 자체 로더(`@next/env`)로 읽어 프로덕션 빌드 + `next start -p 3100` 으로 띄웠다. 두 env 파일 키 목록이 같아 `.env.production` 값이 끼어들지 않음을 스크립트에서 검사했다(빠진 키가 있으면 중단). `NEXTAUTH_URL`·`NEXT_PUBLIC_APP_URL` 은 `http://localhost:3100` 으로 덮어씀. 측정 후 서버 종료, `.next` 원복.

```js
// with-dev-env.js — 사용: node with-dev-env.js npx next build && node with-dev-env.js npx next start -p 3100
const { loadEnvConfig } = require(require.resolve('@next/env', { paths: [process.cwd()] }))
const { spawnSync } = require('child_process')
loadEnvConfig(process.cwd(), true, { info() {}, error() {} })          // .env.development 로드
const prodKeys = require('fs').readFileSync('.env.production', 'utf8').split('\n')
  .map(l => (l.match(/^([A-Za-z_][A-Za-z0-9_]*)=/) || [])[1]).filter(Boolean)
const missing = prodKeys.filter(k => !(k in process.env))
if (missing.length) process.exit(2)                                     // 운영 값 혼입 방지
Object.assign(process.env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
  NEXTAUTH_URL: 'http://localhost:3100', NEXT_PUBLIC_APP_URL: 'http://localhost:3100' })
const [cmd, ...args] = process.argv.slice(2)
process.exit(spawnSync(cmd, args, { stdio: 'inherit', env: process.env }).status ?? 1)
```

`/api/health` → `healthy` (dev DB 연결 확인). 공유 페이지 측정용 데이터: dev DB의 공개 위시리스트 `/w/a87rzv5d6a`(아이템 6개).

## 7. Lighthouse

도구: `npx -y lighthouse@12` (package.json 미추가), 설치된 Chrome headless. 카테고리 점수 = 성능 / 접근성 / 권장사항 / SEO.

| 페이지 | 모바일 | LCP · TBT · CLS (모바일) | 데스크톱 | 감점 항목 |
|---|---|---|---|---|
| 랜딩 `/kr` | **95 / 100 / 100 / 100** | 2.9s · 10ms · 0 | 100 / 100 / 100 / 100 | — |
| 로그인 `/kr/login` | **96 / 98 / 100 / 100** | 2.7s · 20ms · 0 | 100 / 98 / 100 / 100 | heading-order |
| 요금제 `/kr/pricing` | **98 / 88 / 100 / 100** | 2.5s · 10ms · 0 | 100 / 88 / 100 / 100 | button-name, color-contrast, heading-order |
| 공유 `/w/a87rzv5d6a` | **83 / 88 / 100 / 82** | **4.7s** · 50ms · 0 | 100 / 88 / 100 / 82 | **document-title 없음, html-has-lang 없음, meta-description 없음**, heading-order |

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npx -y lighthouse@12 <URL> [--preset=desktop] \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=<file>.json --chrome-flags="--headless=new" --quiet
```

해석: 정적 페이지는 이미 높다. **공유 페이지가 가장 약하다** — 서비스 핵심 화면인데 `<title>`·`lang`·메타 설명이 없고(링크 미리보기 부재와 같은 원인), 클라이언트 렌더라 모바일 LCP 4.7s. Lighthouse 접근성 점수는 자동 검사 범위만이며, AUDIT H9(키보드·모달·라벨)는 로그인 화면에 몰려 있어 이 점수에 반영되지 않았다.

## 8. 스크린샷

`audit/screenshots/before/` — **git 미추적**(`.gitignore`). dev DB 테스트 데이터에 토큰·이메일로 보이는 이미지가 포함돼 있어 커밋하지 않는다. **전후 비교(마지막 단계 /baseline·README)에 쓴 뒤 삭제한다**(사용자 지시 2026-09-27).

도구: `npx -y playwright@1 screenshot --channel chrome --full-page --wait-for-timeout 2500 --viewport-size <W,H> <URL> <file>` (브라우저 다운로드 없이 설치된 Chrome 사용). 데스크톱 1440×900 / 모바일 390×844.

| 화면 | 파일 | 촬영 |
|---|---|---|
| 랜딩 kr / en / jp | `landing-{kr,en,jp}-{desktop,mobile}.png` | ✅ |
| 로그인 | `login-*.png` | ✅ |
| 요금제 | `pricing-*.png` | ✅ |
| 공지 | `notices-*.png` | ✅ |
| 공개 위시리스트 | `shared-wishlist-*.png` | ✅ — 제목·사용자명이 배경과 대비 부족으로 거의 안 보임 |
| 404 | `404-*.png` | ✅ — 프레임워크 기본 흰 화면(앱 테마와 무관) |
| 내 위시리스트 목록 / 생성 / 상세 / 꾸미기 / 프로필 / 통계 / 관리자 | — | ❌ Google 로그인만 있어 테스트 계정 없음 (미결) |

## 9. 실행하지 못한 항목

| 항목 | 이유 | 필요한 것 |
|---|---|---|
| 커버리지 | `@vitest/coverage-v8` 미설치 (설치 = lock 변경) | 리뉴얼 환경 단계에서 도입 |
| 로그인 필요 화면 스크린샷·Lighthouse | Google OAuth만 존재, 테스트 계정 없음 | 방법 결정 필요 (worklog 미결) |
