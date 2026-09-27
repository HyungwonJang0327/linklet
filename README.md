# Linklet

요즘 갖고 싶은 것들, 링크만 붙여 넣으면 예쁘게 모아지는 내 위시리스트 페이지. 친구에게 링크 하나로 공유.

> **리뉴얼 진행 중** — 방치됐던 첫 버전을 감사하고, 같은 리포의 `v2/` 에 새 구조로 다시 세우는 중입니다.
> 왜: [INTENT.md](INTENT.md) · 리뉴얼 전 감사: [audit/AUDIT.md](audit/AUDIT.md) · 기능 판정표: [audit/FEATURES.md](audit/FEATURES.md) · 결정 기록: [decisions/](decisions/)
> 리뉴얼 전 코드: 태그 [`pre-renewal`](../../tree/pre-renewal) · 현재 운영(리뉴얼 전 앱): https://link-let.vercel.app/

<!-- TODO: screenshot — 리뉴얼 전/후 비교: 공유 페이지 (audit/screenshots 는 git 미추적, 교체 후 정리본만 추가) -->
<!-- TODO: screenshot — 링크 붙여 넣기 → 자동 채움 → 공유까지 3분 흐름 -->
<!-- TODO: gif — 키보드로 아이템 순서 변경 -->

## 핵심 기능

- **링크로 담기** — 상품 링크를 붙여 넣으면 제목·이미지·가격·사이트명이 자동으로 채워진다 (Open Graph·Twitter Card·JSON-LD·쇼핑몰별 셀렉터)
- **링크 하나로 공유** — 위시리스트마다 공유 링크(`/w/{shareId}`), 로그인 없이 열람, 메신저 링크 미리보기
- **가볍게 꾸미기** — 테마 프리셋·레이아웃·강조색·소셜 링크
- **정리** — 받음 표시, 드래그·키보드로 순서 변경, 일괄 삭제
- **3개 언어** — 한국어·영어·일본어
- **최소 운영 도구** — 공지·문의 답변·사용자 목록

## 설계 원칙

- **응답은 두 가지뿐** — 성공 `{ data }`, 실패 `{ error: { code, message } }`. 화면 문구는 `code` 로 프론트가 번역 ([error-handling](decisions/error-handling.md), [api-response](decisions/api-response.md))
- **권한은 한 곳에서** — Route Handler는 얇게, 권한 판정은 서비스 계층에서만 ([architecture](decisions/architecture.md))
- **외부 URL은 안전 fetch로만** — DNS 확인 후 사설 IP 차단, 리다이렉트마다 재검사 (SSRF 방어)
- **무료 티어 안에서** — Vercel Hobby·Neon Free·Cloudflare R2·Sentry Developer ([tech-stack](decisions/tech-stack.md))
- **수치로 증명** — 리뉴얼 전 기준선([BASELINE](audit/BASELINE.md))과 같은 방법으로 전후 비교

## 기술 스택 (v2 목표)

| 구분 | 스택 |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Data | PostgreSQL (Neon) + Prisma 7, Zod 4 |
| Auth | Better Auth (Google, DB 세션) |
| Client state | TanStack Query 5 |
| UI | Tailwind CSS 4 (디자인 토큰) |
| Infra | Vercel, Cloudflare R2, Sentry |
| Test | Vitest (+ Docker Postgres), Playwright |

실제 설치 버전은 환경 세팅 후 갱신합니다. 리뉴얼 전 스택은 [audit/AUDIT.md](audit/AUDIT.md) §2.

## 구조

```
v2/                  # 새 앱 (진행 중)
  src/app/           #   라우트만
  src/features/      #   도메인별: components · hooks · server(service·repository) · schema
  src/shared/        #   공통 UI·라이브러리·i18n·환경변수 스키마
  src/server/        #   db · auth · storage
audit/               # 리뉴얼 전 감사·기준선·기능 판정표
decisions/           # 결정과 이유
worklog/ todo/       # 작업 일지 · 계획
app/ components/ ...  # 리뉴얼 전 앱 (교체 시 제거)
```

## 실행 · 테스트

v2 명령은 환경 세팅 후 추가합니다. 리뉴얼 전 앱의 품질 측정 방법은 [audit/BASELINE.md](audit/BASELINE.md)에 있습니다.

## AI 활용 방식

Claude Code와 함께 1인으로 진행합니다. 감사 단계에서는 서브에이전트가 영역별로 코드를 읽고 요약만 돌려주게 해 근거 파일과 함께 부채를 정리했고, 전략·스택·에러 처리 같은 결정은 선택지 표를 받아 직접 내렸습니다(모든 결정과 기각된 대안은 `decisions/` 에 남아 있습니다). 구현은 역할별 에이전트(리뷰·이식)가 기능 판정표의 한 행씩 맡고, 한 커밋 = 한 가지 변경 원칙과 작업 일지로 진행 과정을 추적합니다.
