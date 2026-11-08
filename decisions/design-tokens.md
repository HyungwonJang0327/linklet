# 디자인 토큰 (v2)

## 결정

토큰 원본은 `design/mockups/tokens.css`. 이 문서는 그 값의 표와 결정 사항이다. 값이 바뀌면 **tokens.css를 먼저 고치고 이 문서를 다시 만든다** (대비표는 계산으로 생성).

### 구조

```
<html data-skin="canvas|paper|pop" data-mode="light|dark">
```

| 층 | 토큰 | 바뀌는 조건 |
|---|---|---|
| 공통 | 타이포(`--t-*`), 간격(`--sp-*`), 터치·컨트롤 높이 | 없음 — 모든 스킨·모드 동일 |
| 스킨 | 반경(`--r-*`), 그림자(`--shadow*`) | `data-skin` |
| 스킨 × 모드 | 색(`--c-*`), `--shadow-float` | `data-skin` + `data-mode` |
| 공유 페이지 프리셋 | `--p-*` | `data-preset` — 소유자 설정. 앱 스킨과 무관 (`decisions/app-skin.md`) |

- **출시 스킨 3종**: `canvas`(기본, 방향 B) · `paper`(방향 A 팔레트) · `pop`(방향 C 팔레트, 노랑 제외). 세 팔레트 모두 라이트·다크 대비 검증을 통과했고 추가 비용이 변수 집합뿐이다
- **모드 기본값 `system`** (`prefers-color-scheme` 추종). 서버 렌더 시 저장된 설정이 없으면 `data-mode` 를 비우고 CSS `@media` 로 결정, 있으면 속성으로 고정 — 깜빡임 방지는 F29 이식 때 (Server Component에서 쿠키·세션 값 읽어 `<html>` 속성으로)
- **스킨은 색·반경·그림자만** 바꾼다. 레이아웃·타이포·간격은 공통 (`app-skin.md`)
- **Tailwind 4 연결**: `@theme inline { --color-bg: var(--c-bg); --radius-lg: var(--r-lg); … }` 로 CSS 변수를 참조하는 유틸리티(`bg-bg`, `text-muted`, `rounded-lg`)를 만든다. 컴포넌트는 유틸리티만 쓰고 `--c-*` 를 직접 쓰지 않는다. 원색 클래스(`bg-slate-800`) 금지는 ESLint/리뷰로
- **공유 페이지**: `.share` 스코프가 공통 컴포넌트가 쓰는 `--c-*`·`--r-*` 를 `--p-*` 값으로 덮어쓴다. 프리셋은 자기 변수만으로 완결(포커스·버튼 반경 포함). 6종 중 3종을 정의했고 나머지 3종은 F27 이식 때 같은 표에 추가한다
- 사진 자리표시자·그라디언트는 토큰이 아니다 (데이터)

### 공통 — 타이포 (단계 적게)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--t-display` | `700 24px/1.25 var(--font-sans)` | 화면 제목 |
| `--t-display-ls` | `-0.025em` | 제목 자간 |
| `--t-heading` | `600 17px/1.35 var(--font-sans)` | 섹션·카드·시트 제목 |
| `--t-title` | `600 14px/1.4 var(--font-sans)` | 아이템 제목(앱) |
| `--t-body` | `400 14px/1.5 var(--font-sans)` | 본문(앱) |
| `--t-body-lg` | `400 15px/1.55 var(--font-sans)` | 본문(공유 페이지) |
| `--t-title-lg` | `600 15px/1.4 var(--font-sans)` | 아이템 제목(공유 페이지) |
| `--t-price` | `700 15px/1.3 var(--font-sans)` | 가격 |
| `--t-caption` | `400 12px/1.45 var(--font-sans)` | 캡션·메타 |
| `--t-label` | `500 13px/1.4 var(--font-sans)` | 폼 라벨·세그먼트 |
| `--t-wordmark` | `700 18px/1 var(--font-sans)` | 워드마크 |
| `--t-hero` | `800 30px/1.2 var(--font-sans)` | 랜딩 제목(데스크톱 40px) |

글꼴: 시스템 산세리프 스택(`-apple-system, "Apple SD Gothic Neo", Pretendard, "Noto Sans KR", system-ui`). 웹폰트는 넣지 않는다(의존성·LCP).

