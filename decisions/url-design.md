# URL 설계와 하위 호환 (v2)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| U1 | API 경로 | 복수형 명사 + 케밥 케이스. 동사 경로 금지. 부분 수정은 `PATCH`, 순서처럼 집합 교체는 `PUT` |
| U2 | 페이지 경로 | 아래 표 |
| U3 | 언어 코드 | `ko` · `en` · `ja` (ISO 639-1). 기본 `ko` |
| U4 | 화면 상태 | 필터·정렬·탭은 URL 쿼리(새로고침·링크 공유 시 유지). 모달 열림·입력 중 값은 로컬 상태 |
| H1 | 하위 호환 | 두지 않는다. 기존 URL(`/kr/*`, `/jp/*`, `/{locale}/settings/wishlists/*`)·API 리다이렉트 없음 |

### 페이지 경로

| 경로 | 화면 (FEATURES) |
|---|---|
| `/` | 브라우저 언어에 맞는 `/{locale}` 로 이동 (F05) |
| `/{locale}` | 랜딩 |
| `/{locale}/login` | 로그인 (F08) |
| `/{locale}/wishlists` | 내 위시리스트 목록 (F13) |
| `/{locale}/wishlists/new` | 생성 (F14) |
| `/{locale}/wishlists/{id}` | 상세·편집 (F17·F21·F22) |
| `/{locale}/wishlists/{id}/customize` | 꾸미기 (F27) |
| `/{locale}/settings/profile` · `appearance` · `sessions` | 프로필·화면 설정·세션 (F28·F29·F32) |
| `/{locale}/help` | 사용자 문의 (F30) |
| `/{locale}/notices` | 공지 (F31) |
| `/{locale}/admin` · `/admin/notices` · `/admin/inquiries` · `/admin/users` | 관리자 (F33~F37) |
| `/w/{shareId}` | 공유 페이지 — 언어 경로 없음, Accept-Language로 표시 언어 결정 (F23·F24) |

### API 경로 (주요)

| 메서드 · 경로 | 용도 |
|---|---|
| `GET·POST /api/wishlists` | 내 목록 · 생성 |
| `GET·PATCH·DELETE /api/wishlists/{id}` | 상세 · 수정 · 삭제 |
| `POST /api/wishlists/{id}/items` | 아이템 추가 |
| `PUT /api/wishlists/{id}/items/order` | 순서 변경 (`{ itemIds }`) |
| `PATCH·DELETE /api/items/{id}` | 수정(받음 표시 `{ isCompleted }` 포함) · 삭제 |
| `POST /api/wishlists/{id}/share-id` | 공유 링크 재발급 |
| `POST /api/link-previews` | URL 메타데이터 추출 (기존 `/api/metadata`) |
| `POST /api/uploads` | 이미지 업로드 (기존 `/api/image`) |
| `/api/auth/[...all]` | Better Auth |

세부 경로는 이식 시 이 규칙으로 정하고 이 표를 갱신한다.

## 이유

- 위시리스트가 서비스의 중심인데 `/settings` 아래에 있음 → 최상위로
- `kr`/`jp` 는 국가 코드(언어 코드는 `ko`/`ja`). `<html lang>`·hreflang·Accept-Language 매칭과 맞추려면 표준 코드가 필요
- 동사 경로(`/toggle-complete`, `/reorder`)는 HTTP 메서드와 의미가 겹친다
- 필터·정렬을 URL에 두면 새로고침·뒤로 가기·링크 공유에서 상태가 유지된다
- 실사용자 0·데이터 폐기 → 하위 호환은 비용만 든다

## 기각된 대안

- 기존 경로 유지 — 구조 문제를 그대로 가져감
- 기존 URL 리다이렉트 — 보호할 외부 링크가 없음
- 화면 상태 전부 로컬 — 새로고침 시 유실

## 확장 지점

새 화면·API는 U1·U2 규칙으로 경로를 정하고 이 문서의 표에 한 줄 추가한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
