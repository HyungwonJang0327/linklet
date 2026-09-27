---
description: 현재 코드로 부채를 다시 계산해 audit/AUDIT.md 대비 해결·신규 항목을 비교한다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
argument-hint: "[대상 — 기본: v2]"
---

대상: $ARGUMENTS (기본 `v2/`, 교체 후에는 루트)

1. `audit/AUDIT.md` §7 부채 목록(high·med·low, 고정 규약 위반)을 읽는다
2. 영역별로 나눠 다시 조사한다 (필요하면 서브에이전트에 영역별 탐색을 맡기고 요약만 받는다). 읽기 전용
   - 각 기존 항목: **해결 / 부분 해결 / 미해결 / 해당 없음(삭제됨)** + 근거 파일
   - 새로 생긴 부채: 같은 형식(심각도·근거)
   - 고정 규약(시간·값의 언어·로그) 위반 재검사
3. `audit/AUDIT-after.md` 에 비교표를 쓴다 (전 심각도 → 현재 상태 → 근거). 신규 항목은 별도 표
4. high 미해결 항목은 완료 기준 3에 따라 `decisions/` 에 미해결 사유가 있는지 확인하고 없으면 표시한다
5. 새 부채는 고치지 않고 `todo/` 추가를 제안한다
6. 커밋: `docs(audit): 리뉴얼 후 부채 재감사`. push하지 않는다
