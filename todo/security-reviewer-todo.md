# security-reviewer todo

> 규칙은 `todo/README.md`. Phase 전체는 `mvp-todo.md`. Phase 2 이후는 Phase 1 완료 시 세분화한다.
> 에이전트 정의: `.claude/agents/security-reviewer.md`

## Phase 0

(없음)

## Phase 1

- [ ] F07 응답 헬퍼 — 내부 에러 메시지·스택 노출 경로 없음 (H8)
  - 완료 조건: 지적 목록 반환 (커밋 없음)
- [ ] F01 환경변수·로거 — 시크릿 값 출력, 클라이언트 번들에 서버 변수 혼입, 로그 개인정보
  - 완료 조건: 지적 목록 반환 (커밋 없음)
- [ ] F02 시드 환경 가드 — 원격·운영 DB 접속 시 즉시 종료 (H12)
  - 완료 조건: 지적 목록 반환 (커밋 없음)
