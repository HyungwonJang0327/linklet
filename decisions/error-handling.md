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

- `message`: 개발자용 영어. **화면에 표시하지 않는다**
- 응답은 공용 헬퍼로만 만든다. Route Handler에서 `NextResponse.json({ error: ... })` 를 직접 쓰지 않는다

### E2. 예상된 실패 / 예상 못한 실패

- 예상된 실패: 서비스가 `AppError(code, status, details?)` 를 throw
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
- 무료 한도 (Developer 플랜, 2026-09-27 확인): 사용자 1명, 에러 5천 건/월, 스팬 500만/월, 리플레이 50회/월, 보관 30일 — https://sentry.io/pricing/
- 버전: `@sentry/nextjs` 11.x (peer: next ^14 · ^15 · ^16)

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
