import { expect, test } from '@playwright/test'

import { getDictionary, LOCALES } from '@/shared/i18n'

// F08 로그인 화면·Better Auth 라우트 — audit/FEATURES.md "E2E: 테스트용 세션 주입 후 로그인 상태 화면" 의 앞부분.
// 실제 Google 로그인은 자동화하지 않는다(decisions/testing.md) — 버튼을 누르면 Google 로 떠나므로 누르지 않는다.
// 세션 주입(테스트 DB 시드 사용자·세션)은 다음 항목(mvp-todo "E2E 세션 주입 헬퍼")에서 붙인다. 이 서버의 DB 는 닫힌 포트라
// 쿠키 없는 요청만 확인한다 — 쿠키가 없으면 SDK 가 DB 에 가지 않는다.

test.describe('로그인 페이지 /{locale}/login', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/login — 제목·설명·Google 버튼, Topbar 에 로그인 링크 없음`, async ({
      page,
    }) => {
      const dictionary = await getDictionary(locale)
      const response = await page.goto(`/${locale}/login`)
      expect(response?.status()).toBe(200)

      await expect(page.locator('main h1')).toHaveText(dictionary.login.title)
      await expect(page.getByText(dictionary.login.description)).toBeVisible()

      // 주된 행동은 <button> 하나 (§4-3 — 클릭 가능한 div 금지)
      const button = page.getByRole('button', { name: dictionary.login.google })
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()

      // 로그인 페이지에서는 Topbar 의 로그인 링크를 중복해서 보이지 않는다
      await expect(page.locator('header').getByText(dictionary.auth.signIn)).toHaveCount(0)

      // 실패 안내는 ?error 가 있을 때만. main 으로 좁힌다 — Next 의 route announcer(<div role="alert" id="__next-route-announcer__">)가 body 에 항상 있다
      await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
    })
  }

  test('?error=1 이면 안내 문구가 보이고 내부 코드가 없다', async ({ page }) => {
    const dictionary = await getDictionary('ko')
    await page.goto('/ko/login?error=1')
    const alert = page.locator('main').getByRole('alert')
    await expect(alert).toHaveText(dictionary.login.failed)
    await expect(page.locator('main')).not.toContainText(/error|OAuth|callback/i)
  })
})

test.describe('Topbar 로그인 상태 (비로그인)', () => {
  test('/ko 에는 로그인 링크가 /ko/login 으로 걸린다', async ({ page }) => {
    const dictionary = await getDictionary('ko')
    await page.goto('/ko')
    const link = page.locator('header').getByRole('link', { name: dictionary.auth.signIn })
    await expect(link).toHaveAttribute('href', '/ko/login')
  })
})

test.describe('Better Auth 라우트 /api/auth', () => {
  test('GET /api/auth/ok 는 200', async ({ request }) => {
    const response = await request.get('/api/auth/ok')
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  test('쿠키 없는 GET /api/auth/get-session 은 200 null (DB 없이)', async ({ request }) => {
    const response = await request.get('/api/auth/get-session')
    expect(response.status()).toBe(200)
    expect(await response.json()).toBeNull()
  })
})
