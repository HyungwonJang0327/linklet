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
- "테스트마다 깨끗한 DB"(T5)는 컨테이너가 아니라 테스트 setup 의 책임이다 (마이그레이션 적용 후 테이블 비우기 — F02 통합 테스트에서 확정)

### 왜 profile 이 아니라 서비스 이름으로 고르는가

`db-test` 를 compose profile 로 두면 `docker compose down` 이 profile 서비스를 건드리지 않아(`--profile` 을 매번 붙여야 함) 테스트 컨테이너가 남는다. 두 서비스를 모두 기본 서비스로 두고, 테스트 DB 만 필요할 때는 `up db-test` / `rm -sfv db-test` 처럼 서비스 이름으로 고른다. `db:up`·`db:down` 한 쌍이 항상 전체를 다루므로 고아 컨테이너가 생기지 않는다.
