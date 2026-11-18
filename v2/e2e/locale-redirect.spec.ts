import { expect, test, type APIRequestContext } from '@playwright/test'

// F05 언어 경로·루트 리다이렉트 동등성 확인 (audit/FEATURES.md: "`/` 요청 시 브라우저 언어 경로로 이동, 미지원 언어는 기본 언어")
// 대상: src/proxy.ts (matcher `/` 하나) + shared/i18n/negotiate.ts
// request fixture 는 maxRedirects: 0 으로 307 응답 자체를 본다. Location 은 절대 URL 일 수 있어 pathname·search 로 비교한다.

async function getRoot(request: APIRequestContext, path: string, acceptLanguage?: string) {
  return request.get(path, {
    maxRedirects: 0,
    headers: acceptLanguage === undefined ? {} : { 'accept-language': acceptLanguage },
  })
}

function locationOf(headers: Record<string, string>): URL {
  const location = headers['location']
  expect(location).toBeTruthy()
  return new URL(location ?? '', 'http://placeholder.invalid')
}

test.describe('`/` 언어 리다이렉트', () => {
  test.describe('Accept-Language 에 따라 307 로 언어 경로에 보낸다', () => {
    for (const [header, expected] of [
      ['ja', '/ja'],
      ['en-US,en;q=0.9,ko;q=0.8', '/en'],
      ['fr-FR,fr;q=0.9', '/ko'],
    ] as const) {
      test(`${header} → ${expected}`, async ({ request }) => {
        const response = await getRoot(request, '/', header)
        expect(response.status()).toBe(307)
        expect(locationOf(response.headers()).pathname).toBe(expected)
      })
    }
  })

  test('헤더가 없으면 기본 언어 /ko', async ({ request }) => {
    const response = await getRoot(request, '/')
    expect(response.status()).toBe(307)
    expect(locationOf(response.headers()).pathname).toBe('/ko')
  })

  test('쿼리스트링을 보존한다 (/?from=share → /ko?from=share)', async ({ request }) => {
    const response = await getRoot(request, '/?from=share', 'ko-KR')
    expect(response.status()).toBe(307)
    const location = locationOf(response.headers())
    expect(location.pathname).toBe('/ko')
    expect(location.search).toBe('?from=share')
  })

  test('응답 Vary 에 Accept-Language 가 있다', async ({ request }) => {
    const response = await getRoot(request, '/', 'ja')
    expect(response.headers()['vary']?.toLowerCase()).toContain('accept-language')
  })

  test('/ko 는 리다이렉트 없이 200 (matcher 는 `/` 만)', async ({ request }) => {
    const response = await getRoot(request, '/ko', 'ja')
    expect(response.status()).toBe(200)
  })

  test('접두사 없는 /login 은 리다이렉트하지 않고 404 (url-design H1)', async ({ request }) => {
    const response = await getRoot(request, '/login', 'ja')
    expect(response.status()).toBe(404)
  })
})

test.describe('브라우저에서 `/` 진입', () => {
  // Chromium 기본 Accept-Language 는 환경 의존이라 locale 을 고정한다
  test.use({ locale: 'ja-JP' })

  test('ja-JP 브라우저는 /ja 랜딩에 도착한다', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    expect(new URL(page.url()).pathname).toBe('/ja')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  })
})
