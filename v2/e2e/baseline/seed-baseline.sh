#!/usr/bin/env bash
# 기준선 DB 시드 — seed.sql 을 기준선 컨테이너의 psql 로 흘린다 (decisions/testing.md T9)
# run-baseline.sh 가 db push 직후 호출하고, 재시드는 `pnpm baseline:seed` 로 단독 실행한다. 멱등(TRUNCATE 후 INSERT)
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_docker
SEED_FILE="$BASELINE_DIR/seed.sql"
[ -f "$SEED_FILE" ] || die "시드 파일이 없습니다: $SEED_FILE"

# 컨테이너가 떠 있어야 한다 (compose exec 는 중지된 컨테이너에 실패). 대상은 항상 기준선 전용 컨테이너뿐이다
[ -n "$(compose ps -q --status running db 2>/dev/null)" ] || die "기준선 Postgres 가 실행 중이 아닙니다. 먼저 pnpm baseline:up 을 실행하세요."

log "seed.sql 적용 (linklet-baseline-db / $BASELINE_DB_NAME)"
compose exec -T db psql -v ON_ERROR_STOP=1 -q -U "$BASELINE_DB_USER" -d "$BASELINE_DB_NAME" <"$SEED_FILE"
log "시드 완료 — users 1 · wishlists 2 · wishlist_items 3 · sessions 1"
