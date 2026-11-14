# Linklet v2

리뉴얼 중인 새 앱. 프로젝트 설명·설계·실행 방법은 루트 [README.md](../README.md)와 [CLAUDE.md](../CLAUDE.md)를 본다.

## 로컬 DB (Docker Postgres)

`docker-compose.yml` — 개발용 `db` 와 통합 테스트용 `db-test` 두 서비스. 근거: `decisions/testing.md` T5, `decisions/db-migration.md` M3.

```bash
pnpm db:up            # db + db-test 기동, healthy 까지 대기 (docker compose up -d --wait)
pnpm db:down          # 컨테이너 정리. dev 데이터(named volume)는 남는다
pnpm db:down:clean    # 컨테이너 + 볼륨 삭제 — dev DB 초기화
pnpm db:test:up       # 테스트 DB 만 기동 (CI 가 아닌 로컬에서 통합 테스트만 돌릴 때)
pnpm db:test:down     # 테스트 DB 만 정리 (tmpfs 라 데이터도 사라진다)
```

| 서비스    | 컨테이너              | 호스트 포트       | DB 명              | 데이터                           |
| --------- | --------------------- | ----------------- | ------------------ | -------------------------------- |
| `db`      | `linklet-v2-db`       | `127.0.0.1:5433`  | `linklet_dev`      | named volume (유지)              |
| `db-test` | `linklet-v2-db-test`  | `127.0.0.1:5434`  | `linklet_test`     | tmpfs (내려가면 소멸)            |
| 기준선    | `linklet-baseline-db` | `127.0.0.1:54329` | `linklet_baseline` | tmpfs — `e2e/baseline/README.md` |