### 공통 — 간격·크기

| 토큰 | 값 |
|---|---|
| `--sp-1` | `4px` |
| `--sp-2` | `8px` |
| `--sp-3` | `12px` |
| `--sp-4` | `16px` |
| `--sp-5` | `20px` |
| `--sp-6` | `24px` |
| `--sp-8` | `32px` |
| `--sp-10` | `40px` |
| `--pad-x` | `16px` (모바일 좌우 여백) |
| `--touch` | `44px` (최소 터치·히트 영역) |
| `--control-h` | `48px` (버튼·입력 높이) |

### 스킨 — 반경·그림자

| 토큰 | canvas | paper | pop |
|---|---|---|---|
| `--r-sm` | `8px` | `10px` | `12px` |
| `--r-md` | `10px` | `14px` | `16px` |
| `--r-lg` | `12px` | `16px` | `20px` |
| `--r-btn` | `10px` | `12px` | `999px` |
| `--shadow` | `none` | `0 1px 2px rgba(60,40,20,.06), 0 10px 30px -14px rgba(60,40,20,.18)` | `0 2px 0 rgba(30,21,56,.04), 0 14px 34px -16px rgba(106,61,245,.25)` |
| `--shadow-sheet` | `0 -8px 30px -12px rgba(0,0,0,.25)` | `0 -8px 30px -12px rgba(60,40,20,.3)` | `0 -8px 30px -12px rgba(30,21,56,.35)` |
| `--shadow-float` (light) | `0 1px 2px rgba(17,19,24,.08), 0 10px 28px -12px rgba(17,19,24,.28)` | `0 2px 4px rgba(60,40,20,.08), 0 14px 34px -12px rgba(60,40,20,.35)` | `0 2px 4px rgba(30,21,56,.08), 0 14px 34px -12px rgba(106,61,245,.45)` |
| `--shadow-float` (dark) | `0 0 0 1px #272B35, 0 10px 28px -12px rgba(0,0,0,.7)` | `0 0 0 1px #3A332D, 0 14px 34px -12px rgba(0,0,0,.7)` | `0 0 0 1px #322A55, 0 14px 34px -12px rgba(0,0,0,.7)` |

### 스킨 × 모드 — 색

| 토큰 | 역할 | canvas·light | canvas·dark | paper·light | paper·dark | pop·light | pop·dark |
|---|---|---|---|---|---|---|---|
| `--c-bg` | 화면 배경 | `#FFFFFF` | `#0E1015` | `#F7F3EC` | `#1C1916` | `#F6F0FF` | `#141026` |
| `--c-surface` | 카드·시트·입력 면 | `#FFFFFF` | `#161920` | `#FFFFFF` | `#26221E` | `#FFFFFF` | `#1E1838` |
| `--c-surface-2` | 보조 면(세그먼트·비활성 칩·스켈레톤 배경) | `#F4F5F7` | `#1E222B` | `#EFE9DF` | `#2F2A25` | `#ECE4FF` | `#272050` |
| `--c-text` | 본문 | `#111318` | `#EDEFF3` | `#2B2521` | `#F2EDE6` | `#1E1538` | `#F3EFFF` |
| `--c-muted` | 보조 텍스트·아이콘 | `#5B6270` | `#9AA1AE` | `#6B6159` | `#A89E93` | `#5F5680` | `#AEA6CC` |
| `--c-accent` | 주된 행동 버튼 배경 | `#2A4FE0` | `#7F9CFF` | `#B5472F` | `#E0765E` | `#6A3DF5` | `#A68BFF` |
| `--c-on-accent` | 그 위 글자 | `#FFFFFF` | `#0E1015` | `#FFFFFF` | `#1C1916` | `#FFFFFF` | `#141026` |
| `--c-accent-text` | 강조 글자·링크·워드마크 | `#2A4FE0` | `#7F9CFF` | `#9E3C27` | `#E8846E` | `#5A2FE0` | `#A68BFF` |
| `--c-accent-soft` | 아바타·단계 번호 배경, 현재 항목 강조 | `#E6EBFF` | `#1E2742` | `#F6DED6` | `#35241F` | `#E6DDFF` | `#2E2460` |
| `--c-border` | 장식 구분선(대비 요구 없음) | `#E4E6EA` | `#272B35` | `#E3DBCE` | `#3A332D` | `#DDD3F5` | `#322A55` |
| `--c-border-strong` | 입력·고스트 버튼 테두리 (3:1 이상) | `#747A87` | `#6E7585` | `#8A7F73` | `#7A6F64` | `#8878B8` | `#7A6CAF` |
| `--c-card-border` | 카드 테두리 (canvas만 선, 나머지 transparent) | `#E4E6EA` | `#272B35` | `transparent` | `transparent` | `transparent` | `transparent` |
| `--c-focus` | 포커스 링 | `#2A4FE0` | `#7F9CFF` | `#B5472F` | `#E0765E` | `#6A3DF5` | `#A68BFF` |
| `--c-chip` | 카테고리 칩 배경 | `#F4F5F7` | `#1E222B` | `#EFE9DF` | `#2F2A25` | `#ECE4FF` | `#272050` |
| `--c-chip-text` | 칩 글자 | `#111318` | `#EDEFF3` | `#2B2521` | `#F2EDE6` | `#1E1538` | `#F3EFFF` |
| `--c-danger` | 오류·삭제 | `#B42318` | `#F97066` | `#B42318` | `#F97066` | `#B42318` | `#F97066` |
| `--c-success` | 성공 안내 | `#067647` | `#47CD89` | `#067647` | `#47CD89` | `#067647` | `#47CD89` |
| `--c-skeleton` | 스켈레톤 | `#E4E6EA` | `#1E222B` | `#EFE9DF` | `#2F2A25` | `#ECE4FF` | `#272050` |
| `--c-skeleton-hi` | 스켈레톤 하이라이트 | `#F4F5F7` | `#272B35` | `#F7F3EC` | `#3A332D` | `#F6F0FF` | `#322A55` |

