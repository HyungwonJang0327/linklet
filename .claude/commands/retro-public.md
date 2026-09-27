---
description: 공개용 회고(블로그·LinkedIn)를 retro-public/ 에 쓴다. 내부 용어·에이전트 이름 노출 없이, 과장 없이
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git log:*), Bash(git mv:*), Bash(date:*)
argument-hint: "[week|month|기간|renewal] [en]"
---

기간: $ARGUMENTS (기본: 리뉴얼 전체). `en` 이 있으면 영어판.

1. 근거 자료: `INTENT.md`, `audit/AUDIT.md`, `audit/BASELINE.md`·`BASELINE-after.md`, `audit/AUDIT-after.md`, `decisions/`, 해당 기간 `worklog/`
2. 구성: 배경(왜 리뉴얼했나) → 감사에서 발견한 것(수치) → 핵심 결정 3~5개와 기각한 대안 → 전후 비교(수치·스크린샷 자리) → 배운 것 → 다음
3. 규칙
   - 내부 용어·에이전트 역할명·파일 경로 나열을 노출하지 않는다. 독자가 이해할 말로 쓴다
   - 과장 금지. 측정한 수치만, 측정 방법을 한 줄로 밝힌다. 측정 못 한 것은 쓰지 않는다
   - 보안 취약점은 유형과 해결 방향만. 재현 절차·익스플로잇을 쓰지 않는다
   - 시크릿·개인정보·테스트 데이터 이미지(토큰·이메일 노출 가능)를 넣지 않는다
   - AI 활용은 사실대로 (무엇을 맡기고 무엇을 직접 결정했는지)
4. 파일: `retro-public/{기간}.md` (영어판 `{기간}.en.md`). 재실행 시 이전 버전을 `retro-public/archive/{날짜}-{기간}.md` 로 옮기고 완결본을 갱신한다
5. 커밋: `docs(retro): 공개 회고 {기간}`. push하지 않는다
