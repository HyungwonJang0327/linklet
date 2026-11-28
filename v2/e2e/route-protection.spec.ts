import { expect, test } from '@playwright/test'

import { getDictionary, LOCALES } from '@/shared/i18n'

import { signInAs } from './helpers/session'

// F09 라우트 보호 — audit/FEATURES.md "E2E: 비로그인으로 설정 접근 → 로그인으로 이동, 일반 사용자로 관리자 접근 → 차단".
// 사용자 결정 2026-11-23: 리다이렉트 대신 제자리 401(unauthorized.tsx) / 비관리자는 403(forbidden.tsx) — experimental.authInterrupts.
// 대상: [locale]/(app)/layout.tsx · [locale]/admin/layout.tsx · [locale]/unauthorized.tsx · forbidden.tsx · (public)/login/page.tsx(로그인 상태 → 랜딩).
// 보호 화면이 아직 없어 E2E 전용 페이지(/e2e/protected · /admin/e2e/probe, LINKLET_E2E=1)로 고정한다.
// 로그인 상태는 시드 세션 + 서명 쿠키 주입(e2e/helpers/session.ts, 테스트 DB 는 e2e/global-setup.ts). 쿠키 없는 요청은 DB 에 가지 않고,
// 위조 쿠키는 서명 검증 또는 DB 세션 조회에서 걸려 비로그인으로 처리된다(features/auth getSession).
// 401·403 응답은 404 처럼 Next 가 껍데기 + RSC 페이로드로 내려 브라우저가 완성한다 → page 로 본다.

const PROTECTED_PATHS = ['/e2e/protected', '/admin/e2e/probe'] as const

test.describe('비로그인 → 401 제자리 안내 (리다이렉트 없음)', () => {
  for (const locale of LOCALES) {
    for (const path of PROTECTED_PATHS) {
      test(`/${locale}${path} — 401, URL 유지, 안내 문구·Google 버튼, Topbar 유지`, async ({
        page,
      }) => {
        const dictionary = await getDictionary(locale)
        const response = await page.goto(`/${locale}${path}`)
        expect(response?.status()).toBe(401)
        expect(new URL(page.url()).pathname).toBe(`/${locale}${path}`)

        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByText(dictionary.unauthorized.title, { exact: true })).toBeVisible()
        await expect(
          page.getByText(dictionary.unauthorized.description, { exact: true }),
        ).toBeVisible()
        await expect(page.getByRole('button', { name: dictionary.login.google })).toBeEnabled()
        // root layout 안에서 그려진다 — Topbar 워드마크
        await expect(page.locator('header')).toContainText(dictionary.common.appName)
        // E2E 전용 본문은 보이지 않는다
        await expect(page.getByTestId('e2e-protected')).toHaveCount(0)
        await expect(page.getByTestId('e2e-admin-probe')).toHaveCount(0)
      })
    }
  }

  test('위조된 세션 쿠키(서명 없음)도 비로그인 — 401', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'e2e-forged-token-not-a-real-session',
        domain: 'localhost',
        path: '/',
      },
    ])
    const response = await page.goto('/ko/e2e/protected')
    expect(response?.status()).toBe(401)
    const dictionary = await getDictionary('ko')
    await expect(page.getByText(dictionary.unauthorized.title, { exact: true })).toBeVisible()
  })

  test('401 화면 본문에 내부 코드·영어 원문이 없다', async ({ page }) => {
    await page.goto('/ko/e2e/protected')
    await expect(page.locator('main')).not.toContainText(/unauthorized|session|401/i)
  })
})

test.describe('일반 사용자(세션 주입)', () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, 'user')
  })

  test('/ko/admin/e2e/probe — 403, URL 유지, 안내 문구·홈 링크, 본문 없음', async ({ page }) => {
    const dictionary = await getDictionary('ko')
    const response = await page.goto('/ko/admin/e2e/probe')
    expect(response?.status()).toBe(403)
    expect(new URL(page.url()).pathname).toBe('/ko/admin/e2e/probe')

    await expect(page.getByText(dictionary.forbidden.title, { exact: true })).toBeVisible()
    await expect(page.getByText(dictionary.forbidden.description, { exact: true })).toBeVisible()
    // 로그인은 했으므로 Google 버튼은 없고 홈으로 가는 링크만
    await expect(page.getByRole('link', { name: dictionary.notFound.home })).toHaveAttribute(
      'href',
      '/ko',
    )
    await expect(page.getByRole('button', { name: dictionary.login.google })).toHaveCount(0)
    await expect(page.getByTestId('e2e-admin-probe')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/forbidden|admin|403/i)
  })

  test('/ko/e2e/protected — 200, 보호 본문이 보인다', async ({ page }) => {
    const response = await page.goto('/ko/e2e/protected')
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('e2e-protected')).toBeVisible()
  })

  test('로그인 상태로 /ko/login 에 오면 /ko 로 돌려보낸다', async ({ page }) => {
    await page.goto('/ko/login')
    await expect(page).toHaveURL(/\/ko$/)
    expect(new URL(page.url()).pathname).toBe('/ko')
  })
})

test.describe('관리자(세션 주입)', () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, 'admin')
  })

  test('/ko/admin/e2e/probe — 200, 관리자 본문이 보인다', async ({ page }) => {
    const response = await page.goto('/ko/admin/e2e/probe')
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('e2e-admin-probe')).toBeVisible()
  })

  test('/ko/e2e/protected — 관리자도 200', async ({ page }) => {
    const response = await page.goto('/ko/e2e/protected')
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('e2e-protected')).toBeVisible()
  })

  test('로그인 상태로 /ko/login 에 오면 /ko 로 돌려보낸다', async ({ page }) => {
    await page.goto('/ko/login')
    expect(new URL(page.url()).pathname).toBe('/ko')
  })
})

test.describe('공개 화면은 영향 없음', () => {
  test('/ko 랜딩·/ko/login 은 200 그대로', async ({ request }) => {
    expect((await request.get('/ko')).status()).toBe(200)
    expect((await request.get('/ko/login')).status()).toBe(200)
  })
})
