# 기존 앱 기준선 실행 환경

기존 앱(루트, 동결)을 **로컬 전용 Postgres**로 띄워 기준선 E2E의 대상으로 삼는다. 근거: `decisions/testing.md` T7·T8, `audit/BASELINE.md` §6.

**로컬 전용 · CI 제외.** 루트 앱 파일은 수정하지 않는다.

## 실행

```bash
# 사전: Docker Desktop 실행 중, 루트 node_modules (없으면 스크립트가 npm ci), chromium (pnpm exec playwright install chromium)
cd v2
pnpm baseline:up          # 컨테이너 기동 → db push → 시드(seed.sql) → next build → next start -p 3001 → /api/health healthy
pnpm test:e2e:baseline    # = BASELINE=1 playwright test --project=baseline  (e2e/baseline/**/*.spec.ts 만)
pnpm baseline:seed        # 재시드 — seed.sql 을 다시 흘린다 (멱등, 테스트가 데이터를 바꿨을 때)
pnpm baseline:down        # 서버 종료 → 컨테이너·볼륨 삭제 → .next 원복
```

### Playwright `baseline` project (`v2/playwright.config.ts`)

- `BASELINE=1` 이면 project 목록이 `baseline` 하나(baseURL `http://localhost:3001`, Desktop Chrome)로 바뀌고 `webServer` 가 꺼진다. 기준선 서버는 config 가 띄우지 않으므로 `pnpm baseline:up` 이 선행 조건이다.
- 기본 `pnpm test:e2e`(chromium project)는 `**/baseline/**` 을 `testIgnore` 로 제외한다 — 기준선 spec 이 v2 E2E 결과에 섞이지 않는다 (T7).
- `CI` 환경변수가 있으면 `BASELINE=1` 이어도 기준선 project 를 만들지 않는다 (로컬 전용, T8).
- **User-Agent**: 기존 앱 공유 API(`/api/wishlists/share/{id}`)는 비브라우저 UA(`curl`·`python`·`bot` 등)에 403 을 돌려준다(`lib/rate-limit.ts` `isLikelyBot`). `baseline` project 의 `use` 에 Desktop Chrome 디바이스를 넣었고, Playwright 는 `page` 뿐 아니라 **`request` fixture 에도 같은 `userAgent`·`baseURL` 을 적용**하므로(`runBeforeCreateRequestContext` 가 `use` 옵션을 병합) 이후 spec 이 API 를 직접 쳐도 403 을 받지 않는다. 비브라우저 UA 동작을 고정하려면 `request.get(url, { headers: { 'user-agent': 'curl/8.0' } })` 처럼 요청마다 덮어쓴다.

| 항목           | 값                                                                           |
| -------------- | ---------------------------------------------------------------------------- |
| 기존 앱        | `http://localhost:3001` (`BASELINE_APP_PORT`)                                |
| DB 컨테이너    | `linklet-baseline-db` (`postgres:17-alpine`, tmpfs — 내려가면 데이터 소멸)   |
| DB 호스트 포트 | `127.0.0.1:54329` — v2 로컬 DB(5432/5433 예정)와 겹치지 않게                 |
| DB 접속 정보   | `baseline` / `baseline` / `linklet_baseline` — 로컬 더미 고정값(시크릿 아님) |
| 서버 로그·PID  | `.run/server.log`, `.run/server.pid` (git 제외)                              |

## 파일

| 파일                                                | 역할                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `docker-compose.baseline.yml`                       | 기준선 전용 Postgres. 프로젝트명 `linklet-baseline` 로 v2 DB와 분리                                         |
| `with-baseline-env.mjs`                             | 기존 앱 env 래퍼. 루트 Node 로 실행, 의존성 없음                                                            |
| `run-baseline.sh` / `stop-baseline.sh`              | 기동·정리. `lib.sh` 는 공통 상수                                                                            |
| `seed.sql` / `seed-baseline.sh`                     | 시드 데이터(T9)와 psql 실행 스크립트. `baseline:up` 이 호출, 단독은 `baseline:seed`                         |
| `smoke.spec.ts` / `public.spec.ts` / `auth.spec.ts` | 기준선 spec — 스모크 3건, 비로그인 흐름 12건, 로그인 흐름 16건 (아래 "테스트 목록")                         |
| `helpers.ts`                                        | 세션 쿠키 주입(`signInWithSeedSession`)·API 헤더(`sessionHeaders`). spec 이 아니라 project 에 잡히지 않는다 |

## 운영·dev DB에 절대 붙지 않는 이유 (가드)

