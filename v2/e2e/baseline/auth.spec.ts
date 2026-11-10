import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { SEED_SESSIONS, sessionHeaders, signInWithSeedSession } from './helpers'

// 기준선 — 기존 앱 로그인 흐름의 **현재 동작** 고정 (decisions/testing.md T7·T8·T9)
// 대상: `pnpm baseline:up` 으로 3001 에 띄운 기존 앱(루트). 데이터는 e2e/baseline/seed.sql. 로그인은 시드 세션 쿠키 주입(helpers.ts).
// 알려진 버그(H1 shareUrl 접두사, H3 이메일 노출, H9 native confirm·클릭 가능한 div)도 고치지 않고 현재 값 그대로 단언한다.
// 셀렉터는 역할·라벨·텍스트·placeholder 기반만 쓴다 (루트 앱 수정 금지). 외부 네트워크는 타지 않는다.
//
// 사용자 2명을 나눠 쓴다 (seed.sql 주석 참고):
// - baseline-user  : 시드 위시리스트 2개 소유. 읽기 전용(목록·한도·라우트 보호). public.spec.ts 와 병렬로 돌아도 안전
// - baseline-editor: 위시리스트 0개. 생성→아이템→수정→받음→삭제를 `describe.serial` 로 한 워커에서 순서대로 실행.
//   재시드(TRUNCATE) 대신 beforeAll 에서 editor 소유 위시리스트를 API 로 지워 재실행 독립성을 확보한다 —
//   재시드는 병렬 워커의 public.spec.ts 가 읽는 시드 행을 지우는 순간이 생기기 때문

const APP_ORIGIN = 'http://localhost:3001'

type WishlistDto = {
  id: string
  title: string
  description: string | null
  shareUrl: string
  isPublic: boolean
  category: string
  userId: string
  customization: { profile: { displayName: string } } | null
  items: ItemDto[]
  user: { id: string; name: string | null; email: string | null }
}

type ItemDto = {
  id: string
  title: string
  productUrl: string
  price: string | null
  isCompleted: boolean
}

test.describe('기존 앱 기준선 — 라우트 보호 (비로그인)', () => {
  // F09 — middleware.ts 가 `(kr|en|jp)/settings/*` 에서 세션 쿠키가 없으면 `/{locale}/login` 으로 307
  test('비로그인으로 /kr/settings·/kr/settings/wishlists 에 가면 /kr/login 으로 307 리다이렉트된다', async ({
    request,
    page,
  }) => {
    for (const path of ['/kr/settings', '/kr/settings/wishlists']) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(307)
      expect(response.headers()['location'], path).toBe('/kr/login')
    }

    await page.goto('/kr/settings/wishlists')
    await expect(page).toHaveURL(/\/kr\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Linklet' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google 로그인' })).toBeVisible()
  })

  // F09 · F13 — 미들웨어는 쿠키 **존재**만 본다. sessions 에 없는 토큰이면 페이지는 200 으로 열리고
  // 클라이언트 AuthGuard 가 "로그인이 필요한 페이지입니다." 를 띄운다 (v2 는 proxy + 서비스에서 세션 검증)
  test('sessions 에 없는 토큰 쿠키는 미들웨어를 통과하고 클라이언트 가드가 로그인 안내를 보여 준다', async ({
    context,
    page,
    request,
  }) => {
    const bogus = { cookie: 'next-auth.session-token=not-a-seeded-token' }
    const session = await request.get('/api/auth/session', { headers: bogus })
    expect(session.status()).toBe(200)
    expect(await session.json()).toEqual({})

    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'not-a-seeded-token',
        domain: 'localhost',
        path: '/',
      },
    ])
    const response = await page.goto('/kr/settings/wishlists')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/kr\/settings\/wishlists$/)
    await expect(page.getByText('로그인이 필요한 페이지입니다.')).toBeVisible()
    await expect(page.getByRole('link', { name: '로그인하기' })).toHaveAttribute(
      'href',
      '/kr/login',
    )
  })

  // F13 · H4 — 본인 목록(`?userId=`)과 생성은 requireAuth 로 401. (비로그인 `GET /api/wishlists` 가 200 인 것은 public.spec.ts)
  test('비로그인 GET /api/wishlists?userId= 와 POST /api/wishlists 는 401 을 반환한다', async ({
    request,
  }) => {
    const list = await request.get('/api/wishlists?userId=baseline-user')
    expect(list.status()).toBe(401)
    expect(await list.json()).toEqual({ error: 'Authentication required. Please sign in.' })

    const create = await request.post('/api/wishlists', { data: { title: 'Unauthenticated' } })
    expect(create.status()).toBe(401)
  })
})

