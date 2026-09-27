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

## 6. 실행하지 못한 항목

| 항목 | 이유 | 필요한 것 |
|---|---|---|
| Lighthouse (성능·접근성) | 도구가 package.json에 없음. `npx lighthouse` 1회 실행은 승인 필요 | 승인 시: 더미 env 프로덕션 빌드 + `next start` 로 **DB 불필요한 정적 페이지**(랜딩·로그인·요금제) 측정 가능 |
| 스크린샷 (`audit/screenshots/before/`) | Playwright 등 도구 없음. npx 1회 실행 승인 필요 | 정적 페이지는 위와 같이 가능. 로그인·데이터 화면은 **DB가 운영이 아님이 확인되고 테스트 계정이 있을 때만** |
| 커버리지 | `@vitest/coverage-v8` 미설치 (설치 = lock 변경) | 리뉴얼 환경 단계에서 도입 |
| 런타임 기능 확인 | dev 서버는 `.env.development` DB에 연결됨. 그 DB가 운영인지 미확인 | AUDIT Q2 답변 |

### 스크린샷 대상 화면 목록 (승인 후 촬영)

| 화면 | DB 필요 | 로그인 필요 |
|---|---|---|
| 랜딩 `/kr` (+ `/en`, `/jp`) | ✗ | ✗ |
| 로그인 `/kr/login` | ✗ | ✗ |
| 요금제 `/kr/pricing` | ✗ | ✗ |
| 공지 `/kr/notices` | ✓ | ✗ |
| 내 위시리스트 목록 | ✓ | ✓ |
| 위시리스트 생성 (메타데이터 추출 상태 포함) | ✓ | ✓ |
| 위시리스트 상세·편집 | ✓ | ✓ |
| 꾸미기 | ✓ | ✓ |
| 프로필 | ✓ | ✓ |
| 공개 위시리스트 `/w/<id>` | ✓ | ✗ |
| 관리자 대시보드 | ✓ | ✓ (admin) |
| 404 (기본 화면) | ✗ | ✗ |
