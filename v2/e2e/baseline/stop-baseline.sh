#!/usr/bin/env bash
# 기준선 환경 정리 — 서버 종료, 컨테이너·볼륨 삭제, .next 를 빌드 전 상태로 원복
set -uo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

# 1. 서버 종료 (래퍼가 SIGTERM 을 next 자식에게 전달한다)
if [ -f "$PID_FILE" ]; then
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    log "서버 종료 (PID $pid)"
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
  fi
  rm -f "$PID_FILE"
fi
# 래퍼가 먼저 죽어 next 가 고아로 남은 경우
if port_in_use "$BASELINE_APP_PORT"; then
  log "포트 $BASELINE_APP_PORT 에 남은 프로세스 종료"
  lsof -nP -tiTCP:"$BASELINE_APP_PORT" -sTCP:LISTEN | xargs kill 2>/dev/null || true
fi

# 2. 컨테이너·볼륨 삭제
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  log "기준선 Postgres 삭제"
  compose down -v --remove-orphans
else
  log "Docker 데몬이 꺼져 있어 컨테이너 정리를 건너뜁니다 (켜진 뒤: docker compose -f $COMPOSE_FILE down -v)"
fi

# 3. .next 원복 — 기준선이 만든 빌드만 지우고, 보관해 둔 이전 .next 가 있으면 되돌린다
if [ -f "$BUILT_MARKER" ]; then
  log "기준선 빌드(.next) 삭제"
  rm -rf "$NEXT_DIR"
  rm -f "$BUILT_MARKER"
fi
if [ -d "$NEXT_BACKUP_DIR" ]; then
  if [ -d "$NEXT_DIR" ]; then
    log "경고: .next 와 .run/next-backup 이 둘 다 있어 원복하지 않았습니다. 직접 확인하세요."
  else
    log ".next 원복"
    mv "$NEXT_BACKUP_DIR" "$NEXT_DIR"
  fi
fi

log "정리 완료"