test.describe('기존 앱 기준선 — 로그인 상태 (시드 세션 baseline-user)', () => {
  test.beforeEach(async ({ context }) => {
    await signInWithSeedSession(context, SEED_SESSIONS.tester)
  })

  // F08 — DB 세션: 쿠키 토큰 = sessions.sessionToken 으로 사용자가 조회된다. 응답에 이메일 포함(현재 동작)
  test('시드 세션 쿠키로 /api/auth/session 이 baseline-user 를 반환한다', async ({ request }) => {
    const response = await request.get('/api/auth/session', {
      headers: sessionHeaders(SEED_SESSIONS.tester),
    })

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({
      user: { id: 'baseline-user', name: 'Baseline Tester', isAdmin: false },
      expires: '2099-01-01T00:00:00.000Z',
    })
  })

  // F09 — 로그인 상태의 /kr/settings 는 서버 페이지가 /kr/settings/wishlists 로 보낸다 (랜딩 CTA "시작하기" 의 목적지)
  test('로그인 상태로 /kr/settings 에 가면 /kr/settings/wishlists 로 이동한다', async ({
    page,
  }) => {
    await page.goto('/kr/settings')

    await expect(page).toHaveURL(/\/kr\/settings\/wishlists$/)
    await expect(page.getByRole('heading', { level: 1, name: '콘텐츠 관리' })).toBeVisible()
  })

  // F13 — 내 위시리스트 목록: 시드 2개(공개·비공개)가 카드로 보인다. 카드 전체가 클릭 가능한 div (H9), 제목은 h3
  test('/kr/settings/wishlists 에 시드 위시리스트 2개(공개·비공개)가 보인다', async ({ page }) => {
    await page.goto('/kr/settings/wishlists')

    await expect(page.getByRole('heading', { level: 1, name: '콘텐츠 관리' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Baseline Public Wishlist' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Baseline Private Wishlist' }),
    ).toBeVisible()
    await expect(page.getByText('3 아이템')).toBeVisible()
    await expect(page.getByText('0 아이템')).toBeVisible()
    await expect(page.getByText('공개 위시리스트', { exact: true })).toBeVisible()
    await expect(page.getByText('비공개 위시리스트', { exact: true })).toBeVisible()
    // 시드 데이터로 재현하지 않은 상태(비어 있음)는 아래 editor 시나리오에서 고정한다
    await expect(page.getByText('아직 생성된 위시리스트가 없습니다')).toHaveCount(0)
  })

  // F39 (usageLimit) · F14 — 사용자당 위시리스트 2개 한도(APP_CONFIG.maxWishlistsPerUser.free).
  // 목록의 생성 버튼은 이동 없이 토스트, API 는 403 + 식별자 문자열 `WISHLIST_LIMIT_REACHED` 를 `error` 에 담는다
  test('위시리스트가 2개면 생성 버튼은 한도 토스트를 띄우고 POST /api/wishlists 는 403 WISHLIST_LIMIT_REACHED 다', async ({
    page,
    request,
  }) => {
    await page.goto('/kr/settings/wishlists')
    await expect(
      page.getByRole('heading', { level: 3, name: 'Baseline Public Wishlist' }),
    ).toBeVisible()

    await page.getByRole('button', { name: '새 위시리스트 만들기' }).click()
    await expect(page.getByText('위시리스트는 최대 2개까지만 만들 수 있습니다')).toBeVisible()
    await expect(page).toHaveURL(/\/kr\/settings\/wishlists$/)

    const response = await request.post('/api/wishlists', {
      headers: sessionHeaders(SEED_SESSIONS.tester),
      data: { title: 'Third Wishlist', productLinks: [] },
    })
    expect(response.status()).toBe(403)
    expect(await response.json()).toEqual({
      error: 'WISHLIST_LIMIT_REACHED',
      message: 'You can only create up to 2 wishlists',
      limit: 2,
      current: 2,
    })
  })
})

