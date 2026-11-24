# 에러 처리 (v2)

## 결정

### E1. API 에러 응답 스키마

```ts
// HTTP 상태 코드 + 본문
{ error: { code: ErrorCode; message: string; details?: FieldError[] } }
type FieldError = { path: string; code: string }   // 검증 실패 시 필드별
```

- `code`: 영어 대문자 상수. 초기 목록

| code | HTTP | 의미 | 재시도 |
|---|---|---|---|
| `VALIDATION_FAILED` | 400 | 입력 검증 실패 (`details` 포함) | ✗ |
| `UNAUTHENTICATED` | 401 | 로그인 필요 | ✗ |
| `FORBIDDEN` | 403 | 권한 없음 | ✗ |
| `NOT_FOUND` | 404 | 없음 (타인 비공개 리소스도 존재를 숨기기 위해 404) | ✗ |
| `CONFLICT` | 409 | 상태 충돌 | ✗ |
| `LIMIT_REACHED` | 422 | 남용 방지 상한 도달 (F39) | ✗ |
| `RATE_LIMITED` | 429 | 요청 빈도 초과 | ✓ |
| `UPSTREAM_FAILED` | 502 | 외부 서비스 실패 (메타데이터 대상 사이트·저장소) | ✓ |
| `INTERNAL` | 500 | 예상 못한 실패 | ✓ |
| `UNAVAILABLE` | 503 | 서비스 일시 불가 — 헬스 체크(I01)가 DB 에 닿지 못할 때. 일반 API 는 DB 실패를 `INTERNAL` 로 둔다(서비스 계층이 DB 예외를 분류하지 않는다) | ✓ |

- `message`: 개발자용 영어. **화면에 표시하지 않는다**. 값은 코드 표의 **고정 문구뿐** — `AppError` 에 커스텀 문구 인자가 없다(2026-11-12, H8 재발 경로 차단). 맥락은 `details` 로만
- 응답은 공용 헬퍼로만 만든다. Route Handler에서 `NextResponse.json({ error: ... })` 를 직접 쓰지 않는다

### E2. 예상된 실패 / 예상 못한 실패

- 예상된 실패: 서비스가 `AppError(code, details?)` 를 throw (status 는 코드 표에서 자동)
- 예상 못한 실패: 그 외 모든 예외. 응답 헬퍼가 `500 INTERNAL` + 일반 메시지로 바꾸고, 로그(E5)를 남긴다. 원본 메시지·스택은 응답에 넣지 않는다
- 재시도 가능 여부는 응답 필드로 두지 않고 `code` 로 판단한다 (위 표). TanStack Query 재시도 정책이 이 표를 따른다

### E3. 사용자 문구

- 프론트가 `code` 를 i18n 키 `errors.{CODE}` 로 변환 (고정 규약: 화면 문구는 프론트에서 변환)
- 문장은 **다음에 할 수 있는 행동**을 알려준다. 예: "링크를 불러오지 못했어요. 주소를 확인하거나 직접 입력해 주세요"
- 내부 코드·스택·영어 원문 노출 금지. 키가 없으면 `errors.UNKNOWN` 일반 문구
- 검증 실패는 `details[].path` 로 해당 폼 필드 옆에 표시

### E4. 에러 경계

