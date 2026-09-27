# 정상 API 응답 형태와 입력 검증 (v2)

에러 응답과 한 쌍이다 → `decisions/error-handling.md` E1.

## 결정

### 응답 형태

모든 API 응답은 둘 중 하나다.

```ts
// 성공
{ data: T }                                   // 단일 리소스
{ data: T[]; nextCursor: string | null }      // 목록
// 실패
{ error: { code; message; details? } }        // error-handling.md E1
```

| # | 항목 | 결정 |
|---|---|---|
| R1 | 목록 | `{ data: T[], nextCursor }` 로 감싼다. 다음 페이지가 없으면 `nextCursor: null` |
| R2 | 페이지네이션 | **커서 방식 하나로 통일**. 위시리스트(상한 20)·아이템(상한 100)은 한 번에 반환(`nextCursor: null`), 관리자 목록은 커서 + "더 보기". `limit` 은 서버가 상한을 둔다 |
| R3 | 단일 리소스 | `{ data: T }` 로 감싼다 |
| R4 | 빈 결과·없음 | 목록은 항상 빈 배열(`null` 금지). 단일 리소스가 없으면 `404 NOT_FOUND` |
| R5 | 삭제 | `204 No Content`, 본문 없음 |
| R6 | 값 없는 필드 | 생략하지 않고 `null` 로 명시 |
| R7 | id | 문자열. 생성 방식(cuid2 / UUID v7)은 스키마 작업 시 Prisma 7·Better Auth 문서 확인 후 결정 |
| R8 | 공유 URL 값 | 위시리스트 PK와 별도인 **공유 전용 ID**(추측 어려운 10~12자). URL은 `/w/{shareId}`. 재발급으로 옛 링크 무효화 가능. 저장값에 경로 접두사를 넣지 않는다 |
| R9 | 날짜 | ISO 8601 UTC 문자열 그대로 (고정 규약). 서버에서 자르거나 지역 시간으로 포맷하지 않는다 |

응답은 공용 헬퍼(`ok(data)`, `list(data, nextCursor)`, `noContent()`)로만 만든다.

### 입력 검증

| # | 항목 | 결정 |
|---|---|---|
| V1 | 스키마 위치 | `src/features/{x}/schema.ts` 의 Zod 스키마 하나를 클라이언트 폼과 서버가 같이 쓴다. 도메인 무관 규칙(URL·이메일 등)은 `src/shared/lib/` 의 스키마 조각으로 한 번만 정의 |
| V2 | 검증 지점 | Route Handler가 body·query·params를 Zod로 파싱한 뒤 서비스를 호출. 서비스는 검증된 타입만 받는다. 실패 시 `400 VALIDATION_FAILED` + `details[{ path, code }]` |
| — | 환경변수 | `src/shared/config/env.ts` Zod 스키마로 부팅 시 검증 (F01) |

## 이유

- 현재 성공 응답이 배열·`{qnas}`·`{qna}`·`{success:true}`·`{message}` 로 제각각이고, 페이지네이션 없이 `take: 20`, 관리자 목록은 `limit` 상한 없음
- `{ data } | { error }` 두 형태로 고정하면 프론트 fetch 클라이언트 하나가 모든 응답을 처리한다
- 목록을 처음부터 감싸면 페이지네이션 추가 시 계약이 바뀌지 않는다
- 공유 전용 ID는 PK 노출을 막고, 기존 `w/` 접두사 저장 버그(AUDIT H1)의 원인인 "경로를 값에 섞기"를 없앤다
- 검증 스키마 공유는 `isValidUrl` 5벌 같은 중복(AUDIT M3)을 구조로 막고, 서버 검증 누락(productUrl scheme 등)을 없앤다

## 기각된 대안

- 목록을 배열 그대로 — 페이지네이션 추가 시 모든 소비자 수정
- 오프셋 페이지네이션 / 혼용 — 규칙이 둘이 됨. 이 앱에 페이지 번호 UI가 필요한 화면 없음
- 단일 리소스 객체 그대로 — 성공/실패 판별 규칙이 둘이 됨
- 삭제 시 `{ data: { id } }` — 클라이언트가 이미 id를 알고 있음
- 필드 생략 — 타입이 `undefined | null` 로 흐려짐
- PK를 공유 URL로 — 재발급 불가, PK 노출
- 검증을 서버에만 / 각자 따로 — 폼 즉시 피드백 불가 / 규칙 중복

## 확장 지점

새 API는 `features/{x}/schema.ts` 에 입력 스키마를 추가하고 공용 응답 헬퍼로 `{ data }` 만 반환한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
