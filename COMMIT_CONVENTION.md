# 커밋 규칙

## 형식

```
type(scope): subject

(선택) 본문 — 왜 바꿨는지

Co-Authored-By: ... (에이전트가 작성한 커밋)
```

- **subject**: 한국어 명령형, 50자 이내, 마침표 없음. 예: `feat(wishlist): 위시리스트 목록 4상태 구현`
- 한 커밋 = 한 가지 변경. `wip`·`fix`·`update` 같은 무의미한 메시지 금지
- 커밋 전 staged diff에 시크릿(키·토큰·비밀번호·접속 문자열)이 없는지 확인한다

## type

| type | 용도 |
|---|---|
| `feat` | 기능 추가·이식 |
| `fix` | 버그 수정 |
| `design` | UI·스타일만 변경 (동작 불변) |
| `refactor` | 동작 불변 구조 변경 |
| `chore` | 설정·빌드·도구 |
| `docs` | 문서 |
| `test` | 테스트 추가·수정 |
| `perf` | 성능 개선 |
| `ci` | CI 워크플로 |

## scope

| scope | 대상 |
|---|---|
| `wishlist` | 위시리스트 목록·생성·편집·삭제·공개 설정·카테고리 |
| `item` | 아이템 추가·수정·삭제·받음·순서 |
| `link-preview` | URL 메타데이터 추출·파서·safe-fetch |
| `share` | 공유 ID·공유 페이지·링크 미리보기(OG) |
| `customize` | 꾸미기(테마 프리셋·레이아웃·강조색·소셜 링크) |
| `profile` | 프로필 |
| `settings` | 화면 설정(테마·언어) |
| `session` | 세션 목록·로그아웃 |
| `auth` | 로그인·라우트 보호·권한 계층 |
| `inquiry` | 사용자 문의 |
| `notice` | 공지 |
| `admin` | 관리자 화면 |
| `upload` | 이미지 업로드·저장소 |
| `i18n` | 사전·언어 경로 |
| `ui` | `shared/ui` 공통 컴포넌트·디자인 토큰 |
| `api` | 응답·에러 헬퍼 등 API 공통 |
| `db` | 스키마·마이그레이션·시드 |
| `config` | 환경변수·빌드·린트·`.gitignore` 등 설정 |
| `deps` | 의존성 추가·갱신 |
| `ci` | GitHub Actions·시크릿 스캔 |
| `legacy` | 기존 앱(루트) — 교체 시 제거 등 |
| `audit` · `intent` · `planning` · `decisions` · `worklog` · `todo` · `claude` · `readme` | 리뉴얼 문서 |

새 scope가 필요하면 이 표에 먼저 추가한다.

## 예시

```
feat(share): 공유 페이지 서버 렌더와 OG 메타 추가
test(auth): 타인 위시리스트 접근 시 404 판정 테스트
chore(config): 루트 tsconfig에서 v2 제외
docs(decisions): 에러 처리 방침 결정
```

리뉴얼 전 커밋(`[feat] ...`, 서술형 한국어)은 이 규칙 이전 기록이다.