- 라우트 구간 단위: `app/global-error.tsx`, `app/[locale]/(app)/error.tsx`, `app/[locale]/admin/error.tsx`, `app/w/[id]/error.tsx`, 각 구간 `not-found.tsx`
- 데이터를 불러오는 목록·카드는 경계가 아니라 **화면 4상태의 에러 상태**(문구 + 다시 시도 버튼)로 처리
- 에러 경계 화면도 앱 테마·i18n 적용 (완료 기준 7)
- **F06 구현 결정 (2026-11-19)**:
  - 1차 경계는 `app/[locale]/not-found.tsx`·`app/[locale]/error.tsx`(root layout 안 — `I18nProvider`·토큰 적용, `retry()` 버튼). `(app)`·`admin`·`w/[id]` 구간 경계는 그 구간이 생길 때 같은 컴포넌트(`shared/ui/error-state`·`not-found-state`)를 재사용
  - `app/global-error.tsx`: root layout 자체가 깨졌을 때. 자체 `<html data-skin data-mode>`·`globals.css` 를 그리고 Provider 가 없으므로 사전 대신 **ko·en·ja 세 줄 고정 문구**(각 언어 사전의 같은 키 값을 import 해 쓴다 — 문구 이중화 금지)
  - **root 밖 경로(`/xx`·`/foo`)의 404 는 `experimental.globalNotFound: true` + `app/global-not-found.tsx`** (사용자 결정 2026-11-19. 기각: Next 기본 흰 404 유지 — 메인 추천이었으나 사용자가 모든 404 의 앱 테마 적용을 택함). 16.3 실험 플래그 — Next 업그레이드 때 플래그 이름·안정화 여부를 확인하는 항목을 `dependencies.md` 갱신 절차에 둔다. 헤더를 못 읽으므로 global-error 와 같은 세 줄 고정 문구. `[locale]/layout.tsx` 에 `dynamicParams = false` 를 둬 `/xx` 는 layout 실행 없이 이 화면으로
  - 렌더 에러 E2E: `app/[locale]/e2e/throw/page.tsx` 가 서버 env `LINKLET_E2E=1` 일 때만 throw, 아니면 `notFound()`(사용자 결정 2026-11-19. 기각: 컴포넌트 단위 테스트만 — 경계 연결을 확인 못 함). `__e2e` 는 Next private folder 라 라우팅에서 빠져 `e2e` 로 명명. `e2e/not-found/page.tsx` 는 항상 `notFound()`(`[locale]/not-found` E2E 용, 운영에서도 404 라 가드 불필요). env 스키마에 선택 키 `LINKLET_E2E`(`'1'` 만), Playwright webServer 만 켠다. CI·Vercel 에는 없다 → 운영에서는 404
  - **구현 실측(2026-11-19, Next 16.3.6)**: 플래그가 켜지면 **어느 라우트에도 매치되지 않는 URL 전부**(`/xx`·`/foo` 뿐 아니라 `/ko/없는-경로`·`/ja/nope` 포함)가 라우팅 단계에서 `global-not-found`(세 언어 고정, Topbar 없음, 정적 HTML)로 간다. `[locale]/not-found.tsx` 는 페이지가 `notFound()` 를 **명시적으로 호출**할 때만(존재하지 않는 리소스 id 등) 그려진다. `/{locale}/…` 도 언어별 404 로 만들려면 `[locale]/[...rest]` catch-all 이 필요한데 `/xx/nope` 가 `locale=xx` 로 매치돼 root layout 의 `notFound()` 가 경계 없이 던져져 빈 화면(H7 재발)이 되고 `dynamicParams=false` 와 충돌 — 채택하지 않음. 16.3.6 Turbopack 은 플래그 없이도 파일 규약을 적용하지만 문서대로 켜 둔다. `notFound()`·throw 응답의 서버 HTML 은 Next 가 `__next_error__` 껍데기 + RSC 페이로드로 내려 JS 없으면 빈 화면(Next 동작, F23 공유 페이지 404 때 영향 검토)

### E5. 로그 — 구조화 로그 + Sentry 무료 플랜

- **예상 못한 실패에서만** 기록. 예상된 실패(`AppError`)는 기록하지 않는다
- 기록 지점: 응답 헬퍼(Route Handler), Server Component 데이터 로드, 에러 경계(클라이언트), 외부 fetch 실패
- 서버 구조화 로그(JSON 한 줄): `requestId`, `route`, `code`, `status`, 에러 이름·메시지·스택
- Sentry(`@sentry/nextjs`)로 같은 이벤트를 전송
  - `sendDefaultPii: false`, IP 주소 수집 끔
  - 세션 리플레이 **사용 안 함** (화면 녹화는 개인정보 위험 + 무료 50회)
  - 트레이스 샘플링은 낮게 시작 (무료 스팬 한도 안)
  - `beforeSend` 에서 요청 본문·쿠키·Authorization 헤더 제거