`--c-overlay`(시트 뒤 가림막)는 라이트 `rgba(잉크,.45)`, 다크 `rgba(0,0,0,.6)`.

### 대비 검증 (WCAG 상대 휘도, 2026-11-08 계산)

| 조합 (★는 UI 경계 3:1, 나머지 글자 4.5:1) | canvas·light | canvas·dark | paper·light | paper·dark | pop·light | pop·dark |
|---|---|---|---|---|---|---|
| 본문 text/bg | 18.6 | 16.5 | 13.7 | 15.0 | 15.4 | 16.4 |
| 본문 text/surface | 18.6 | 15.3 | 15.1 | 13.6 | 17.2 | 15.0 |
| 보조 muted/bg | 6.1 | 7.3 | 5.5 | 6.6 | 6.0 | 8.1 |
| 보조 muted/surface | 6.1 | 6.8 | 6.0 | 6.0 | 6.7 | 7.3 |
| 보조 muted/surface-2 | 5.6 | 6.1 | 5.0 | 5.4 | 5.5 | 6.5 |
| 버튼 on-accent/accent | 6.4 | 7.3 | 5.4 | 5.8 | 5.8 | 6.9 |
| 강조 글자 accent-text/bg | 6.4 | 7.3 | 6.1 | 6.6 | 6.5 | 6.9 |
| 강조 글자 accent-text/accent-soft | 5.4 | 5.7 | 5.2 | 5.6 | 5.5 | 5.0 |
| 위험 danger/bg | 6.6 | 6.8 | 5.9 | 6.3 | 5.9 | 6.7 |
| 성공 success/bg | 5.7 | 9.4 | 5.1 | 8.6 | 5.1 | 9.2 |
| 칩 chip-text/chip | 17.0 | 13.8 | 12.5 | 12.2 | 14.0 | 13.2 |
| 포커스 링 focus/bg ★3:1 | 6.4 | 7.3 | 4.9 | 5.8 | 5.2 | 6.9 |
| 입력 테두리 border-strong/bg ★3:1 | 4.3 | 4.1 | 3.5 | 3.6 | 3.5 | 4.1 |
| 입력 테두리 border-strong/surface ★3:1 | 4.3 | 3.8 | 3.9 | 3.2 | 3.9 | 3.7 |

전부 기준 이상. `--c-border`(장식 구분선)와 `--c-skeleton` 은 대비 요구 대상이 아니다. 받음 배지는 `--c-surface` 면 + `--c-text` 1px 테두리라 어두운 사진(면 16.8)·밝은 사진(테두리 11.3 이상) 어느 쪽에서도 한쪽이 3:1 이상이다.

