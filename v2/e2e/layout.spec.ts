import { expect, test } from '@playwright/test'

import { getDictionary, LOCALES } from '@/shared/i18n'

// F03 공통 레이아웃·root layout 동등성 확인 (audit/FEATURES.md: "모든 주요 경로에 <html lang> 존재, 헤더·본문 렌더")
// 대상: app/[locale]/layout.tsx (root layout — architecture.md A6) + app/[locale]/page.tsx (랜딩 자리표시자)
// `/` 는 테스트하지 않는다 — F05 proxy 전까지 404 다. 전역 404 화면은 F06 에서.

test.describe('언어별 root layout', () => {
  for (const locale of LOCALES) {
    test(`/${locale} — <html lang="${locale}">·스킨/모드 속성·헤더·본문·제목`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBe(200)

      const html = page.locator('html')
      await expect(html).toHaveAttribute('lang', locale)
      await expect(html).toHaveAttribute('data-skin', 'canvas')
      // 서버가 light 를 고정 렌더하므로 MODE_SCRIPT 가 바꾸지 않아야 한다 (F29 전까지)
      await expect(html).toHaveAttribute('data-mode', 'light')

      // 헤더: 워드마크가 그 언어의 랜딩으로 가는 링크
      const wordmark = page.locator('header a', { hasText: 'Linklet' })
      await expect(wordmark).toBeVisible()
      await expect(wordmark).toHaveAttribute('href', `/${locale}`)

      // 본문: <main> 안에 h1 하나
      await expect(page.locator('main h1')).toHaveCount(1)
      await expect(page.locator('main h1')).toBeVisible()

      // <title> 은 그 언어 사전의 metadata.title (create-next-app 기본값이 아님)
      const dictionary = await getDictionary(locale)
      await expect(page).toHaveTitle(dictionary.metadata.title)
    })
  }

  test('지원하지 않는 언어 /xx 는 404', async ({ request }) => {
    const response = await request.get('/xx')
    expect(response.status()).toBe(404)
  })
})

test.describe('root layout 밖의 라우트', () => {
  test('/api/health 는 layout 없이도 응답 규약을 지킨다 (200 ok 또는 DB 없음 503)', async ({
    request,
  }) => {
    const response = await request.get('/api/health')
    const status = response.status()
    expect([200, 503]).toContain(status)
    expect(response.headers()['content-type']).toContain('application/json')

    const body: unknown = await response.json()
    if (status === 200) expect(body).toEqual({ data: { status: 'ok' } })
    else expect(body).toMatchObject({ error: { code: 'UNAVAILABLE', message: expect.any(String) } })
  })
})
