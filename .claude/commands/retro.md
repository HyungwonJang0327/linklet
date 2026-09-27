---
description: worklog·decisions를 종합해 내부 회고를 retro/ 에 쓴다. 솔직하게
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git log:*), Bash(date:*)
argument-hint: "[week|month|기간]"
---

기간: $ARGUMENTS (기본: 지난 7일)

1. 해당 기간 `worklog/`, 변경된 `decisions/`, `git log`, `todo/` 완료 항목을 읽는다
2. 구성
   - 한 일 (계획 대비 — todo·FEATURES 진행)
   - 잘 된 것 / 안 된 것 (원인까지. 에이전트 운영·결정 번복·추정 실패 포함)
   - 결정 중 다시 볼 것 (근거가 약했던 것, 뒤집힌 것)
   - 다음 기간에 바꿀 것 (구체 행동 3개 이하)
   - 지표: 커밋 수, FEATURES 진행, 테스트 수·커버리지 변화
3. 솔직하게 쓴다. 미화하지 않는다
4. 파일: `retro/{기간}.md`. 같은 기간을 다시 실행하면 파일 끝에 `## {날짜} 시점` 섹션을 누적한다
5. 커밋: `docs(retro): 내부 회고 {기간}`. push하지 않는다