### 공유 페이지 프리셋 (F27, 6종 중 3종)

| 토큰 | canvas | night | paper |
|---|---|---|---|
| `--p-bg` | `#FFFFFF` | `#15161C` | `#F7F3EC` |
| `--p-surface` | `#FFFFFF` | `#1F2129` | `#FFFFFF` |
| `--p-text` | `#111318` | `#F2F2F5` | `#2B2521` |
| `--p-muted` | `#5B6270` | `#A4A7B3` | `#6B6159` |
| `--p-accent` | `#2A4FE0` | `#9DB2FF` | `#B5472F` |
| `--p-focus` | `#2A4FE0` | `#9DB2FF` | `#B5472F` |
| `--p-border` | `#E4E6EA` | `#2C2F3A` | `transparent` |
| `--p-r` | `12px` | `12px` | `16px` |
| `--p-r-btn` | `10px` | `10px` | `12px` |
| `--p-shadow` | `none` | `none` | `0 1px 2px rgba(60,40,20,.06),0 10px 30px -14px rgba(60,40,20,.18)` |

| 대비 | canvas | night | paper |
|---|---|---|---|
| 본문 text/bg | 18.6 | 16.2 | 13.7 |
| 본문 text/surface | 18.6 | 14.4 | 15.1 |
| 보조 muted/bg | 6.1 | 7.5 | 5.5 |
| 보조 muted/surface | 6.1 | 6.7 | 6.0 |
| CTA accent/surface | 6.4 | 7.8 | 5.4 |
| 포커스 focus/bg ★3:1 | 6.4 | 8.8 | 4.9 |

프리셋 아바타 글자는 `--p-text`(강조색 혼합 배경 위 4.5:1 미달 때문). 나머지 3종(예: 밝은 파스텔·숲·모노)은 F27 이식 때 같은 열 구성으로 추가하고 이 대비표에 행을 더한다.

## 이유

- 토큰을 CSS 변수 + `data-*` 속성으로 두면 스킨·모드·프리셋이 모두 "변수 집합 교체" 한 가지 메커니즘이 된다. 컴포넌트 수정 없이 스킨을 추가할 수 있다
- 타이포·간격을 스킨 밖에 두는 이유: 스킨마다 레이아웃이 달라지면 검증 범위가 스킨 수만큼 늘어난다 (`app-skin.md`)
- 공유 페이지 변수를 분리(`--p-*`)하는 이유: 보는 사람의 설정이 소유자가 꾸민 모습에 섞이지 않게. 2차 검토에서 공통 컴포넌트를 통해 앱 스킨이 새는 결함이 실제로 발견됐다
- 시스템 폰트: 무료 티어·LCP·3개 언어(한·영·일) 커버를 한 번에. 디자인 차별화는 색·간격·반경으로

## 기각된 대안

- **Tailwind 기본 팔레트 직접 사용**(`bg-slate-50` 등) — 스킨 전환이 불가능하고 원색 클래스 금지 규칙과 충돌
- **스킨마다 별도 CSS 파일 로드** — 전환 시 깜빡임·요청 추가. 변수 집합 6개는 한 파일에 둬도 작다
- **다크를 별도 스킨으로** — 시스템 다크 자동 추종 불가 (`app-skin.md` 기각안)
- **웹폰트(Pretendard) 번들** — 수백 KB, 3개 언어 글리프. 시스템 스택이 세 언어 모두 커버

## 확장 지점

- 스킨 추가: `tokens.css` 에 `[data-skin="x"]` 블록 + light·dark 블록 → 이 문서 표에 열 추가 → 대비표 재생성 → 화면 설정(F29) 스킨 카드 1개
- 프리셋 추가: `[data-preset="x"]` 한 블록 + 대비표 한 행
- 토큰 추가: 역할이 기존 토큰과 다를 때만. 같은 역할 다른 이름 금지 (`--c-text-2` 같은 번호 토큰 금지)

## 결정일

2026-11-08

## 갱신 이력

- 2026-11-08 최초 결정 — `design/mockups/tokens.css`(방향 B + designer 2차 검토 반영)에서 추출. 출시 스킨 3종(메인 추천, 사용자 "다음 진행")
