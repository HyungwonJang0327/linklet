---
description: 진행 중 새 에이전트를 추가한다. 역할·경계·tools·읽을 문서를 규칙대로 만들고 todo/{역할}-todo.md 도 만든다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git add:*), Bash(git commit:*), Bash(git status:*)
argument-hint: "{역할} [설명]"
---

역할: $ARGUMENTS

1. 기존 `.claude/agents/` 와 역할이 겹치는지 확인한다. 겹치면 기존 에이전트 수정을 제안하고 멈춘다
2. 역할·담당 영역·산출물·경계·tools를 표로 제안하고 **사용자 확인을 기다린다**. tools는 필요한 최소한 (리뷰 역할은 수정 권한 없음)
3. 확인되면 `.claude/agents/{역할}.md` 생성
   - frontmatter: `name`, `description`(언제 호출하는가를 구체적으로), `tools`
   - 본문: 역할 / 담당 영역 / 산출물 / 행동 방식 / 경계 / **공통 규칙** (기존 에이전트 파일의 공통 규칙 섹션을 그대로 복사)
   - 현재 상태를 파일에 적지 않는다
4. `todo/{역할}-todo.md` 생성 (todo/README.md 형식)
5. `CLAUDE.md` 에 에이전트 목록이 있으면 갱신한다
6. 커밋: `chore(claude): {역할} 에이전트 추가`. push하지 않는다
