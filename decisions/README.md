# decisions — "왜 그렇게 정했나"

## 규칙

- 주제별 `kebab-case.md` 파일 하나. 같은 주제는 같은 파일에 누적한다
- 항목 구성: **결정 / 이유 / 기각된 대안 / 확장 지점 / 결정일 / 갱신 이력**
- 기존 결정과 충돌하는 새 결정은 덮어쓰지 않는다. 새 결정을 추가하고 **"결정 변경 확인 필요"** 로 표시한 뒤 사용자 확인을 받는다
- 확정된 결론의 목록은 `planning.md` 핵심 결정 표에 한 줄로 반영한다 (중복 서술 금지 — 맥락은 여기, 목록은 planning)
- 라이브러리·외부 서비스 사실은 출처 URL과 확인 날짜를 함께 적는다

## 목록

| 파일 | 주제 |
|---|---|
| [renewal-strategy.md](renewal-strategy.md) | 리뉴얼 전략 — 병행 재구축 `v2/` |
| [tech-stack.md](tech-stack.md) | v2 기술 스택, 무료 한도 |
| [architecture.md](architecture.md) | 아키텍처·폴더 구조·import 경계 |
| [error-handling.md](error-handling.md) | 에러 응답 스키마·실패 구분·문구·경계·로그 |
| [api-response.md](api-response.md) | 정상 응답 형태·페이지네이션·공유 ID·입력 검증 |
| [testing.md](testing.md) | 테스트 기준선·커버리지 대상·테스트 DB |
| [db-migration.md](db-migration.md) | 마이그레이션 생성·되돌리기·적용 순서 |
| [url-design.md](url-design.md) | 페이지·API 경로, 언어 코드, 하위 호환 |
| [dependencies.md](dependencies.md) | 의존성 추가 기준과 기록 |
| [roadmap.md](roadmap.md) | Phase 구성·투입 시간·첫 배포 시점 |
