#!/usr/bin/env bash
# 기존 앱(루트) 기준선 실행 — 한 번에: 전용 Postgres 기동 → db push → 시드 → 빌드 → next start -p 3001 → /api/health 대기
# 로컬 전용·CI 제외 (decisions/testing.md T7·T8). 종료·정리는 stop-baseline.sh
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_docker
mkdir -p "$RUN_DIR"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  die "이미 기준선 서버가 실행 중입니다 (PID $(cat "$PID_FILE")). 먼저 stop-baseline.sh 를 실행하세요."
fi
port_in_use "$BASELINE_APP_PORT" && die "포트 $BASELINE_APP_PORT 가 사용 중입니다. 다른 프로세스를 종료하거나 BASELINE_APP_PORT 를 바꾸세요."

# 0. 루트 의존성 (lock 변경 금지: npm ci)
if [ ! -d "$ROOT_DIR/node_modules" ]; then
  log "루트 node_modules 가 없어 npm ci 를 실행합니다 (lock 변경 없음)"
  (cd "$ROOT_DIR" && npm ci)
fi

# 1. env 래퍼 사전 검사 — .env 파일 키 전부 덮였는지, DATABASE_URL 이 로컬 컨테이너인지
run_in_root --check

# 2. 전용 Postgres 기동 (healthcheck 통과까지 대기)
log "기준선 Postgres 기동 (linklet-baseline-db, 127.0.0.1:$BASELINE_DB_PORT)"
compose up -d --wait

# 3. 스키마 적용 — 기존 마이그레이션은 드리프트(H5)로 재현 불가. 이 컨테이너에서만 허용하는 db push 예외 (T8)
#    래퍼가 DATABASE_URL 이 localhost:54329 가 아니면 즉시 종료한다
log "prisma db push (루트 Prisma 6 CLI, 로컬 컨테이너)"
[ -x "$PRISMA_BIN" ] && [ -x "$NEXT_BIN" ] || die "루트 node_modules/.bin 에 prisma·next 가 없습니다. 루트에서 npm ci 를 실행하세요."
run_in_root "$PRISMA_BIN" db push --skip-generate

# 3-1. 시드 — seed.sql 을 psql 로 흘린다 (T9). 서버 기동과 분리해 두어 psql 로 바로 확인할 수 있고, 재시드는 baseline:seed
bash "$BASELINE_DIR/seed-baseline.sh"

# 4. 기존 .next 보존 → 프로덕션 빌드
if [ -d "$NEXT_DIR" ] && [ ! -d "$NEXT_BACKUP_DIR" ]; then
  log "기존 .next 를 .run/next-backup 으로 보관"
  mv "$NEXT_DIR" "$NEXT_BACKUP_DIR"
fi
log "next build"
run_in_root "$NEXT_BIN" build
touch "$BUILT_MARKER"

# 5. next start (백그라운드, PID 파일)
log "next start -p $BASELINE_APP_PORT (로그: $LOG_FILE)"
# exec 로 서브셸을 래퍼 node 프로세스로 바꿔 $! 가 래퍼 PID 가 되게 하고, 표준 입출력을 모두 끊어
# 호출자 파이프를 물고 있지 않게 한다
(cd "$ROOT_DIR" && exec nohup node "$WRAPPER" "$NEXT_BIN" start -p "$BASELINE_APP_PORT" \
  >"$LOG_FILE" 2>&1 </dev/null) &
echo $! >"$PID_FILE"

# 6. /api/health 가 healthy 될 때까지 대기 (최대 90초)
log "$BASELINE_APP_URL/api/health 대기"
for _ in $(seq 1 90); do
  if curl -fsS "$BASELINE_APP_URL/api/health" 2>/dev/null | grep -q '"status":"healthy"'; then
    log "준비 완료 — 기존 앱: $BASELINE_APP_URL  DB: 127.0.0.1:$BASELINE_DB_PORT/linklet_baseline"
    log "종료·정리: pnpm baseline:down  (v2/) 또는 $BASELINE_DIR/stop-baseline.sh"
    exit 0
  fi
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    tail -n 40 "$LOG_FILE" >&2 || true
    die "서버 프로세스가 종료됐습니다. 위 로그를 확인하세요."
  fi
  sleep 1
done

tail -n 40 "$LOG_FILE" >&2 || true
die "/api/health 가 90초 안에 healthy 가 되지 않았습니다. stop-baseline.sh 로 정리 후 다시 시도하세요."
