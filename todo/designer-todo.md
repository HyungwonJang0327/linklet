# designer todo

> 규칙은 `todo/README.md`. Phase 전체는 `mvp-todo.md`. Phase 2 이후는 Phase 1 완료 시 세분화한다.
> 에이전트 정의: `.claude/agents/designer.md`

## Phase 0 — 결정 자료

designer는 선택지 표만 만든다. 결정 기록·커밋은 메인이 한다.

- [ ] 디자인 토큰 체계 — 색(라이트·다크)·간격·반경·그림자·타이포, 대비 4.5:1 검증표
  - 완료 조건: 선택지 표 → 사용자 결정 → `decisions/design-tokens.md` / 커밋: `docs(decisions): 디자인 토큰 체계 결정` / FEATURES: F03, F29
- [ ] 카테고리 3~4종 목록·설정 사이드바 구조 (planning 미결)
  - 완료 조건: FEATURES F16 이유 열·planning 미결 표 갱신 / 커밋: `docs(planning): 카테고리·설정 메뉴 구조 확정` / FEATURES: F16

## Phase 1

- [ ] 404·에러 경계 화면 문구 검토 — "다음 행동" 안내, 3개 언어 길이
  - 완료 조건: 검토 목록 반환 (커밋 없음) / FEATURES: F06