test.describe('기존 앱 기준선 — 생성·아이템·수정·받음·삭제 (시드 세션 baseline-editor)', () => {
  // 상태를 공유하는 흐름이라 한 워커에서 순서대로 실행한다. 앞 테스트가 실패하면 뒤는 건너뛴다
  test.describe.configure({ mode: 'serial' })

  const CREATED = {
    title: 'Baseline Created Wishlist',
    description: '기준선 E2E 가 만든 위시리스트',
  }
  const ITEM = {
    title: 'Baseline Added Item',
    productUrl: 'https://example.com/products/baseline-added',
    editedTitle: 'Baseline Added Item (edited)',
    priceInput: '129000',
    priceStored: '129,000',
    priceShown: '129,000원',
  }

  // 테스트 간 공유 상태 (serial)
  let wishlistId = ''
  let shareUrl = ''
  let itemId = ''

  let api: APIRequestContext

  test.beforeAll(async ({ playwright }, testInfo) => {
    const { baseURL, userAgent } = testInfo.project.use
    api = await playwright.request.newContext({
      baseURL,
      userAgent,
      extraHTTPHeaders: sessionHeaders(SEED_SESSIONS.editor),
    })
    // 재실행 독립성: editor 가 가진 위시리스트를 전부 지운다 (재시드 대신, 파일 상단 설명 참고)
    const list = await api.get('/api/wishlists?userId=baseline-editor')
    expect(list.status()).toBe(200)
    for (const wishlist of (await list.json()) as WishlistDto[]) {
      expect((await api.delete(`/api/wishlists/${wishlist.id}`)).status()).toBe(200)
    }
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test.beforeEach(async ({ context }) => {
    await signInWithSeedSession(context, SEED_SESSIONS.editor)
  })

  // 상세 페이지로 가서 로딩이 끝날 때까지 기다린다 (클라이언트 fetch 뒤 h1 렌더)
  async function openDetail(page: Page): Promise<void> {
    await page.goto(`/kr/settings/wishlists/${wishlistId}`)
    await expect(page.getByRole('heading', { level: 1, name: CREATED.title })).toBeVisible()
  }

  // F13 "비어 있음" 상태 — 안내 문구 + 생성 카드
  test('위시리스트가 없으면 목록은 비어 있음 안내와 생성 카드를 보여 준다', async ({ page }) => {
    await page.goto('/kr/settings/wishlists')

    await expect(page.getByRole('heading', { level: 1, name: '콘텐츠 관리' })).toBeVisible()
    await expect(page.getByText('아직 생성된 위시리스트가 없습니다')).toBeVisible()
    await expect(page.getByRole('button', { name: '새 위시리스트 만들기' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1) // 생성 카드 하나뿐
  })

  // F14 — 현재 생성 페이지는 **상품 링크 1개 이상이 필수**이고, 입력한 링크는 /api/metadata 로 자동 추출이
  // 끝나야(= 서버가 외부 URL 을 fetch) 제출 버튼이 켜진다. 제목만으로는 생성할 수 없다.
  // 그래서 이 spec 은 UI 생성을 "제목만 제출 → 검증 오류" 까지만 고정하고, 실제 생성은 API 로 한다 (다음 테스트).
  // v2 는 링크 없이도 만들 수 있는 캐주얼 흐름으로 재설계 (FEATURES F14)
  test('생성 페이지에서 제목만 입력해 제출하면 상품 URL 필수 오류가 나고 생성되지 않는다', async ({
    page,
  }) => {
    await page.goto('/kr/settings/wishlists')
    await page.getByRole('button', { name: '새 위시리스트 만들기' }).click()
    await expect(page).toHaveURL(/\/kr\/settings\/wishlists\/create$/)
    await expect(
      page.getByRole('heading', { level: 1, name: '새 위시리스트 만들기' }),
    ).toBeVisible()

    // 라벨이 input 과 연결돼 있지 않아 placeholder 로 찾는다 (H9 계열, v2 는 <label htmlFor>)
    await page.getByPlaceholder('예: 2024년 생일 선물').fill(CREATED.title)
    await page.getByRole('button', { name: '만들기', exact: true }).click()

    await expect(page.getByText('상품 URL을 한 개 이상 입력해주세요.')).toBeVisible()
    await expect(page).toHaveURL(/\/kr\/settings\/wishlists\/create$/)
    expect(
      ((await (await api.get('/api/wishlists?userId=baseline-editor')).json()) as unknown[]).length,
    ).toBe(0)
  })

  // F14 · F15 · F16 · F23(H1) · H3 — API 생성 응답 형태를 고정하고, 목록 반영 → 상세 진입을 UI 로 확인
  test('API 로 생성하면 201 과 `w/` 접두사 shareUrl(H1) 을 돌려주고 목록·상세에 반영된다', async ({
    page,
  }) => {
    const response = await api.post('/api/wishlists', {
      data: {
        title: CREATED.title,
        description: CREATED.description,
        isPublic: true,
        category: 'GENERAL',
        productLinks: [],
      },
    })
    expect(response.status()).toBe(201)
    const body = (await response.json()) as WishlistDto

    expect(body).toMatchObject({
      title: CREATED.title,
      description: CREATED.description,
      isPublic: true,
      category: 'GENERAL',
      userId: 'baseline-editor',
      items: [],
      // H3 — 생성 응답에 소유자 이메일이 포함된다 (v2 는 제거)
      user: { id: 'baseline-editor', email: 'baseline-editor@example.com' },
      // 생성 시 기본 꾸미기가 들어가고 displayName 은 사용자 이름이다 (F26)
      customization: { profile: { displayName: 'Baseline Editor' } },
    })
    expect(typeof body.id).toBe('string')
    // H1 — 저장값에 경로 접두사 `w/` 가 섞인다 (CLAUDE.md 함정 1). 공유 링크가 어떻게 깨지는지는 아래 "공유 링크" 테스트
    expect(body.shareUrl).toMatch(/^w\/[a-z0-9]{24}$/)
    wishlistId = body.id
    shareUrl = body.shareUrl

    await page.goto('/kr/settings/wishlists')
    const title = page.getByRole('heading', { level: 3, name: CREATED.title })
    await expect(title).toBeVisible()
    await expect(page.getByText(CREATED.description)).toBeVisible()
    await expect(page.getByText('0 아이템')).toBeVisible()
    await expect(page.getByText('공개 위시리스트', { exact: true })).toBeVisible()

    // 카드 전체가 onClick 을 가진 div 다 (H9). 제목을 눌러 상세로 들어간다
    await title.click()
    await expect(page).toHaveURL(new RegExp(`/kr/settings/wishlists/${wishlistId}$`))
    await expect(page.getByRole('heading', { level: 1, name: CREATED.title })).toBeVisible()
    await expect(page.getByText('이 위시리스트에 아이템이 없습니다')).toBeVisible()
  })

  // F19 — 아이템 추가 다이얼로그(제목·URL 두 칸뿐, 가격 칸 없음). 제출하면 **항상** /api/metadata 로 자동 추출을
  // 먼저 시도한다. 외부 네트워크를 타지 않도록 브라우저에서 그 요청만 끊는다(서버에 닿지 않음) — 기존 앱은 추출 실패를
  // "메타데이터 없이 추가" 경로로 처리하므로 그 현재 동작을 고정하는 셈이다. 가격은 다음 테스트(수정)에서 넣는다
  test('상세에서 아이템 추가 다이얼로그로 제목·URL 을 수동 입력하면 그리드에 보인다', async ({
    page,
  }) => {
    let metadataCalls = 0
    await page.route('**/api/metadata', async (route) => {
      metadataCalls += 1
      await route.abort('failed')
    })
    await openDetail(page)

    await page.getByRole('button', { name: '아이템 추가', exact: true }).click()
    await expect(page.getByRole('heading', { level: 2, name: '아이템 추가' })).toBeVisible()
    await page.getByPlaceholder('상품명').fill(ITEM.title)
    await page.getByPlaceholder('https://example.com/product').fill(ITEM.productUrl)
    await page.getByRole('button', { name: '추가하기', exact: true }).click()

    await expect(
      page.getByText('상품이 추가되었습니다. 상품 정보를 수동으로 입력해주세요.'),
    ).toBeVisible()
    expect(metadataCalls).toBe(1)
    await expect(page.getByRole('heading', { level: 2, name: '아이템 추가' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 3, name: ITEM.title })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '아이템 목록 (1/1)' })).toBeVisible()
    await expect(page.getByRole('button', { name: '상품 보기' })).toBeVisible()

    const detail = (await (await api.get(`/api/wishlists/${wishlistId}`)).json()) as WishlistDto
    expect(detail.items).toHaveLength(1)
    expect(detail.items[0]).toMatchObject({
      title: ITEM.title,
      productUrl: ITEM.productUrl,
      price: null,
      isCompleted: false,
    })
    itemId = detail.items[0]!.id
  })

  // F21 — 수정: 카드(클릭 가능한 div, H9) → 상세 다이얼로그 → "편집" → 수정 다이얼로그. 가격 입력은 숫자만 남겨
  // 천 단위 구분으로 저장("129,000")되고 카드는 "원" 을 붙여 보여 준다. 직접 만든 모달이라 role=dialog 가 없어
  // 버튼은 문서 끝에 렌더되는 다이얼로그 쪽(.last())을 고른다
  test('아이템 제목과 가격을 수정하면 카드와 API 에 반영된다', async ({ page }) => {
    await openDetail(page)

    await page.getByRole('heading', { level: 3, name: ITEM.title }).click()
    await expect(page.getByRole('heading', { level: 2, name: '아이템 상세' })).toBeVisible()
    await page.getByRole('button', { name: '편집', exact: true }).last().click()
    await expect(page.getByRole('heading', { level: 2, name: '아이템 수정' })).toBeVisible()

    const titleInput = page.getByPlaceholder('상품 제목')
    await expect(titleInput).toHaveValue(ITEM.title)
    await titleInput.fill(ITEM.editedTitle)
    const priceInput = page.getByPlaceholder('29,900원')
    await priceInput.fill(ITEM.priceInput)
    await expect(priceInput).toHaveValue(ITEM.priceStored)
    await page.getByRole('button', { name: '저장하기' }).click()

    await expect(page.getByText('아이템이 수정되었습니다')).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: ITEM.editedTitle })).toBeVisible()
    await expect(page.getByText(ITEM.priceShown)).toBeVisible()

    const detail = (await (await api.get(`/api/wishlists/${wishlistId}`)).json()) as WishlistDto
    expect(detail.items[0]).toMatchObject({
      id: itemId,
      title: ITEM.editedTitle,
      price: ITEM.priceStored,
      productUrl: ITEM.productUrl,
    })
  })

  // F21 · F16 — 받음 표시: 카드의 체크박스(title "받음 처리"/"받음 취소")가 유일한 토글이다. 받으면 제목에 취소선,
  // 상단 통계의 받음 비율이 100% 가 된다. 이미지가 없는 아이템엔 "받음" 배지가 따로 없다 (v2 는 명시적 상태 표시)
  test('받음 체크박스를 켜면 상태가 바뀌고 카드·통계·API 에 반영된다', async ({ page }) => {
    await openDetail(page)

    const checkbox = page.getByRole('checkbox')
    await expect(checkbox).toHaveCount(1)
    await expect(checkbox).not.toBeChecked()
    await expect(checkbox).toHaveAttribute('title', '받음 처리')
    await checkbox.click()

    await expect(page.getByText('상태가 변경되었습니다')).toBeVisible()
    await expect(checkbox).toBeChecked()
    await expect(checkbox).toHaveAttribute('title', '받음 취소')
    await expect(page.getByRole('heading', { level: 3, name: ITEM.editedTitle })).toHaveClass(
      /line-through/,
    )
    await expect(page.getByText('100%')).toBeVisible()

    const detail = (await (await api.get(`/api/wishlists/${wishlistId}`)).json()) as WishlistDto
    expect(detail.items[0]).toMatchObject({ id: itemId, isCompleted: true })
  })

  // F21 · H9 — 삭제는 native `confirm` 이다. 상세 다이얼로그의 "삭제" → confirm 수락 → 빈 상태
  test('아이템을 삭제하면 confirm 뒤 그리드에서 사라진다', async ({ page }) => {
    await openDetail(page)

    const confirmMessages: string[] = []
    page.on('dialog', async (dialog) => {
      confirmMessages.push(dialog.message())
      await dialog.accept()
    })

    await page.getByRole('heading', { level: 3, name: ITEM.editedTitle }).click()
    await expect(page.getByRole('heading', { level: 2, name: '아이템 상세' })).toBeVisible()
    await page.getByRole('button', { name: '삭제', exact: true }).last().click()

    await expect(page.getByText('아이템이 삭제되었습니다')).toBeVisible()
    expect(confirmMessages).toEqual(['이 아이템을 삭제하시겠습니까?'])
    await expect(page.getByRole('heading', { level: 3, name: ITEM.editedTitle })).toHaveCount(0)
    await expect(page.getByText('이 위시리스트에 아이템이 없습니다')).toBeVisible()

    const detail = (await (await api.get(`/api/wishlists/${wishlistId}`)).json()) as WishlistDto
    expect(detail.items).toEqual([])
  })

  // F23 · F25 · H1 — 새로 만든 위시리스트의 공유 링크는 열리지 않는다.
  // 상세의 "공유 링크 복사" 는 `${origin}/w/${shareUrl}` = `/w/w/<cuid>` 를 복사하고 그 URL 은 404(두 세그먼트는
  // 라우트 `w/[shareUrl]` 에 없음). 접두사를 뗀 `/w/<cuid>` 는 200 이지만 API 가 `<cuid>` 로 조회해 404 → Next 기본 404 화면.
  // 데이터는 `/api/wishlists/share/w%2F<cuid>` 처럼 인코딩해야만 닿는다. (시드는 접두사 없이 넣어 공유 페이지가 열린다 — public.spec.ts)
  test('새 위시리스트의 공유 링크 /w/w/<cuid> 는 404 이고 /w/<cuid> 는 404 화면이다 (H1)', async ({
    page,
    context,
    request,
  }) => {
    const cuid = shareUrl.slice('w/'.length)

    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openDetail(page)
    await page.getByRole('button', { name: '공유 링크 복사' }).click()
    await expect(page.getByText('공유 링크가 복사되었습니다')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${APP_ORIGIN}/w/w/${cuid}`,
    )

    expect((await request.get(`/w/${shareUrl}`)).status()).toBe(404)

    const stripped = await page.goto(`/w/${cuid}`)
    expect(stripped?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()

    const api404 = await request.get(`/api/wishlists/share/${cuid}`)
    expect(api404.status()).toBe(404)
    expect(await api404.json()).toEqual({ error: 'Wishlist not found' })

    const encoded = await request.get(`/api/wishlists/share/${encodeURIComponent(shareUrl)}`)
    expect(encoded.status()).toBe(200)
    expect(await encoded.json()).toMatchObject({ id: wishlistId, shareUrl })
  })

  // F17 · H9 — 목록 카드의 휴지통 아이콘 버튼(title "삭제") → native confirm → 토스트 → 목록 갱신.
  // confirm 문구는 사전 값 `"{title}" 위시리스트를 삭제하시겠습니까?` 가 **치환되지 않은 채** 그대로 나온다 —
  // 사전은 `{title}`, `t()` 는 `{{title}}` 만 치환하기 때문(lib/i18n/context.tsx). 현재 동작으로 고정 (v2 는 i18n 키 테스트로 예방, CLAUDE.md 함정 10)
  test('목록에서 위시리스트를 삭제하면 confirm 뒤 카드가 사라지고 비어 있음 상태로 돌아간다', async ({
    page,
  }) => {
    await page.goto('/kr/settings/wishlists')
    const title = page.getByRole('heading', { level: 3, name: CREATED.title })
    await expect(title).toBeVisible()

    const confirmMessages: string[] = []
    page.on('dialog', async (dialog) => {
      confirmMessages.push(dialog.message())
      await dialog.accept()
    })
    await page.getByRole('button', { name: '삭제' }).click()

    await expect(page.getByText('위시리스트가 삭제되었습니다')).toBeVisible()
    expect(confirmMessages).toEqual(['"{title}" 위시리스트를 삭제하시겠습니까?'])
    await expect(title).toHaveCount(0)
    await expect(page.getByText('아직 생성된 위시리스트가 없습니다')).toBeVisible()

    expect((await api.get(`/api/wishlists/${wishlistId}`)).status()).toBe(404)
    expect(
      ((await (await api.get('/api/wishlists?userId=baseline-editor')).json()) as unknown[]).length,
    ).toBe(0)
  })
})
