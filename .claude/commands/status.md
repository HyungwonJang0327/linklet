---
description: planning·todo·FEATURES 기준 진행률, 미결 질문, 다음 할 일 3개를 보여준다
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git status:*)
---

읽기만 한다. 파일을 수정하지 않는다.

1. `planning.md` — 완료 기준 체크 현황(n/10), 미결 질문
2. `todo/mvp-todo.md` — 현재 Phase, Phase별 완료/전체
3. `audit/FEATURES.md` — 상태 열 집계 (미착수·이식 중·이식 완료·동등성 확인)
4. 최근 `worklog/` 1개의 "미결·다음"
5. `git status`, main 대비 push 안 된 커밋 수

출력
- 진행률 표 (완료 기준 / Phase / FEATURES)
- 블로커·미결 질문
- **다음 할 일 3개** (todo 순서 기준, 예정 커밋 메시지 포함)
