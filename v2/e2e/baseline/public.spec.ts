import { test, expect } from '@playwright/test'

// 기준선 — 기존 앱 비로그인 흐름의 **현재 동작** 고정 (decisions/testing.md T7·T8·T9)
// 대상: `pnpm baseline:up` 으로 3001 에 띄운 기존 앱(루트). 데이터는 e2e/baseline/seed.sql (멱등 시드).
// 알려진 버그도 고치지 않고 현재 값 그대로 단언한다 — v2 가 바꿀 동작은 각 테스트 주석에 FEATURES ID 와 함께 적었다.
// 셀렉터는 역할·텍스트 기반만 쓴다 (루트 앱 수정 금지).
//
// 공유 API(/api/wishlists/share/{shareUrl})는 IP·shareUrl 당 1분 10회 제한(lib/rate-limit.ts, 서버 메모리)이다.
// 이 파일은 실행당 baseline-public 에 4회(페이지 3 + API 1. curl UA 는 봇 검사에서 먼저 끊겨 집계되지 않음) 요청하므로
// 1분 안에 2회까지는 안전하고 3회째부터 429 가 날 수 있다 — 그때는 1분 뒤 다시 돌린다.

const SEED = {
  publicShareUrl: 'baseline-public',
  privateShareUrl: 'baseline-private',
  publicTitle: 'Baseline Public Wishlist',
  publicDescription: '기준선 공개 위시리스트',
  ownerEmail: 'baseline@example.com',
  items: [
    {
      title: 'Baseline Item 1 - Headphones',
      price: '₩129,000',
      productUrl: 'https://example.com/products/headphones',
    },
    {
      title: 'Baseline Item 2 - Keyboard',
      price: '$89.00',
      productUrl: 'https://example.com/products/keyboard',
    },
    {
      title: 'Baseline Item 3 - Mug',
      price: '¥1,500',
      productUrl: 'https://example.com/products/mug',
      isCompleted: true,
    },
  ],
} as const

test.describe('기존 앱 기준선 — 랜딩', () => {
  // F03 (공통 레이아웃: <html lang>·헤더·본문 렌더) · F05 (언어 경로 kr)
  test('/kr 랜딩은 lang=kr 이고 헤더(로고·공지·로그인)와 본문(제목·CTA)이 렌더된다', async ({
    page,
  }) => {
    await page.goto('/kr')

    await expect(page.locator('html')).toHaveAttribute('lang', 'kr')
    await expect(page).toHaveTitle('Linklet - 개인 위시리스트 관리자')

    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: 'Linklet' })).toHaveAttribute('href', '/kr')
    await expect(header.getByRole('link', { name: '공지사항' })).toHaveAttribute(
      'href',
      '/kr/notices',
    )
    await expect(header.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/kr/login')

    await expect(page.getByRole('heading', { level: 1, name: 'Linklet' })).toBeVisible()
    await expect(page.getByText('위시리스트 매니저')).toBeVisible()
    // 현재 CTA 는 /kr/settings 로 보낸다 (v2 는 F13·F14 흐름으로 재설계)
    await expect(page.getByRole('link', { name: '시작하기', exact: true })).toHaveAttribute(
      'href',
      '/kr/settings',
    )
    await expect(page.getByRole('link', { name: '무료로 시작하기' })).toHaveAttribute(
      'href',
      '/kr/login',
    )
  })
})

test.describe('기존 앱 기준선 — 공유 페이지 (비로그인)', () => {
  // 공유 페이지는 navigator.language 로 사전을 고른다 (서버 렌더 아님). 문구를 고정하려고 ko-KR 로 둔다
  test.use({ locale: 'ko-KR' })

  // F24 (공개 위시리스트 페이지) · F25 (공유 링크 = 실제로 열리는 URL) · F23 (shareUrl 값에 접두사 없음)
  test('/w/{shareUrl} 에서 제목·설명·아이템 3개(제목·가격·상품 링크)가 시드와 같다', async ({
    page,
  }) => {
    const response = await page.goto(`/w/${SEED.publicShareUrl}`)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: SEED.publicTitle })).toBeVisible()
    await expect(page.getByText(SEED.publicDescription)).toBeVisible()
    await expect(page.getByText('3 아이템')).toBeVisible()

    const productLinks = page.getByRole('link', { name: /Baseline Item/ })
    await expect(productLinks).toHaveCount(SEED.items.length)
    for (const [index, item] of SEED.items.entries()) {
      // priority 오름차순 = 시드 순서
      const link = productLinks.nth(index)
      await expect(link).toHaveAttribute('href', item.productUrl)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link.getByRole('heading', { level: 3, name: item.title })).toBeVisible()
      await expect(link.getByText(item.price)).toBeVisible()
    }
    await expect(page.getByText('Powered by Linklet')).toBeVisible()
  })

  // F24 "받음 표시" — 현재 공유 페이지는 isCompleted 를 전혀 구분하지 않는다. 받은 아이템도 다른 아이템과
  // 똑같은 상품 링크로 노출된다 (v2 는 받음 아이템을 구분해 표시, FEATURES F24·F16)
  test('받음(isCompleted) 아이템도 다른 아이템과 똑같이 상품 링크로 노출된다', async ({ page }) => {
    await page.goto(`/w/${SEED.publicShareUrl}`)

    const received = SEED.items[2]
    const link = page.getByRole('link', { name: received.title })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', received.productUrl)
    await expect(page.getByText(/받음|received|completed/i)).toHaveCount(0)
  })

  // F24 · F03 — 클라이언트 렌더라 <title> 이 비어 있고 <html lang> 이 없다 (Lighthouse 지적). v2 는 서버 렌더 + OG
  test('공유 페이지는 <title> 이 비어 있고 <html lang> 이 없다', async ({ page }) => {
    await page.goto(`/w/${SEED.publicShareUrl}`)

    await expect(page.getByRole('heading', { level: 1, name: SEED.publicTitle })).toBeVisible()
    await expect(page).toHaveTitle('')
    await expect(page.locator('html')).not.toHaveAttribute('lang')
  })

  // F15 · F24 — 비공개는 API 403 → 화면에 "비공개 위시리스트" 안내 (HTTP 는 200). v2 는 404
  test('비공개 위시리스트 /w/{shareUrl} 은 200 으로 열리고 비공개 안내 문구를 보여 준다', async ({
    page,
  }) => {
    const response = await page.goto(`/w/${SEED.privateShareUrl}`)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: '비공개 위시리스트' })).toBeVisible()
    await expect(page.getByText('이 위시리스트는 비공개로 설정되어 볼 수 없습니다.')).toBeVisible()
    await expect(page.getByRole('link', { name: /Baseline Item/ })).toHaveCount(0)
  })

  // F24 — 없는 shareUrl 은 HTTP 200(클라이언트 처리) 뒤 Next 기본 404 화면. v2 는 404 상태 + 앱 테마 404(F06)
  test('없는 shareUrl 은 HTTP 200 이지만 화면은 Next 기본 404 다', async ({ page }) => {
    const response = await page.goto('/w/does-not-exist')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'This page could not be found.' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('404: This page could not be found.')
  })
})