기존 앱의 `next build/start` 는 루트 `.env.production`·`.env.development` 를 **자동 로드**한다. 그대로 띄우면 운영·dev(Neon) 값이 섞인다. `with-baseline-env.mjs` 가 모든 명령(`prisma db push`·`next build`·`next start`) 앞에서 다음을 보장한다.

1. **키 전부 덮어쓰기** — `scripts/check-env.js` 의 필수 13개 + 코드가 참조하는 키 + 루트 `.env*` 파일에 있는 **키 이름 전부**(값은 읽지 않음)를 로컬·더미 값으로 지정한다. `DATABASE_URL` 등 접속 문자열은 코드에서 조립하며, 그 외는 `baseline-dummy`.
2. **Next 로더로 혼입 검사** — `@next/env` 의 `loadEnvConfig` 는 이미 `process.env` 에 있는 키를 덮지 않고, 파일에서 실제 적용한 키만 돌려준다. production·development 두 모드를 모두 로드해 적용된 키가 하나라도 있으면 종료(exit 2). 파일에 있는데 래퍼가 모르는 키가 생겨도 종료.
3. **최종 env 검사** — `DATABASE_URL` 호스트가 `localhost|127.0.0.1`, 포트가 `54329` 가 아니면 종료. 모든 env 값에 `neon.tech`·`amazonaws.com` 등 원격 호스트 문자열이나 기준선이 아닌 `postgres://` 접속 문자열이 있으면 종료. 검사 결과는 **키 이름만** 출력한다.
4. `prisma db push` 는 이 컨테이너에서만 허용하는 예외다(T8). 위 가드가 통과한 env 에서만 실행된다.

가드 동작 확인:

```bash
cd <repo root>
node v2/e2e/baseline/with-baseline-env.mjs --check                     # 통과
BASELINE_DB_PORT=5432 node v2/e2e/baseline/with-baseline-env.mjs --check  # 종료 코드 2
```

## 알아둘 것

- `.next`: 빌드 전에 기존 `.next` 가 있으면 `.run/next-backup` 으로 옮기고, `down` 에서 기준선 빌드를 지운 뒤 원복한다 (`next.config.ts` 를 바꿀 수 없어 `distDir` 분리는 하지 않음).
- 데이터는 `seed.sql` 이 넣는다(아래). 로그인은 시드한 `sessions` 행 + `next-auth.session-token` 쿠키 주입(T8).
- 교체 시점에 기존 앱과 함께 정리한다(T7).

## 시드 데이터 (`seed.sql`, `decisions/testing.md` T9)

`docker compose exec -T db psql … < seed.sql` 로 흘린다. 한 트랜잭션에서 `TRUNCATE users·wishlists·wishlist_items·sessions·accounts CASCADE` 후 INSERT 라 몇 번 실행해도 같은 상태(멱등)다. 값은 전부 더미·고정값이고 spec 이 그대로 단언한다.

| 테이블           | id                          | 핵심 값                                                                                                                                               |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`          | `baseline-user`             | `name` Baseline Tester · `email` baseline@example.com · `locale` kr · `isAdmin` false — 읽기 전용 시나리오(아래 위시리스트 2개 소유)                  |
| `users`          | `baseline-editor`           | `name` Baseline Editor · `email` baseline-editor@example.com · 위시리스트 0개 — `auth.spec.ts` 의 생성·수정·삭제 전용(아래 "사용자를 둘로 나눈 이유") |
| `wishlists`      | `baseline-wishlist-public`  | `title` Baseline Public Wishlist · `description` 기준선 공개 위시리스트 · `shareUrl` **`baseline-public`** · `isPublic` true · `customization` NULL   |
| `wishlists`      | `baseline-wishlist-private` | `title` Baseline Private Wishlist · `shareUrl` **`baseline-private`** · `isPublic` false                                                              |
| `wishlist_items` | `baseline-item-1`           | Baseline Item 1 - Headphones · `₩129,000` · `https://example.com/products/headphones` · `/globe.svg` · priority 0                                     |
| `wishlist_items` | `baseline-item-2`           | Baseline Item 2 - Keyboard · `$89.00` · `https://example.com/products/keyboard` · 이미지 없음 · priority 1                                            |
| `wishlist_items` | `baseline-item-3`           | Baseline Item 3 - Mug · `¥1,500` · `https://example.com/products/mug` · `/file.svg` · priority 2 · **`isCompleted` true**                             |
| `sessions`       | `baseline-session`          | `sessionToken` **`baseline-session-token`** · `userId` baseline-user · `expires` 2099-01-01 (`auth.spec.ts` 가 `next-auth.session-token` 쿠키로 주입) |
| `sessions`       | `baseline-editor-session`   | `sessionToken` **`baseline-editor-session-token`** · `userId` baseline-editor · `expires` 2099-01-01                                                  |

