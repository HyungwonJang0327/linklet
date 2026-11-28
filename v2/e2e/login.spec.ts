import { expect, test } from '@playwright/test'

import { getDictionary, LOCALES } from '@/shared/i18n'

import { E2E_USERS } from './helpers/e2e-env'
import { signInAs } from './helpers/session'

// F08 로그인 화면·Better Auth 라우트 — audit/FEATURES.md "E2E: 테스트용 세션 주입 후 로그인 상태 화면".
// 실제 Google 로그인은 자동화하지 않는다(decisions/testing.md) — 버튼을 누르면 Google 로 떠나므로 누르지 않는다.
// 로그인 상태는 테스트 DB 의 시드 사용자·세션(e2e/global-setup.ts) + 서명 쿠키 주입(e2e/helpers/session.ts)으로 만든다.
// 쿠키가 없으면 SDK 가 DB 에 가지 않고 null — 비로그인 케이스는 DB 와 무관하게 같은 결과다.

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

test.describe('Topbar 로그인 상태 (세션 주입)', () => {
  test('/ko 에 로그아웃 버튼이 보이고 로그인 링크는 없다', async ({ page, context }) => {
    await signInAs(context, 'user')
    const dictionary = await getDictionary('ko')
    await page.goto('/ko')
    const header = page.locator('header')
    await expect(header.getByRole('button', { name: dictionary.auth.signOut })).toBeVisible()
    await expect(header.getByRole('link', { name: dictionary.auth.signIn })).toHaveCount(0)
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

  test('세션 쿠키가 있는 GET /api/auth/get-session 은 200 + 시드 사용자 id', async ({
    context,
  }) => {
    await signInAs(context, 'user')
    // `request` fixture 는 컨텍스트 쿠키를 공유하지 않는다 → context.request
    const response = await context.request.get('/api/auth/get-session')
    expect(response.status()).toBe(200)
    const body = (await response.json()) as { user: { id: string; role: string } } | null
    // 응답에 이메일 등 다른 필드가 함께 들어 있어도 여기서는 id·role 만 본다(출력·단언하지 않는다)
    expect(body?.user.id).toBe(E2E_USERS.user.id)
    expect(body?.user.role).toBe('user')
  })

  test('위조 쿠키(서명 없음) GET /api/auth/get-session 은 200 null', async ({ context }) => {
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'e2e-forged-token-not-a-real-session',
        domain: 'localhost',
        path: '/',
      },
    ])
    const response = await context.request.get('/api/auth/get-session')
    expect(response.status()).toBe(200)
    expect(await response.json()).toBeNull()
  })
})
