import { test, expect } from '@playwright/test'

// 기준선 — 기존 앱 현재 동작 고정 (decisions/testing.md T7·T8)
// 대상: `pnpm baseline:up` 으로 3001 에 띄운 기존 앱(루트). 이 파일은 baseline project 가 동작함을 증명하는
// 최소 스모크다. 비로그인·로그인 흐름은 별도 spec 으로 추가한다.

test.describe('기존 앱 기준선 스모크', () => {
  test('/api/health 가 healthy 와 DB operational 을 반환한다', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)
    const body: unknown = await response.json()
    expect(body).toMatchObject({
      status: 'healthy',
      services: { api: { status: 'operational' }, database: { status: 'operational' } },
    })
  })

  test('/ 는 기본 로케일 /kr 로 307 리다이렉트한다', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toBe('/kr')
  })

  test('/kr 랜딩이 200 으로 열린다', async ({ page }) => {
    const response = await page.goto('/kr')

    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/kr$/)
  })
})