test.describe('기존 앱 기준선 — 공유 API·경로 (비로그인)', () => {
  // F24 (응답에 소유자 이메일 H3) · F16 (isCompleted 가 응답에 포함) — v2 는 공개용 select 로 이메일 제거
  test('공유 API 는 아이템 3개와 소유자 이메일(H3)을 포함한 위시리스트를 반환한다', async ({
    request,
  }) => {
    const response = await request.get(`/api/wishlists/share/${SEED.publicShareUrl}`)

    expect(response.status()).toBe(200)
    const body: unknown = await response.json()
    expect(body).toMatchObject({
      title: SEED.publicTitle,
      shareUrl: SEED.publicShareUrl,
      isPublic: true,
      user: { email: SEED.ownerEmail },
      items: SEED.items.map((item) => ({
        title: item.title,
        price: item.price,
        productUrl: item.productUrl,
        isCompleted: 'isCompleted' in item,
      })),
    })
  })

  // F15 · F24 — 비공개 공유 API 는 403
  test('비공개 위시리스트 공유 API 는 403 을 반환한다', async ({ request }) => {
    const response = await request.get(`/api/wishlists/share/${SEED.privateShareUrl}`)

    expect(response.status()).toBe(403)
    expect(await response.json()).toEqual({ error: 'This wishlist is private' })
  })

  // F24 "봇 차단이 미리보기 크롤러도 막음" — 비브라우저 UA 는 403 (메신저 미리보기 크롤러도 막힘). v2 는 서버 렌더로 해결
  test('공유 API 는 비브라우저 UA(curl) 에 403 을 반환한다', async ({ request }) => {
    const response = await request.get(`/api/wishlists/share/${SEED.publicShareUrl}`, {
      headers: { 'user-agent': 'curl/8.0' },
    })

    expect(response.status()).toBe(403)
    expect(await response.json()).toEqual({ error: 'Automated requests are not allowed' })
  })

  // H4 계열 — 비로그인 GET /api/wishlists 가 200 으로 공개 위시리스트 목록을 내려준다 (F13 "본인 것만"). v2 는 401
  test('비로그인 GET /api/wishlists 는 200 으로 공개 위시리스트 목록을 반환한다', async ({
    request,
  }) => {
    const response = await request.get('/api/wishlists')

    expect(response.status()).toBe(200)
    const body: unknown = await response.json()
    expect(Array.isArray(body)).toBe(true)
    const shareUrls = (body as Array<{ shareUrl: string | null }>).map((w) => w.shareUrl)
    expect(shareUrls).toContain(SEED.publicShareUrl)
    expect(shareUrls).not.toContain(SEED.privateShareUrl)
  })

  // F06 — 없는 경로는 404 (앱 테마 404 없음, 프레임워크 기본)
  test('없는 경로 /nope 는 404 를 반환한다', async ({ request }) => {
    const response = await request.get('/nope')

    expect(response.status()).toBe(404)
  })

  // F08 — NextAuth `pages.signIn: '/login'` 이 가리키는 경로가 없어 404 (알려진 버그). 로그인 화면은 /kr/login
  test('/login 은 404 를 반환한다 (알려진 버그, 로그인 화면은 /{locale}/login)', async ({
    request,
  }) => {
    expect((await request.get('/login')).status()).toBe(404)
    expect((await request.get('/kr/login')).status()).toBe(200)
  })
})