- 사용자·비밀번호는 둘 다 `linklet` / `linklet` — **로컬 더미 고정값**(시크릿 아님). 5432 는 다른 로컬 Postgres 와 충돌할 수 있어 피했다
- 포트 충돌 시 `LINKLET_DEV_DB_PORT`·`LINKLET_TEST_DB_PORT` 환경변수로 덮어쓴다. compose 는 `v2/.env` 를 `${}` 치환에만 읽으며 다른 키는 참조하지 않는다
- 이미지는 `postgres:17-alpine` — Neon 기본 메이저(17)·기준선 컨테이너와 동일. 프로젝트명 `linklet-v2` 로 기준선(`linklet-baseline`)과 컨테이너·네트워크·볼륨이 분리되어 동시에 떠도 겹치지 않는다
- `.env.local` 접속 문자열은 `.env.example` 의 주석 예시를 쓴다. 로컬은 풀링 구분이 없어 `DATABASE_URL` 과 `DATABASE_URL_UNPOOLED` 가 같은 값
- **운영·dev(Neon) 접속 문자열을 이 compose 나 로컬 스크립트에 절대 넣지 않는다.** 마이그레이션은 로컬 Docker → CI → dev → 운영 순서이며 운영 적용은 사용자가 직접(M3)
- CI 는 GitHub Actions service container(T5) 를 쓰므로 compose 를 읽지 않는다
- **테스트는 `vitest.setup.ts` 가 `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 를 `5434/linklet_test` 로 덮는다**(T10, 별도 `TEST_DATABASE_URL` 없음). 덮기 전 값이 로컬 호스트가 아니면 즉시 실패(값 미출력). `src/server/db.integration.test.ts` 는 5434 에 TCP 접속이 안 되면 skip — 돌리려면 `pnpm db:test:up`
- Prisma CLI(`prisma.config.ts`)는 `.env` 를 자동 로드하지 않아 `.env.local` → `.env` 순서로 직접 읽는다(셸 값 우선). 생성 클라이언트 `src/generated/prisma` 는 커밋하지 않고 `pnpm db:generate`(install 뒤 `postinstall` 포함)로 만든다
- "테스트마다 깨끗한 DB"(T5)는 컨테이너가 아니라 테스트 setup 의 책임이다 (마이그레이션 적용 후 테이블 비우기 — F02 통합 테스트에서 확정)

## 마이그레이션 (`pnpm db:migrate`)

근거: `decisions/db-migration.md` M1(생성은 `migrate dev` 로만)·M2(`down.sql` 동봉)·M3(운영 적용은 사용자 직접). 스크립트는 `scripts/db-migrate.mts` — Node 24 가 `.mts` 를 직접 실행한다(타입 스트리핑, 새 의존성 없음).

```bash
pnpm db:migrate add_wishlist            # 스키마를 고친 뒤: down.sql 생성 → prisma migrate dev --name add_wishlist → 새 폴더에 down.sql 저장
pnpm db:migrate add_view --create-only  # 적용하지 않고 폴더만 만든다 — migration.sql·down.sql 양쪽을 손으로 고친 뒤 `pnpm exec prisma migrate dev` 로 적용
```

- 이름은 snake_case(`a-z0-9_`). 결과는 `prisma/migrations/{타임스탬프}_{이름}/migration.sql` + `down.sql`, 둘 다 커밋한다
- `down.sql` 은 `prisma migrate diff --from-schema prisma/schema.prisma --to-migrations prisma/migrations --script` 의 출력 — "새 스키마 → 직전 마이그레이션까지의 상태" 로 되돌리는 SQL. **`migrate dev` 전에** 떠야 하므로 순서를 스크립트가 고정한다
  - 첫 마이그레이션(`migration_lock.toml` 이 아직 없음)은 `--to-migrations` 가 실패해 `--to-empty` 로 비교한다(7.10 실측 2026-11-14)
  - 스키마 변화가 없으면 멈춘다. 빈 마이그레이션이 필요하면 `--create-only` — `down.sql` 은 `-- This is an empty migration.` 자리표시자
- **섀도 DB**: `migrate dev` 는 로컬 `linklet` 이 superuser 라 임시 섀도 DB 를 스스로 만들고 지운다(설정 불필요). 반면 `migrate diff --to-migrations` 는 `datasource.shadowDatabaseUrl` 이 없으면 거부하므로, 스크립트가 같은 서버에 `linklet_shadow_{시각}` DB 를 `CREATE` 해 `LINKLET_SHADOW_DATABASE_URL` 로 `prisma.config.ts` 에 넘기고 끝나면 `DROP` 한다. 이 변수는 사람이 `.env` 에 둘 키가 아니다
- 되돌리기(로컬 확인 절차, 실측): `pnpm exec prisma db execute --file prisma/migrations/{폴더}/down.sql` → `_prisma_migrations` 에서 그 행 삭제(`echo "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '{폴더}';" | pnpm exec prisma db execute --stdin`) → `pnpm exec prisma migrate dev`(또는 `migrate deploy`)로 다시 적용. `migrate resolve --rolled-back` 은 **실패 상태**의 마이그레이션에만 쓴다

### 접속 문자열 환경 가드

판정은 `prisma/lib/local-db.mts` 하나 — 호스트가 `127.0.0.1`·`localhost`·`[::1]` 이면 로컬, 해석 불가·그 외는 전부 비로컬. 메시지에 값(호스트·비밀번호)은 절대 넣지 않는다.

| 진입점                               | 검사 대상                                             | 비로컬이면                                                                                                                                                                                            | 우회                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prisma.config.ts` (Prisma CLI 전체) | `DATABASE_URL_UNPOOLED`·`LINKLET_SHADOW_DATABASE_URL` | DB 에 붙는 명령(`migrate`·`db`·`studio`·그 외 전부)에서 throw. `generate`·`validate`·`format`·`version` 은 검사하지 않는다(Vercel·CI 의 `postinstall: prisma generate` 가 운영 env 와 함께 돌기 때문) | 셸에서 `LINKLET_ALLOW_REMOTE_DB=1 pnpm exec prisma migrate deploy` — `.env` 파일 값은 인정하지 않는다(env 로드 전에 읽음). dev·운영 적용은 이 방식으로 사용자가 직접(M3) |
| `pnpm db:migrate`                    | `DATABASE_URL_UNPOOLED`                               | 미설정·비로컬 모두 거부                                                                                                                                                                               | **없음** — 운영에 `migrate dev` 를 돌릴 일은 없다                                                                                                                        |
| `vitest.setup.ts`                    | `DATABASE_URL`·`DATABASE_URL_UNPOOLED` (덮기 전 값)   | 즉시 실패                                                                                                                                                                                             | 없음                                                                                                                                                                     |

CI service container 는 `127.0.0.1` 이라 모두 통과한다.

### 왜 profile 이 아니라 서비스 이름으로 고르는가

`db-test` 를 compose profile 로 두면 `docker compose down` 이 profile 서비스를 건드리지 않아(`--profile` 을 매번 붙여야 함) 테스트 컨테이너가 남는다. 두 서비스를 모두 기본 서비스로 두고, 테스트 DB 만 필요할 때는 `up db-test` / `rm -sfv db-test` 처럼 서비스 이름으로 고른다. `db:up`·`db:down` 한 쌍이 항상 전체를 다루므로 고아 컨테이너가 생기지 않는다.
