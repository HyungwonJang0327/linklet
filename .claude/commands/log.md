---
description: 이번 대화를 worklog에 기록하고 decisions·planning·todo·FEATURES를 갱신한다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git log:*), Bash(git status:*), Bash(git diff:*), Bash(date:*)
argument-hint: "[주제]"
---

이번 세션(이전 /log 이후 분만)을 정리해 기록한다. 주제: $ARGUMENTS

1. `date +%Y-%m-%d` 로 오늘 날짜를 확인한다
2. `worklog/{오늘}.md` 가 있으면 끝에 `---` 로 구분해 이어 붙이고, 없으면 만든다. 이전 /log 이후 내용만 쓴다 (마지막 기록과 `git log` 로 경계를 판단)
   - **참여 에이전트** / **논의 내용**(누가 어떤 의견) / **결론·결정** / **미결·다음**
3. 확정된 결정은 `decisions/{주제}.md` 에 병합한다
   - 덮어쓰지 않는다. 기존 결정과 충돌하면 새 항목에 **"결정 변경 확인 필요"** 를 붙이고 사용자에게 알린다
   - 결정 / 이유 / 기각된 대안 / 확장 지점 / 결정일 / 갱신 이력
4. `planning.md` 의 완료 기준 체크, 핵심 결정 표, 미결 질문을 갱신한다
5. `todo/` 에서 끝난 항목에 체크하고 날짜·커밋 해시를 적는다 (`git log` 로 확인)
6. 이식 상태가 바뀌었으면 `audit/FEATURES.md` 상태 열 갱신을 제안한다 (`/parity` 로 확정)
7. 문서 변경을 커밋한다: `docs(worklog): ...` 등 파일 성격별로 나눠서. staged diff에 시크릿이 없는지 확인한다. push하지 않는다
8. 기록한 파일 목록과 요약 3줄을 보고한다

시크릿·개인정보(이메일·토큰)는 worklog에도 쓰지 않는다.
