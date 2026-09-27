---
description: 주제 하나를 선택지 표로 제시하고, 사용자가 고르면 decisions/에 기록하고 planning.md에 반영한다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch
argument-hint: "{주제}"
---

주제: $ARGUMENTS

1. 관련 기존 결정(`decisions/`, `planning.md`)과 현재 코드 상태를 확인한다. 충돌하는 기존 결정이 있으면 먼저 알린다
2. 라이브러리·외부 서비스가 걸리면 공식 문서·레지스트리로 현재 사실을 확인한다 (추측 금지, 출처 URL 기록). 무료 티어 예산을 확인한다
3. 표로 제시한다: **현재 상태** → 선택지 / 장점 / 단점 / 이 리포에서의 위험 / 추천. 추천 이유를 한두 줄로
4. **사용자의 선택을 기다린다**
5. 선택되면 `decisions/{kebab-case-주제}.md` 에 기록: 결정 / 이유 / 기각된 대안 / 확장 지점 / 결정일 / 갱신 이력. 기존 결정과 충돌하면 덮어쓰지 않고 "결정 변경 확인 필요"
6. `planning.md` 핵심 결정 표·미결 질문을 갱신하고, `decisions/README.md` 목록에 없으면 추가한다
7. 커밋: `docs(decisions): ...`, `docs(planning): ...` 따로. push하지 않는다
