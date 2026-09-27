---
description: 에이전트를 호출하기 전 브리핑을 만든다. 주제가 있으면 그 작업용 에이전트 프롬프트까지 작성한다
allowed-tools: Read, Glob, Grep, Bash(git log:*)
argument-hint: "{역할: reviewer|migrator|tester|security-reviewer|designer} [주제·FEATURES ID]"
---

역할·주제: $ARGUMENTS

읽는다: `todo/{역할}-todo.md`, `todo/mvp-todo.md`, 관련 `decisions/`, 최근 `worklog/` 2개, `audit/FEATURES.md`(해당 ID), `CLAUDE.md` §5·§6.

출력
1. **완료** (Phase별, 이 역할 관련)
2. **진행 중·블로커**
3. **다음 Top 3**
4. **최근 결정 중 이 작업에 영향 있는 것** (문서 링크)
5. **이번 작업 주의점** — 기각된 방향(다시 제안하지 말 것), 관련 "중요" 함정 번호, FEATURES 근거 범위
6. **커밋 규칙** 요약 (한 커밋 = 한 변경, 예정 커밋 메시지)

주제가 있으면 7. **에이전트 프롬프트** — 맡은 ID 하나, 완료 조건, 동등성 확인 방법, 하지 말 것, 보고 형식을 담은 복사 가능한 블록.

파일을 수정하지 않는다.
