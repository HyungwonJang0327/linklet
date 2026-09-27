---
description: reviewer 에이전트로 현재 브랜치 diff를 리뷰하고, 사용자가 승인한 지적만 수정한다
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent
argument-hint: "[커밋 범위 — 기본: main...HEAD]"
---

1. 범위를 정한다: $ARGUMENTS (비어 있으면 `main...HEAD`, 브랜치가 main이면 마지막 /review 이후 커밋)
2. **reviewer** 에이전트를 호출해 그 범위를 리뷰시킨다. 인증·권한·safe-fetch·업로드·공개 응답·시크릿이 걸린 변경이면 **security-reviewer** 도 함께 호출한다
3. 지적을 심각도순 표로 사용자에게 보여주고 **어떤 항목을 고칠지 묻고 멈춘다**. 승인 없이 수정하지 않는다
4. 승인된 항목만 수정한다. 항목마다 테스트 → 커밋 (`fix(...)`, `refactor(...)` 등, 한 커밋 = 한 지적)
5. 승인·기각 판단과 이유를 `worklog/{오늘}.md` 에 남긴다 (기각 사유 포함)
6. 수정 커밋 목록과 남은 지적을 보고한다
