import { expect, test } from '@playwright/test'

import { en } from '@/shared/i18n/dictionaries/en'
import { ja } from '@/shared/i18n/dictionaries/ja'
import { ko } from '@/shared/i18n/dictionaries/ko'

// F06 404·에러 경계 동등성 확인 (audit/FEATURES.md: "E2E: 없는 경로 → 앱 테마 404, 렌더 에러 → 에러 경계 화면")
// 대상:
// - app/global-not-found.tsx (experimental.globalNotFound): 어느 라우트에도 매치되지 않는 URL 전부 — /xx·/foo 는 물론 /ko/없는-경로 도
//   라우팅 단계에서 여기로 간다(2026-11-19 실측). 세 언어 고정 문구, 정적 HTML
// - app/[locale]/not-found.tsx: 페이지가 notFound() 를 호출할 때 (root layout 안, 그 언어 문구). /{locale}/e2e/not-found 가 고정한다
// - app/[locale]/error.tsx: 렌더 에러 경계. LINKLET_E2E=1 일 때 /{locale}/e2e/throw 가 던진다(playwright.config.ts 가 켠다)
// notFound()·throw 응답은 Next 가 껍데기(<html id="__next_error__">) + RSC 페이로드로 내려 브라우저가 트리를 완성한다 →
// 정적 HTML 이 아니라 page(브라우저) 로 본다. 콘솔 에러는 실패로 보지 않는다 — 경계가 그려질 때 Next 가 콘솔에 찍는다.

test.describe('매치되지 않는 URL → global-not-found (세 언어 고정 문구)', () => {
  for (const path of ['/xx', '/foo', '/ko/this-page-does-not-exist', '/ja/nope', '/en/a/b/c']) {
    test(`${path} — 404, <html lang=ko data-skin>, ko·en·ja 제목, 홈 링크 /`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)

      const html = page.locator('html')
      await expect(html).toHaveAttribute('lang', 'ko')
      await expect(html).toHaveAttribute('data-skin', 'canvas')
      await expect(html).toHaveAttribute('data-mode', 'light')

      for (const dictionary of [ko, en, ja]) {
        await expect(page.getByText(dictionary.notFound.title, { exact: true })).toBeVisible()
        await expect(page.getByText(dictionary.notFound.description, { exact: true })).toBeVisible()
      }
      // 홈 링크는 `/` — proxy 가 언어 경로로 보낸다. 라벨은 세 언어를 ` · ` 로 이었다
      const home = page.getByRole('link', { name: ko.notFound.home })
      await expect(home).toBeVisible()
      await expect(home).toHaveAttribute('href', '/')
      // layout 을 거치지 않으므로 Topbar 는 없다
      await expect(page.locator('header')).toHaveCount(0)
    })
  }

  test('noindex 와 <title> 을 낸다', async ({ page }) => {
    await page.goto('/foo')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page).toHaveTitle(new RegExp(ko.notFound.title))
  })

  test('/xx 는 [locale] layout 을 실행하지 않는다 (dynamicParams=false) — 세 언어 화면, ko 전용 화면 아님', async ({
    page,
  }) => {
    await page.goto('/xx')
    await expect(page.getByText(ja.notFound.title, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: ko.notFound.home })).toHaveAttribute('href', '/')
  })
})

test.describe('notFound() → [locale]/not-found.tsx (root layout 안, 그 언어 문구)', () => {
  for (const locale of ['ko', 'ja'] as const) {
    const dictionary = { ko, ja }[locale]
    test(`/${locale}/e2e/not-found — 404, <html lang=${locale}>, ${locale} 문구만, 홈 링크 /${locale}, Topbar`, async ({
      page,
    }) => {
      const response = await page.goto(`/${locale}/e2e/not-found`)
      expect(response?.status()).toBe(404)

      const html = page.locator('html')
      await expect(html).toHaveAttribute('lang', locale)
      await expect(html).toHaveAttribute('data-skin', 'canvas')

      await expect(
        page.getByRole('heading', { level: 1, name: dictionary.notFound.title }),
      ).toBeVisible()
      await expect(page.getByText(dictionary.notFound.description)).toBeVisible()
      const home = page.getByRole('link', { name: dictionary.notFound.home, exact: true })
      await expect(home).toBeVisible()
      await expect(home).toHaveAttribute('href', `/${locale}`)
      // root layout 안 — 헤더 워드마크가 있다
      await expect(page.locator('header a', { hasText: 'Linklet' })).toBeVisible()
      // 다른 언어 문구는 없다 (global-not-found 가 아니다)
      const other = locale === 'ko' ? ja : ko
      await expect(page.getByText(other.notFound.title)).toHaveCount(0)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    })
  }
})

test.describe('렌더 에러 → [locale]/error.tsx 경계', () => {
  test('/ko/e2e/throw — 경계 문구·다시 시도 버튼·Topbar, 내부 메시지 노출 없음, retry 로 재요청', async ({
    page,
  }) => {
    const response = await page.goto('/ko/e2e/throw')
    // Next 가 경계를 스트리밍하면 200, 껍데기로 떨어지면 500 — 실측값을 고정한다 (2026-11-19: 500)
    expect(response?.status()).toBe(500)

    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'ko')
    await expect(html).toHaveAttribute('data-skin', 'canvas')

    await expect(page.getByRole('heading', { level: 1, name: ko.errorPage.title })).toBeVisible()
    await expect(page.getByText(ko.errorPage.description)).toBeVisible()
    const retry = page.getByRole('button', { name: ko.common.retry })
    await expect(retry).toBeVisible()
    await expect(page.locator('header a', { hasText: 'Linklet' })).toBeVisible()

    // §4-1: error.message·digest 를 화면에 내지 않는다
    await expect(page.locator('body')).not.toContainText('intentional render error')
    await expect(page.locator('body')).not.toContainText('digest')

    // retry() 는 자식을 다시 fetch·렌더한다(error.md). 계속 던지므로 같은 경계 문구가 유지된다
    const refetch = page.waitForRequest(
      (request) => new URL(request.url()).pathname === '/ko/e2e/throw',
      { timeout: 5_000 },
    )
    await retry.click()
    await refetch
    await expect(page.getByRole('heading', { level: 1, name: ko.errorPage.title })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('intentional render error')
  })

  test('/ja/e2e/throw — ja 문구', async ({ page }) => {
    await page.goto('/ja/e2e/throw')
    await expect(page.getByRole('heading', { level: 1, name: ja.errorPage.title })).toBeVisible()
    await expect(page.getByRole('button', { name: ja.common.retry })).toBeVisible()
  })
})
