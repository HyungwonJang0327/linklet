---
description: audit/BASELINE.md 의 측정을 같은 방법으로 다시 실행해 audit/BASELINE-after.md 에 전후 비교표를 만든다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[항목 — 비우면 전체: quality|bundle|deps|loc|lighthouse|screenshots]"
---

대상: $ARGUMENTS (비우면 전체)

1. `audit/BASELINE.md` 의 측정 명령과 조건을 그대로 읽는다. 측정 대상은 v2(교체 전) 또는 루트(교체 후)
2. 같은 방법으로 다시 측정한다
   - 품질 게이트(typecheck·lint·test·coverage), 빌드 시간, 라우트별 First Load JS, 의존성 수·audit, 파일 수·LOC·`any`·250줄 초과 파일
   - Lighthouse·스크린샷: 로컬 서버에서만. 서버는 dev DB 전용 env로 띄우고 운영 env로 실행하지 않는다 (`audit/BASELINE.md` §6)
   - 스크린샷은 `audit/screenshots/after/` (git 미추적)
3. 안전: `.env*` 값을 읽지 않는다. 빌드에 운영 값이 섞이지 않도록 BASELINE과 같은 덮어쓰기·래퍼를 쓴다. lock 파일을 바꾸지 않는다
4. `audit/BASELINE-after.md` 에 항목별 **전 / 후 / 변화** 표와 측정일·커밋을 쓴다. 측정하지 못한 항목은 이유를 적는다
5. INTENT.md 성공 지표(공유 페이지 Lighthouse 하한·목표 등) 달성 여부를 표시한다
6. 커밋: `docs(audit): 리뉴얼 후 기준선 측정`. push하지 않는다
