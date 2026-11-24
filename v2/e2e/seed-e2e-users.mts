import { PrismaPg } from '@prisma/adapter-pg'

import { assertLocalDatabaseUrl } from '../prisma/lib/local-db.mts'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { E2E_USERS, e2eSessionExpiresAt } from './helpers/e2e-env.ts'

// E2E 사용자·세션 시드 — e2e/global-setup.ts 가 `node e2e/seed-e2e-users.mts` 로 1회 실행한다(DATABASE_URL_UNPOOLED=테스트 DB).
// 근거: decisions/testing.md(E2E 인증 — 시드 사용자·세션 주입)·T13, FEATURES F08·F09, 사용자 결정 2026-11-24(세션 주입 = 시드 세션 행 + 테스트 코드가 서명 쿠키 생성)
//
// 별도 Node 프로세스인 이유: 생성 클라이언트(src/generated/prisma, moduleFormat esm)는 import.meta 를 쓰는데 Playwright 는 .ts 를 CommonJS 로
//   변환해 로드하므로 globalSetup 안에서 import 할 수 없다(정적·동적 모두, 2026-11-25 실측). Node 24 는 .mts·.ts 를 직접 실행한다(prisma/seed.mts 와 같은 방식).
// Prisma 클라이언트를 여기서 하나 더 만드는 이유(CLAUDE.md 함정 6 / AUDIT H6 의 예외 — prisma/seed.mts 와 같은 성격):
//   1회 실행 후 끝나는 테스트 프로세스라 앱 런타임(src/server/db.ts)과 커넥션 풀을 공유하지 않는다. src/server/db.ts·test-db.ts 는
//   `server-only`·`@/` 별칭·전체 env 검증 때문에 Node 에서 직접 import 할 수 없다. 끝에 $disconnect 한다. 앱 코드는 이 파일을 import 하지 않는다.
// 가드: DATABASE_URL_UNPOOLED 가 없거나 호스트가 로컬이 아니면 연결 시도 없이 종료(prisma/lib/local-db.mts, 우회 없음). NODE_ENV=production 거부.
// 멱등: 고정 UUID(e2e-env.ts)로 upsert — 두 번 돌려도 행이 늘지 않는다. TRUNCATE 하지 않는다.
// 출력: 행 수만. 접속 문자열·호스트는 어디에도 출력하지 않고, 실패도 error.name·코드만 남긴다(message 에 접속 정보가 섞일 수 있다).

const DB_URL_KEY = 'DATABASE_URL_UNPOOLED'

function log(message: string): void {
  console.error(`[e2e seed] ${message}`)
}

function fail(message: string): never {
  log(message)
  process.exit(1)
}

/** 실패 분류만 — error.name + 드라이버(pg)·Prisma 코드. message 는 버린다 */
function describeFailure(error: unknown): string {
  if (!(error instanceof Error)) return `non-error thrown (${typeof error})`
  const { code, errorCode } = error as Error & { code?: unknown; errorCode?: unknown }
  const found =
    (typeof code === 'string' && code !== '' && code) ||
    (typeof errorCode === 'string' && errorCode !== '' && errorCode) ||
    undefined
  return found === undefined ? error.name : `${error.name} (${found})`
}

function localDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') fail('refusing to seed with NODE_ENV=production')
  const value = process.env[DB_URL_KEY]?.trim()
  if (value === undefined || value === '') {
    fail(`${DB_URL_KEY} is not set — e2e/global-setup.ts passes the local test DB here.`)
  }
  try {
    assertLocalDatabaseUrl(DB_URL_KEY, value, {
      hint: 'E2E seeding only runs against the local Docker test DB (127.0.0.1) and has no override.',
    })
  } catch (error) {
    fail(error instanceof Error ? error.message : 'non-local database rejected')
  }
  return value
}

async function seed(db: PrismaClient): Promise<void> {
  const expiresAt = e2eSessionExpiresAt()
  for (const account of Object.values(E2E_USERS)) {
    const user = {
      name: account.name,
      email: account.email,
      emailVerified: true,
      role: account.role,
      banned: false,
      banReason: null,
      banExpires: null,
    }
    await db.user.upsert({
      where: { id: account.id },
      create: { id: account.id, ...user },
      update: user,
    })
    const session = {
      userId: account.id,
      token: account.sessionToken,
      expiresAt,
      ipAddress: null,
      userAgent: null,
      impersonatedBy: null,
    }
    await db.session.upsert({
      where: { id: account.sessionId },
      create: { id: account.sessionId, ...session },
      update: session,
    })
  }
}

async function main(): Promise<void> {
  const connectionString = localDatabaseUrl()
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    errorFormat: 'minimal',
  })
  try {
    await seed(db)
    const [users, sessions] = await Promise.all([db.user.count(), db.session.count()])
    log(`E2E users seeded — rows now: users=${users} sessions=${sessions}`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error: unknown) => {
  fail(`${describeFailure(error)} — message withheld (may contain connection details)`)
})
