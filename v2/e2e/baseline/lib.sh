#!/usr/bin/env bash
# run-baseline.sh · stop-baseline.sh 공통 상수·도우미 (직접 실행하지 않는다)
# 접속 정보 기본값은 docker-compose.baseline.yml · with-baseline-env.mjs 와 같아야 한다

BASELINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BASELINE_DIR/../../.." && pwd)"
RUN_DIR="$BASELINE_DIR/.run"
COMPOSE_FILE="$BASELINE_DIR/docker-compose.baseline.yml"
WRAPPER="$BASELINE_DIR/with-baseline-env.mjs"
# 루트(기존 앱)의 CLI 를 직접 호출 — npx 계층을 빼서 종료 신호가 바로 전달되게
NEXT_BIN="$ROOT_DIR/node_modules/.bin/next"
PRISMA_BIN="$ROOT_DIR/node_modules/.bin/prisma"

export BASELINE_DB_PORT="${BASELINE_DB_PORT:-54329}"
export BASELINE_APP_PORT="${BASELINE_APP_PORT:-3001}"
BASELINE_APP_URL="http://localhost:$BASELINE_APP_PORT"

PID_FILE="$RUN_DIR/server.pid"
LOG_FILE="$RUN_DIR/server.log"
BUILT_MARKER="$RUN_DIR/built-by-baseline"
NEXT_DIR="$ROOT_DIR/.next"
NEXT_BACKUP_DIR="$RUN_DIR/next-backup"   # 루트에 두면 .gitignore 에 안 걸려 미추적 파일로 뜬다

log() { printf '[baseline] %s\n' "$*"; }
die() { printf '[baseline] 오류: %s\n' "$*" >&2; exit 1; }

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

require_docker() {
  command -v docker >/dev/null 2>&1 || die "docker 가 없습니다. Docker Desktop 을 설치하세요."
  docker info >/dev/null 2>&1 || die "Docker 데몬이 실행 중이 아닙니다. Docker Desktop 을 켠 뒤 다시 실행하세요."
}

# 루트 Node 로 래퍼를 거쳐 명령 실행 (cwd = 루트). 래퍼가 env 전부를 로컬·더미로 덮고 검사한다
run_in_root() { (cd "$ROOT_DIR" && node "$WRAPPER" "$@"); }

port_in_use() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }
