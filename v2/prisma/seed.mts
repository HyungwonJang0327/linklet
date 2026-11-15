import { resolve } from 'node:path'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client.ts'
import { loadEnvFiles } from './lib/load-env-files.mts'
import { assertLocalDatabaseUrl } from './lib/local-db.mts'

// 개발용 시드 — `pnpm db:seed`(= prisma db seed → prisma.config.ts migrations.seed → node prisma/seed.mts)
// 근거: decisions/db-migration.md(시드 행 — 운영에는 실행하지 않는다, 환경 가드)·M6, decisions/data-model.md D1~D7, FEATURES F02
//
// 실행 방식: Node 24 가 .mts 를 직접 실행한다(타입 스트리핑, tsx·dotenv 없음). 생성 클라이언트는 상대 경로 + 확장자로 import 한다
// (`@/` 별칭은 Node 가 모른다). 생성물이 `.ts` 라 Node 가 MODULE_TYPELESS_PACKAGE_JSON 경고를 내므로 seed 명령에서 그 경고만 끈다.
//
// Prisma 클라이언트를 여기서 하나 더 만드는 이유 (CLAUDE.md 함정 6 / AUDIT H6 의 명시 예외, 사용자 결정 2026-11-15):
//   함정 6 의 취지는 "앱 런타임 인스턴스 1곳(src/server/db.ts)" 이다. 이 파일은 CLI 가 1회 실행하고 끝나는 프로세스라 런타임과 커넥션 풀을
//   공유하지 않으며, src/server/db.ts 는 `server-only`·`@/` 별칭·전체 env 검증 때문에 Node 에서 직접 import 할 수 없다.
//   → 시드 전용 클라이언트 1개를 @prisma/adapter-pg 로 만들고 끝에 $disconnect 한다. 앱 코드에서 이 파일을 import 하지 않는다.
//
// 환경 가드 (운영·원격 DB 면 즉시 종료, 연결 시도 없음):
//   1. NODE_ENV=production 이면 거부
//   2. .env.local → .env 로드(셸 값 우선) 뒤 DATABASE_URL_UNPOOLED 가 없으면 거부
//   3. 호스트가 로컬(127.0.0.1·localhost·[::1])이 아니면 거부 — prisma.config.ts 와 같은 판정 모듈(prisma/lib/local-db.mts)
//   우회 없음: prisma.config.ts 의 LINKLET_ALLOW_REMOTE_DB 는 여기서 읽지 않는다(dev·운영에 시드를 넣을 일은 없다).
//   `prisma db seed` 로 실행하면 prisma.config.ts 의 M6 가드도 먼저 거친다(이중 가드, 의도된 것).
//   어떤 경로에서도 접속 문자열·호스트를 출력하지 않는다(키 이름·판정만).
//
// 멱등성: 모든 행을 **고정 UUID 로 upsert** 한다. 다시 돌려도 행 수가 늘지 않고, 손으로 바꾼 시드 행은 시드 상태로 돌아온다.
//   "시드 범위 먼저 삭제" 방식을 고르지 않은 이유: 삭제 기준(이메일·제목)이 개발 중 사용자가 만든 다른 행과 겹칠 수 있고,
//   고정 id 면 삭제 없이도 같은 결과가 나온다. 공유 ID(shareId)도 고정해 개발 중 공유 페이지 URL 이 바뀌지 않게 한다.
// 내용: 실제 사람·실제 상품 링크 금지 — 이메일은 예약 도메인 `.test`, 링크는 `example.com`. 테스트는 이 시드에 의존하지 않는다(T5).

const ROOT = resolve(import.meta.dirname, '..')
const DB_URL_KEY = 'DATABASE_URL_UNPOOLED'

function log(message: string): void {
  console.error(`[db:seed] ${message}`)
}

function fail(message: string): never {
  log(message)
  process.exit(1)
}

/** 오류 메시지에서 접속 문자열·host:port 처럼 보이는 토큰을 가린다 — 가드를 통과한 로컬 값이라도 출력하지 않는다 */
function maskConnectionDetails(message: string): string {
  return message.replace(/postgres(ql)?:\/\/\S+/gi, '***').replace(/\S+:\d{2,5}\b/g, '***')
}

/** 로컬 DB 가 아니면 즉시 종료하고, 로컬이면 접속 문자열을 돌려준다. 값은 출력하지 않는다 */
function localDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    fail(
      'refusing to seed with NODE_ENV=production (decisions/db-migration.md — seeds never run against production).',
    )
  }
  loadEnvFiles(ROOT)
  const value = process.env[DB_URL_KEY]?.trim()
  if (value === undefined || value === '') {
    fail(
      `${DB_URL_KEY} is not set. Put the local Docker connection string in .env.local (see .env.example) and run pnpm db:up.`,
    )
  }
  try {
    assertLocalDatabaseUrl(DB_URL_KEY, value, {
      hint: 'pnpm db:seed only runs against the local Docker DB (127.0.0.1) and has no override — LINKLET_ALLOW_REMOTE_DB is ignored here.',
    })
  } catch (error) {
    fail(error instanceof Error ? error.message : 'non-local database rejected')
  }
  return value
}

// ---------------------------------------------------------------------------
// 고정 ID (UUID 형식, 버전 nibble 7·variant 8 — 실제 uuid(7) 생성값과 겹치지 않는 0 영역). 다시 돌려도 같은 행을 가리킨다
// ---------------------------------------------------------------------------
const seedId = (group: number, n: number): string =>
  `00000000-0000-7000-8000-${String(group).padStart(4, '0')}${String(n).padStart(8, '0')}`

const USER_ID = seedId(1, 1)
const WISHLIST_ID = { birthday: seedId(2, 1), home: seedId(2, 2), notes: seedId(2, 3) }
const NOTICE_ID = { welcome: seedId(4, 1), draft: seedId(4, 2) }
const INQUIRY_ID = seedId(5, 1)

type ItemSeed = {
  n: number
  title: string
  description?: string
  productUrl: string
  imageUrl?: string
  siteName?: string
  price?: string // Decimal 은 문자열로 넘긴다(부동소수 오차 없음)
  currency?: string // ISO 4217
  position: number
  isReceived?: boolean
}

// 가격·통화를 섞고(KRW·USD·JPY·EUR·없음), 받음 표시도 섞는다. 링크는 전부 example.com
const ITEMS: Record<keyof typeof WISHLIST_ID, ItemSeed[]> = {
  birthday: [
    {
      n: 1,
      title: '무선 헤드폰',
      description: '노이즈 캔슬링, 블랙',
      productUrl: 'https://example.com/products/headphones',
      imageUrl: 'https://example.com/images/headphones.jpg',
      siteName: 'example.com',
      price: '329000.00',
      currency: 'KRW',
      position: 0,
    },
    {
      n: 2,
      title: '필름 카메라',
      productUrl: 'https://example.com/products/film-camera',
      siteName: 'example.com',
      price: '129.99',
      currency: 'USD',
      position: 1,
      isReceived: true,
    },
    {
      n: 3,
      title: '향초 세트',
      productUrl: 'https://example.com/products/candle-set',
      price: '3980.00',
      currency: 'JPY',
      position: 2,
    },
  ],
  home: [
    {
      n: 4,
      title: '리넨 커튼',
      productUrl: 'https://example.com/products/linen-curtain',
      imageUrl: 'https://example.com/images/curtain.jpg',
      siteName: 'example.com',
      price: '19.99',
      currency: 'EUR',
      position: 0,
    },
    {
      n: 5,
      title: '빈티지 스탠드 조명',
      description: '가격은 문의',
      productUrl: 'https://example.com/products/vintage-lamp',
      position: 1,
    },
  ],
  notes: [
    {
      n: 6,
      title: '언젠가 읽을 책',
      productUrl: 'https://example.com/products/book',
      price: '18000.00',
      currency: 'KRW',
      position: 0,
      isReceived: true,
    },
  ],
}

async function seed(db: PrismaClient): Promise<void> {
  const user = {
    name: 'Linklet Dev',
    email: 'dev@linklet.test', // 예약 TLD — 실제 주소가 아니다
    emailVerified: true,
    bio: '로컬 개발용 더미 계정',
  }
  await db.user.upsert({ where: { id: USER_ID }, create: { id: USER_ID, ...user }, update: user })

  const wishlists = [
    {
      id: WISHLIST_ID.birthday,
      title: '올해 생일 위시리스트',
      description: '친구들에게 공유하는 목록',
      shareId: 'seedbirthday',
      isPublic: true,
      category: 'birthday' as const,
    },
    {
      id: WISHLIST_ID.home,
      title: '집 꾸미기',
      description: null,
      shareId: 'seedsomeday1',
      isPublic: true,
      category: 'someday' as const,
    },
    {
      id: WISHLIST_ID.notes,
      title: '비공개 메모',
      description: '나만 보는 목록',
      shareId: 'seedprivate1',
      isPublic: false,
      category: null,
    },
  ]
  for (const { id, ...data } of wishlists) {
    await db.wishlist.upsert({
      where: { id },
      create: { id, userId: USER_ID, ...data },
      update: data,
    })
  }

  for (const [key, items] of Object.entries(ITEMS) as [keyof typeof WISHLIST_ID, ItemSeed[]][]) {
    for (const { n, ...item } of items) {
      const id = seedId(3, n)
      const data = {
        title: item.title,
        description: item.description ?? null,
        productUrl: item.productUrl,
        imageUrl: item.imageUrl ?? null,
        siteName: item.siteName ?? null,
        price: item.price ?? null,
        currency: item.currency ?? null,
        position: item.position,
        isReceived: item.isReceived ?? false,
      }
      await db.wishlistItem.upsert({
        where: { id },
        create: { id, wishlistId: WISHLIST_ID[key], ...data },
        update: data,
      })
    }
  }

  const notices = [
    {
      id: NOTICE_ID.welcome,
      title: 'Linklet v2 로컬 개발 환경',
      content: '이 공지는 시드 데이터입니다. 고정 상단(isPinned)·공개(isPublished) 상태 확인용.',
      isPublished: true,
      isPinned: true,
    },
    {
      id: NOTICE_ID.draft,
      title: '작성 중인 공지 (비공개)',
      content: '관리자 화면에서만 보여야 한다.',
      isPublished: false,
      isPinned: false,
    },
  ]
  for (const { id, ...data } of notices) {
    await db.notice.upsert({ where: { id }, create: { id, ...data }, update: data })
  }

  const inquiry = {
    type: 'feedback' as const,
    subject: '시드 문의',
    content: '문의 목록·상세 화면 확인용 더미 문의입니다.',
    status: 'pending' as const,
  }
  await db.inquiry.upsert({
    where: { id: INQUIRY_ID },
    create: { id: INQUIRY_ID, userId: USER_ID, ...inquiry },
    update: inquiry,
  })
}

async function main(): Promise<void> {
  const connectionString = localDatabaseUrl()
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    errorFormat: 'minimal',
  })
  try {
    await seed(db)
    const [users, wishlists, items, notices, inquiries] = await Promise.all([
      db.user.count(),
      db.wishlist.count(),
      db.wishlistItem.count(),
      db.notice.count(),
      db.inquiry.count(),
    ])
    log(
      `done — rows now: users=${users} wishlists=${wishlists} items=${items} notices=${notices} inquiries=${inquiries}`,
    )
  } finally {
    await db.$disconnect()
  }
}

main().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : 'Error'
  const message = error instanceof Error ? maskConnectionDetails(error.message) : String(error)
  fail(`${name}: ${message}`)
})