- **시드 시점 — `baseline:up` 의 db push 직후** (Playwright `globalSetup` 아님). 이유: 테스트 실행과 분리돼 `baseline:up` 뒤 psql 로 바로 상태를 확인할 수 있고, 재시드가 `baseline:seed` 한 줄이다. `globalSetup` 에 두면 spec 을 돌릴 때마다 Docker 가 필요하고 `--list` 같은 보조 명령도 시드를 타게 된다.
- **shareUrl 에 `w/` 접두사 없음** — 기존 앱의 H1 버그(`createWishlist` 가 `w/<cuid>` 로 저장)는 재현하지 않는다. `lib/db/wishlist.ts` `getWishlistByShareUrl` 은 경로 파라미터를 그대로 `findUnique({ where: { shareUrl } })` 하므로 접두사 없는 값이 `/w/baseline-public` 으로 열린다 (실측: 공유 페이지·공유 API 모두 200).
- `customization` NULL 이면 공유 페이지가 기본값을 써서 `displayName` 대신 위시리스트 제목을 h1 로 보여 준다. `updatedAt` 은 `@updatedAt` 이라 DB 기본값이 없어 SQL 에서 명시한다.
- 이미지는 기존 앱 `public/` 의 svg 를 가리켜 외부 네트워크를 타지 않는다.
- **사용자를 둘로 나눈 이유** — 위시리스트 한도가 사용자당 2개(`APP_CONFIG.maxWishlistsPerUser.free`)라 `baseline-user` 로는 생성이 403 이고, spec 파일은 병렬 워커로 돌기 때문에 `auth.spec.ts` 가 `public.spec.ts` 가 단언하는 시드 행을 지우거나 재시드(TRUNCATE)해서는 안 된다. `baseline-editor` 는 자기 위시리스트만 만들고 지우며, `auth.spec.ts` 의 `beforeAll` 이 editor 소유 위시리스트를 API 로 전부 지워 재실행 독립성을 확보한다 (재시드 불필요).
- **로그인 방식(실측)** — 기존 앱은 `session.strategy: 'database'` 라 쿠키 값이 곧 `sessions.sessionToken` 이고 PrismaAdapter 가 그 값으로 사용자를 찾는다. 기준선은 http 라 쿠키 이름이 `next-auth.session-token`(운영 https 는 `__Secure-` 접두사). `helpers.ts` 가 `context.addCookies` 로 주입한다.

## 테스트 목록

| 파일             | 테스트                                                                                         | FEATURES        |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| `smoke.spec.ts`  | `/api/health` healthy · `/` → `/kr` 307 · `/kr` 200                                            | —               |
| `public.spec.ts` | `/kr` 랜딩: `lang=kr`·title·헤더(로고·공지사항·로그인 링크)·h1·CTA(`/kr/settings`·`/kr/login`) | F03 · F05       |
| `public.spec.ts` | `/w/baseline-public`: 제목·설명·"3 아이템"·상품 링크 3개(href·target·h3·가격, priority 순)     | F23 · F24 · F25 |
| `public.spec.ts` | 받음(isCompleted) 아이템도 구분 없이 똑같은 상품 링크로 노출                                   | F24 · F16       |
| `public.spec.ts` | 공유 페이지 `<title>` 빈 문자열 · `<html lang>` 없음                                           | F24 · F03       |
| `public.spec.ts` | 비공개 `/w/baseline-private`: HTTP 200 + "비공개 위시리스트" 안내, 아이템 링크 0               | F15 · F24       |
| `public.spec.ts` | 없는 `/w/does-not-exist`: HTTP 200 + Next 기본 404 화면(h1 "404", title "404: …")              | F24 · F06       |
| `public.spec.ts` | 공유 API 200: 아이템 3개·`isCompleted`·**소유자 `user.email` 포함(H3)**                        | F24 · F16       |
| `public.spec.ts` | 비공개 공유 API 403 `{ error: 'This wishlist is private' }`                                    | F15 · F24       |
| `public.spec.ts` | 공유 API 비브라우저 UA(`curl/8.0`) 403                                                         | F24             |
| `public.spec.ts` | 비로그인 `GET /api/wishlists` 200, 공개 목록에 `baseline-public` 포함·`baseline-private` 제외  | F13 · H4        |
| `public.spec.ts` | `/nope` 404                                                                                    | F06             |
| `public.spec.ts` | `/login` 404(알려진 버그) · `/kr/login` 200                                                    | F08             |

