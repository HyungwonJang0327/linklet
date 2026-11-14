# DB 마이그레이션 규칙 (v2)

## 결정

| # | 항목 | 결정 |
|---|---|---|
| M1 | 생성 방식 | `prisma migrate dev --name {snake_case_설명}` 로만. 파일명은 Prisma 기본(`YYYYMMDDHHMMSS_{이름}/migration.sql`). **`prisma db push` 금지** (예외: 기존 앱 기준선 E2E 전용 로컬 컨테이너 — `testing.md` T8) |
| M2 | 되돌리기 | 마이그레이션마다 역방향 SQL `down.sql` 을 같은 폴더에 함께 커밋. 생성은 Prisma 7 공식 절차(2026-11-11 문서 확인): **스키마를 고친 뒤 `migrate dev` 전에** `prisma migrate diff --from-schema prisma/schema.prisma --to-migrations prisma/migrations --script > down.sql` → `migrate dev --name {이름}` → 새 폴더로 `down.sql` 이동. 이 세 단계를 `pnpm db:migrate {이름}` 래퍼 하나로. 수동 SQL(뷰·트리거)은 `--create-only` 후 양쪽에 손으로 추가. 운영 롤백은 `prisma db execute --file down.sql` 뒤 `_prisma_migrations` 의 해당 행 삭제(적용 완료 마이그레이션은 `migrate resolve --rolled-back` 대상이 아님 — 그 명령은 **실패 상태** 전용, 2026-11-14 실측). 구현 메모(2026-11-14): 첫 마이그레이션은 `migration_lock.toml` 이 없어 `--to-migrations` 가 실패하므로 `--to-empty`; `--to-migrations` 는 `datasource.shadowDatabaseUrl` 을 요구하고 스스로 만들지 않아 래퍼가 같은 로컬 서버에 임시 DB 를 CREATE → `LINKLET_SHADOW_DATABASE_URL` 로 넘김 → DROP |
| M5 | ID 생성 | **PK는 UUID v7** — `String @id @default(uuid(7)) @db.Uuid`(Prisma Client 생성, 시간 순 정렬, 16바이트). Better Auth 는 `advanced.database.generateId: false` 로 자체 생성을 끄고 CLI 가 만든 인증 모델에 같은 `@default` 를 붙여 **전 테이블 한 방식**. 공유 ID(R8)는 PK 와 별도로 `@default(nanoid(12))` 추측 불가 문자열. 번호 id·serial 없음 |
| M3 | 적용 순서 | 로컬 Docker DB → CI(빈 DB에 전체 적용 검증) → dev DB → 운영. **운영 적용은 사용자가 직접 실행**. `.claude/settings.json` 에서 마이그레이션 적용 명령은 항상 확인 |
| M6 | CLI 접속 가드 | `prisma.config.ts` 가 `DATABASE_URL_UNPOOLED` 의 호스트가 로컬(127.0.0.1·localhost·[::1])이 아니면 DB 에 붙는 명령(migrate·db·studio·그 외 전부, fail-closed)에서 throw. 값은 출력하지 않는다. 예외: DB 없는 명령(generate·validate·format·version·init·debug)은 Vercel·CI `postinstall: prisma generate` 때문에 가드 생략. 우회는 **셸 값** `LINKLET_ALLOW_REMOTE_DB=1` 만(.env 파일 값은 무시) — dev·운영 적용 시 사용자가 붙여 직접 실행. `pnpm db:migrate` 래퍼는 우회 없이 로컬만. 판정 함수는 `prisma/lib/local-db.mts` 하나를 CLI·래퍼·Vitest setup·시드가 공유 |
| — | 연결 | 런타임은 pooled `DATABASE_URL`(`@prisma/adapter-pg`, TCP — `tech-stack.md` 2026-11-14), CLI(`prisma.config.ts`)는 `DATABASE_URL_UNPOOLED`. 테스트는 같은 키를 setup 이 덮는다(`testing.md` T10) |
| — | 시드 | `prisma/seed.ts` — 개발·테스트용 사용자·위시리스트·아이템. 운영에는 실행하지 않는다(환경 가드) |

실데이터 없음(사용자 확인) → 데이터 이전 스크립트는 만들지 않는다. v2는 빈 DB에서 첫 마이그레이션부터 시작한다.

## 이유

- 리뉴얼 전 2025-09 이후 스키마 변경이 마이그레이션에 없고 `db push` 로만 반영 → 새 DB 재현 불가(AUDIT H5)
- 되돌리기 경로가 있어야 잘못된 스키마 변경을 안전하게 되돌린다(킥오프: 첫 마이그레이션과 되돌리기를 함께)
- 운영 DB 변경은 되돌리기 어려운 외부 작업 → 사람이 확인하고 실행

## 기각된 대안

- `db push` 운용 — 이력 없음, 재현 불가(현재 문제 그 자체)
- 전진 전용(수정은 새 마이그레이션으로만) — 첫 배포 전 잦은 스키마 변경에서 되돌리기 비용이 큼
- 배포 파이프라인에서 운영 자동 적용 — 실수가 곧바로 운영에 반영

## 확장 지점

새 테이블·컬럼은 `schema.prisma` 수정 → `migrate dev` → `down.sql` 생성 스크립트 실행, 세 단계만 거친다.

## 결정일

2026-09-27

## 갱신 이력

- 2026-09-27 최초 결정 (사용자: 추천대로)
- 2026-10-04 M1에 기준선 E2E 전용 로컬 DB 예외 명시 (testing T8)
- 2026-11-11 M2 `down.sql` 명령 확정(`--to-migrations`, 래퍼 스크립트화 — 사용자: 추천안. 기각: `--to-config-datasource` 는 로컬 DB 최신 전제·CI 검증 어려움 / 수기 작성은 빠뜨리기 쉬움), M5 ID 생성 UUID v7 추가(사용자: 추천안. 기각: cuid2 정렬 불가·문자열 인덱스 / Better Auth 기본값 혼용은 형식 두 가지)
- 2026-11-14 M2 구현 메모(`--to-empty`·임시 섀도 DB·롤백 절차 수정), M6 CLI 접속 가드 추가 (메인 판단: generate 예외·셸 값만 인정. 기각: 비로컬이면 무조건 throw — Vercel 빌드의 generate 가 운영 env 와 함께 돌아 깨짐 / compose 에 고정 섀도 DB + env 키 — env 스키마·테스트까지 번짐)
