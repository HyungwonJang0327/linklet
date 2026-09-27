# 의존성 추가 기준 (v2)

## 결정

새 의존성은 아래 다섯 가지를 확인하고, 이 문서의 목록에 한 줄로 기록한 뒤에만 추가한다. 기록 없는 추가는 금지(CLAUDE.md 금지 목록).

1. **직접 구현 비용**: 직접 만들면 반나절 이상 걸린다
2. **유지보수 상태**: 최근 6개월 안에 릴리스, 안정(정식) 버전
3. **번들 영향**: 클라이언트 번들에 들어가면 gzip 크기를 확인하고 기록 (공유 페이지 성능 지표)
4. **라이선스**: MIT·Apache-2.0·BSD·ISC 등 허용 라이선스
5. **비용**: 무료 (유료 서비스 SDK는 무료 플랜 한도를 함께 기록)

## 목록

| 패키지 | 용도 | 근거 결정 | 클라이언트 번들 | 라이선스 | 추가일 |
|---|---|---|---|---|---|
| next | 프레임워크 | tech-stack | 런타임 | MIT | 2026-09-28 |
| react · react-dom | UI | tech-stack | 런타임 | MIT | 2026-09-28 |
| tailwindcss · @tailwindcss/postcss | 스타일 | tech-stack | 빌드 시 CSS만 | MIT | 2026-09-28 |
| typescript · @types/node · @types/react · @types/react-dom | 타입 | tech-stack | ✗ | Apache-2.0 / MIT | 2026-09-28 |
| eslint · eslint-config-next | 린트 (jsx-a11y·import 플러그인 포함) | tech-stack | ✗ | MIT | 2026-09-28 |
| prettier · eslint-config-prettier | 포맷 | tech-stack (킥오프 고정) | ✗ | MIT | 2026-09-28 |
| vitest · @vitest/coverage-v8 | 단위·통합 테스트, 커버리지 | testing | ✗ | MIT | 2026-09-28 |
| @playwright/test | E2E | testing | ✗ | Apache-2.0 | 2026-09-28 |
| lucide-react | 아이콘 (heroicons 대신 하나만) | tech-stack 갱신 | 사용 아이콘만(트리 셰이킹) — 설치 시 크기 기록 | ISC | 결정 2026-09-28, 설치는 첫 UI |

설치 예정(해당 기능 이식 때 이 표에 추가): better-auth·@better-auth/prisma-adapter(F08), prisma·@prisma/client·@prisma/adapter-neon 7.10.0(F02), zod(F07), @tanstack/react-query(F13), @aws-sdk/client-s3(F20, R2), @sentry/nextjs(F06), cheerio(F18), @dnd-kit/*(F22), server-only(서버 모듈)

로컬 도구(패키지 아님): gitleaks 8.30.1 (brew) — pre-commit 훅. CI는 gitleaks/gitleaks-action@v3 (개인 계정 리포는 라이선스 불필요).

## 이유

- 리뉴얼 전 아이콘 라이브러리 2벌(heroicons·lucide), `@types/cheerio` 처럼 불필요한 패키지, 설치만 되고 쓰이지 않는 jsdom·Testing Library — 추가 기준이 없었다
- 무료 티어 예산과 공유 페이지 성능 목표가 있어 크기·비용을 확인해야 한다

## 기각된 대안

- 자유 추가 — 현재 상태의 원인
- 번들 크기 상한(숫자) 고정 — 이 규모에서는 기록·확인으로 충분

## 확장 지점

새 패키지는 위 목록에 한 줄 추가한다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