- **금지**: 이메일·이름·토큰·세션 ID·요청 본문·쿼리스트링 토큰을 어떤 로그·이벤트에도 남기지 않는다. 사용자 식별은 내부 ID만
- **구현 규칙** (2026-11-12, F01·F07 security-reviewer 반영): 로그 줄은 `shared/lib/log-format` 의 **허용 목록 키만**(`level·event·requestId·route·method·status·code·errorName·message·durationMs·stack·details·meta`) 담고, 모든 문자열 필드는 `shared/lib/redact` 를 거친다(접속 문자열·userinfo·JWT·Bearer/Basic·Cookie·민감어 키 값·이메일·URL 쿼리·32자+ 토큰). 로거는 **절대 throw 하지 않는다**. `AppError` 는 기록하지 않는다. 운영 콘솔에는 stack 을 넣지 않는다(Sentry 로만)
- **패턴으로 못 잡는 값은 종류로 통제한다**: `requestId` 는 서버가 만든 UUID 만(`x-request-id` 헤더 그대로 쓰지 않음) · 요청 검증 실패 `details` 는 로그에 넣지 않음 · 동적 URL 세그먼트에 이메일·이름을 쓰지 않음(url-design) · 한글 이름·전화·IP 는 애초에 로그 필드에 들어오지 않게
- **알려진 한계**: `/` 가 섞인 표준 base64 는 32자 미만 조각이면 남는다(`key=`·Bearer 규칙 밖에서 맨몸으로 찍힐 때). 32자 미만 토큰(`sk_live_`+22자 등)은 길이 규칙 밖 — 민감어 키 규칙에 의존
- 무료 한도 (Developer 플랜, 2026-09-27 확인): 사용자 1명, 에러 5천 건/월, 스팬 500만/월, 리플레이 50회/월, 보관 30일 — https://sentry.io/pricing/
- 버전: `@sentry/nextjs` 11.x (peer: next ^14 · ^15 · ^16)
- **Sentry 구현** (2026-11-23, F06 Sentry 연결 — @sentry/nextjs 11.16.0):
  - 초기화 세 파일 `src/instrumentation-client.ts`·`src/sentry.server.config.ts`·`src/sentry.edge.config.ts`(Sentry Next.js manual setup 규약). 서버는 `instrumentation.ts register()` 가 env 검증 뒤 동적 import, `onRequestError = Sentry.captureRequestError`
  - **`sendDefaultPii` 는 v11 에 없다** → `dataCollection: { userInfo:false, cookies:false, httpHeaders:false, httpBodies:[], urlQueryParams:false }` + 기본 통합 중 `Console`(구조화 로그 이중 전송)·`RequestData`(요청 데이터)·`BrowserTracing` 제거. 그 위에 `beforeSend`/`beforeBreadcrumb`(`shared/lib/sentry-scrub`, 순수·절대 throw 안 함)가 request 를 url(쿼리 제거)·method 만, user 를 id 만, exception value·message·breadcrumb 를 `redact()`, extra 삭제. 스크럽 실패 시 이벤트 폐기
  - 전송 지점: ① `server/logger.unexpected()` — 원본 error + 요청 컨텍스트 tags(route·requestId·method·status·durationMs), test 환경은 안 보냄 ② `onRequestError` ③ `[locale]/error.tsx`·`global-error.tsx` 의 `useEffect(captureException)`. AppError 는 ①에서 걸러져 안 간다
  - DSN 없으면 SDK 가 아무것도 보내지 않는다 — CI 빌드·E2E(`playwright.config.ts` 가 DSN 을 빈 값으로 덮는다)·DSN 없는 로컬이 분기 없이 같은 코드. `NEXT_PUBLIC_SENTRY_DSN` 은 **계속 optional — 결정 변경 확정**(원래 계획은 F06 때 필수화. 필수로 하면 CI·E2E 에 더미 DSN 이 필요하고 더미 호스트로 전송 시도가 생긴다 — 사용자 2026-11-23: 추천안(optional 유지) 선택). `shared/config/env.ts` 의 필수화 예정 목록에서 F06 제거
  - `environment` 는 NODE_ENV — 로컬 development 이벤트도 DSN 이 있으면 전송된다(Sentry 에서 environment 로 구분)
  - **트레이싱 끔 — 결정 변경** ("트레이스 샘플링은 낮게 시작" → 사용 안 함): 사용자가 Sentry 프로젝트 생성 때 Error Monitoring 만 선택(2026-11-23), 끔 유지는 추천안대로 확정(사용자 2026-11-23). `tracesSampleRate` 미설정 + BrowserTracing 제거 + `bundleSizeOptimizations.excludeTracing`. 나중에 켜려면 세 곳을 되돌린다
  - 빌드 플러그인 `withSentryConfig`: telemetry 끔, 소스맵 업로드는 `SENTRY_AUTH_TOKEN` 있을 때만(org·project 슬러그는 그때, todo/user-todo.md). 클라이언트 번들 +64 KB gzip(dependencies.md)