| `auth.spec.ts` | 비로그인 `/kr/settings`·`/kr/settings/wishlists` → `/kr/login` 307, 로그인 화면(Google 버튼) | F09 |
| `auth.spec.ts` | sessions 에 없는 토큰 쿠키: 미들웨어 통과(200) + 클라이언트 가드 "로그인이 필요한 페이지입니다." | F09 · F13 |
| `auth.spec.ts` | 비로그인 `GET /api/wishlists?userId=`·`POST /api/wishlists` 401 | F13 · H4 |
| `auth.spec.ts` | 시드 세션 쿠키 → `/api/auth/session` 이 baseline-user 반환 (DB 세션 조회 성공) | F08 |
| `auth.spec.ts` | 로그인 상태 `/kr/settings` → `/kr/settings/wishlists` | F09 |
| `auth.spec.ts` | 목록에 시드 위시리스트 2개(제목·아이템 수·공개/비공개 배지) | F13 |
| `auth.spec.ts` | 한도 2개: 생성 버튼은 토스트만, `POST` 403 `WISHLIST_LIMIT_REACHED` | F39 · F14 |
| `auth.spec.ts` | (editor) 빈 목록 — "아직 생성된 위시리스트가 없습니다" + 생성 카드 | F13 |
| `auth.spec.ts` | (editor) 생성 페이지 제목만 제출 → "상품 URL을 한 개 이상 입력해주세요." (링크 필수·자동 추출 필수라 UI 생성 불가) | F14 |
| `auth.spec.ts` | (editor) `POST /api/wishlists` 201: `shareUrl` **`w/<cuid>`**(H1)·`user.email`(H3)·기본 customization → 목록·상세 반영 | F14 · F15 · F23 |
| `auth.spec.ts` | (editor) 아이템 추가 다이얼로그(제목·URL 수동, `/api/metadata` 는 브라우저에서 차단) → 그리드 "아이템 목록 (1/1)" | F19 |
| `auth.spec.ts` | (editor) 카드 → 상세 다이얼로그 → 편집: 제목·가격("129000"→"129,000", 카드 "129,000원") 반영 | F21 |
| `auth.spec.ts` | (editor) 받음 체크박스(title "받음 처리"→"받음 취소"): 취소선·받음 비율 100%·API `isCompleted` | F21 · F16 |
| `auth.spec.ts` | (editor) 아이템 삭제: native `confirm` "이 아이템을 삭제하시겠습니까?" → 빈 상태 | F21 · H9 |
| `auth.spec.ts` | (editor) 공유 링크 복사 = `/w/w/<cuid>` → 404 · `/w/<cuid>` 200+404 화면 · 공유 API `w%2F<cuid>` 로만 200 | F23 · F25 · H1 |
| `auth.spec.ts` | (editor) 목록 휴지통 → confirm 문구가 치환 안 된 `"{title}" 위시리스트를 삭제하시겠습니까?` → 빈 상태 | F17 · H9 |

모두 **현재 동작 고정**이다. v2 가 바꾸는 항목(비공개·없는 shareUrl 404, 이메일 제거, 서버 렌더 title/lang, 비로그인 API 401, 받음 표시)은 각 테스트 주석에 적었다.

- 공유 페이지는 `navigator.language` 로 사전을 고르므로 spec 이 `test.use({ locale: 'ko-KR' })` 로 고정한다.
- 공유 API 는 IP·shareUrl 당 **1분 10회** 제한(서버 메모리). `public.spec.ts` 는 실행당 `baseline-public` 에 4회 요청하므로 1분 안에 2회까지 안전, 3회째부터 429 가 날 수 있다 — 1분 뒤 다시 돌린다 (`baseline:down`/`up` 으로 서버를 재시작해도 초기화). `auth.spec.ts` 는 새로 만든 shareUrl 키로만 요청해 이 집계에 더해지지 않는다.
- `auth.spec.ts` 가 아이템을 추가·수정·삭제할 때 기존 앱이 ISR 재검증으로 `http://localhost:3000/api/revalidate` 에 POST 한다(`lib/revalidation.ts`, `VERCEL_URL` 없을 때 고정값). 기준선에서는 연결 실패를 로그만 남기고 삼키지만, 3000 에 다른 앱이 떠 있으면 더미 secret 으로 그 앱이 POST 를 받는다.