### E6. 에러 로그 기능(F38) — 삭제

- ErrorLog 테이블·관리자 에러 화면·`logError` 는 v2로 옮기지 않는다. E5(Sentry)가 대체

## 이유

- 현재 에러 응답 형태 6종 이상, 내부 에러 메시지 노출(`details: error.message`), 예상/예상 못한 실패 구분 없음, 에러 경계 없음(프레임워크 기본 흰 화면), 기록되지 않는 ErrorLog — AUDIT H7·H8, M-규약 위반
- 코드 기반 응답은 프론트 분기·i18n 변환·재시도 정책을 한 표로 묶는다
- Vercel Hobby 로그는 보관 기간이 짧아 운영 에러를 놓칠 수 있다 → Sentry 무료 플랜으로 30일 보관(사용자 선택)
- ErrorLog를 DB에 쌓으면 Neon 무료 0.5GB를 소모한다

## 기각된 대안

- E1: RFC 9457 problem+json — 표준이지만 필드가 많고 이 앱의 소비자는 자체 프론트뿐 / `{ success:false, error }` — 성공 응답까지 감싸야 해서 정상 응답 형태 결정과 얽힘
- E2: `Result` 타입 반환 — 호출부마다 분기 코드가 늘어남
- E4: 섹션 단위 경계 남발 — 4상태 에러 상태와 역할 중복 / 앱 전체 하나 — 공유 페이지 에러가 앱 전체를 무너뜨림
- E5: 구조화 로그만 — 추천안이었으나 보관 기간 문제로 사용자가 Sentry 추가 선택 / DB ErrorLog — 용량 소모, 한 번도 동작하지 않음

## 확장 지점

새 실패 유형은 에러 코드 목록(한 파일)에 상수 하나 + 3개 언어 사전에 `errors.{CODE}` 문구 하나를 추가한다. 로그 수단 교체는 로거 모듈 한 곳.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: E5만 Sentry 추가, 나머지 추천대로)
- 2026-11-12 E1 message 고정 문구화, E2 `AppError(code, details?)` 시그니처 (security-reviewer F07 지적 → 사용자: message 인자 제거 추천안. 기각: 린트+런타임 가드 3겹)
- 2026-11-12 E5 구현 규칙·종류 통제·알려진 한계 추가 (security-reviewer F01 검토)
- 2026-11-15 E1 에 `UNAVAILABLE` 503 추가 — 헬스 체크 I01 실패 응답 (사용자: 503 신설. 기각: DB 예외를 그대로 throw 해 `500 INTERNAL` — 코드 추가 없이 끝나지만 HTTP 의미론상 503 이 정확)
- 2026-11-19 E4 F06 구현 결정 — `globalNotFound` 실험 플래그(사용자: 플래그 켜기. 기각: Next 기본 404 유지 — 추천안), 렌더 에러 E2E 는 env 가드 테스트 전용 라우트(사용자: 추천안)
- 2026-11-23 E4 에 **401·403 화면** 추가(F09) — `[locale]/unauthorized.tsx`(비로그인, 제자리 로그인 안내)·`[locale]/forbidden.tsx`(비관리자). `experimental.authInterrupts`. 규칙은 `authorization.md` P7. 사용자 질문 "에러 경계에 왜 404·500 뿐인가, 401·503 도" → 401·403 은 F09 에서 추가. **503 페이지(점검 화면)는 결정된 적 없음** — 2026-11-15 의 503 은 `/api/health` 응답 코드. 페이지 렌더 중 DB 실패는 E1 대로 500 경계. 점검 화면이 필요하면 Phase 5 첫 배포 전에 결정(todo/mvp-todo). 네트워크 실패(응답 없음)와 서버 5xx 를 구분하는 문구는 fetch 클라이언트가 생길 때 클라이언트 전용 코드 `NETWORK` 로(todo/migrator-todo Phase 3)
- 2026-11-23 E5 Sentry 구현 메모 — dataCollection(sendDefaultPii 대체)·통합 제거·스크럽 2겹·전송 지점 3곳. **트레이싱 끔(결정 변경)**·DSN optional 유지 — 사용자: 추천안대로 확정. 수신 확인: 로컬 운영 빌드의 `e2e: intentional render error` 가 Sentry Issues 에 도착(알림 수신)
