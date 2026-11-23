import { randomBytes } from 'node:crypto'
import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import {
  DROPPED_INTEGRATIONS,
  dropIntegrations,
  scrubBreadcrumb,
  scrubEvent,
  SENTRY_DATA_COLLECTION,
} from './sentry-scrub'

// decisions/error-handling.md E5 — 이메일·토큰·쿠키·요청 본문이 어떤 Sentry 이벤트에도 남지 않는다. 함수는 절대 throw 하지 않는다.
// 민감값은 실행마다 난수로 만든다 — 고정 문자열이 테스트 코드에 남지 않게(시크릿 스캔) + 우연한 하드코딩 매치 방지

const hex = (bytes: number) => randomBytes(bytes).toString('hex')
const email = () => `user.${hex(3)}@example.com`
const token = () => hex(24) // 48자 hex — 32자+ 규칙

const errorEvent = (overrides: Partial<ErrorEvent>): ErrorEvent => ({
  type: undefined,
  ...overrides,
})

/** 이벤트를 JSON 으로 펴서 문자열이 어디에도 없는지 본다 — 필드 위치를 가정하지 않는다 */
const serialized = (value: unknown) => JSON.stringify(value)

describe('SENTRY_DATA_COLLECTION', () => {
  it('IP·쿠키·헤더·본문·쿼리 자동 수집을 전부 끈다', () => {
    expect(SENTRY_DATA_COLLECTION).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    })
  })
})

describe('dropIntegrations', () => {
  const integration = (name: string) => ({ name })

  it('Console·RequestData·BrowserTracing 을 빼고 나머지는 순서대로 남긴다', () => {
    const defaults = [
      'Dedupe',
      'Console',
      'Breadcrumbs',
      'RequestData',
      'BrowserTracing',
      'Http',
    ].map(integration)
    expect(dropIntegrations(defaults).map((i) => i.name)).toEqual(['Dedupe', 'Breadcrumbs', 'Http'])
  })

  it('뺄 목록은 세 개로 고정 — 늘리면 근거(error-handling E5)와 같이 바꾼다', () => {
    expect([...DROPPED_INTEGRATIONS].sort()).toEqual(['BrowserTracing', 'Console', 'RequestData'])
  })
})

describe('scrubBreadcrumb', () => {
  it('console 범주는 버린다 — 구조화 로그와 이중 전송', () => {
    expect(scrubBreadcrumb({ category: 'console', message: 'anything' })).toBeNull()
  })

  it('message 와 data 의 문자열 값을 마스킹하고 숫자는 남긴다', () => {
    const mail = email()
    const tk = token()
    const crumb: Breadcrumb = {
      category: 'fetch',
      message: `GET /api/x?token=${tk} by ${mail}`,
      data: { url: `https://example.com/p?sig=${tk}`, method: 'GET', status_code: 500, ok: true },
    }
    const out = scrubBreadcrumb(crumb)
    expect(out).not.toBeNull()
    expect(serialized(out)).not.toContain(mail)
    expect(serialized(out)).not.toContain(tk)
    expect(out?.data).toMatchObject({ method: 'GET', status_code: 500, ok: true })
    expect(out?.category).toBe('fetch')
  })

  it('data 의 객체·배열 값은 버린다 — 중첩 구조는 패턴으로 못 믿는다', () => {
    const out = scrubBreadcrumb({
      category: 'xhr',
      data: { headers: { cookie: 'a=b' }, list: [1], n: 1 },
    })
    expect(out?.data).toEqual({ n: 1 })
  })

  it('입력이 깨져도 throw 하지 않는다 — getter 가 던지면 null', () => {
    const broken = { category: 'fetch' } as Breadcrumb
    Object.defineProperty(broken, 'message', {
      enumerable: true,
      get() {
        throw new Error('boom')
      },
    })
    expect(() => scrubBreadcrumb(broken)).not.toThrow()
    expect(scrubBreadcrumb(broken)).toBeNull()
  })
})

describe('scrubEvent', () => {
  it('request 는 url(쿼리 제거)·method 만 남기고 headers·cookies·data·query_string·env 를 지운다', () => {
    const mail = email()
    const tk = token()
    const out = scrubEvent(
      errorEvent({
        request: {
          url: `https://linklet.example/ko/w/abc?token=${tk}`,
          method: 'POST',
          headers: { authorization: `Bearer ${tk}`, cookie: `session=${tk}` },
          cookies: { session: tk },
          data: `{"email":"${mail}"}`,
          query_string: `token=${tk}`,
          env: { REMOTE_ADDR: '10.0.0.1' },
        },
      }),
    )
    expect(out?.request).toEqual({ url: 'https://linklet.example/ko/w/abc?***', method: 'POST' })
    expect(serialized(out)).not.toContain(mail)
    expect(serialized(out)).not.toContain(tk)
    expect(serialized(out)).not.toContain('10.0.0.1')
  })

  it('user 는 내부 id 만 남긴다 — email·username·ip_address 삭제. id 가 없으면 user 자체를 지운다', () => {
    const mail = email()
    const withId = scrubEvent(
      errorEvent({ user: { id: 'usr_1', email: mail, username: 'name', ip_address: '10.0.0.2' } }),
    )
    expect(withId?.user).toEqual({ id: 'usr_1' })
    expect(serialized(withId)).not.toContain(mail)

    const withoutId = scrubEvent(errorEvent({ user: { email: mail } }))
    expect(withoutId).not.toHaveProperty('user')
  })

  it('exception.values[].value 와 message 를 마스킹한다', () => {
    const mail = email()
    const tk = token()
    const out = scrubEvent(
      errorEvent({
        message: `failed for ${mail}`,
        exception: {
          values: [
            { type: 'Error', value: `P1001 at postgresql://u:p@db.internal:5432/x token=${tk}` },
            { type: 'TypeError', value: `cannot read ${mail}` },
            { type: 'Other' },
          ],
        },
      }),
    )
    expect(serialized(out)).not.toContain(mail)
    expect(serialized(out)).not.toContain(tk)
    expect(serialized(out)).not.toContain('db.internal')
    expect(out?.exception?.values?.map((v) => v.type)).toEqual(['Error', 'TypeError', 'Other'])
  })

  it('breadcrumbs 는 console 을 빼고 나머지를 마스킹한다', () => {
    const mail = email()
    const out = scrubEvent(
      errorEvent({
        breadcrumbs: [
          { category: 'console', message: `logged ${mail}` },
          { category: 'navigation', data: { from: `/ko?user=${mail}`, to: '/ko/w/1' } },
        ],
      }),
    )
    expect(out?.breadcrumbs).toHaveLength(1)
    expect(out?.breadcrumbs?.[0]?.category).toBe('navigation')
    expect(serialized(out)).not.toContain(mail)
  })

  it('extra 는 통째로 지우고, tags·스택 프레임은 그대로 둔다', () => {
    const out = scrubEvent(
      errorEvent({
        extra: { body: { email: email() } },
        tags: { route: '/api/health', requestId: 'req-1' },
        exception: {
          values: [
            {
              type: 'Error',
              value: 'x',
              stacktrace: { frames: [{ filename: 'app/page.tsx', lineno: 3, colno: 1 }] },
            },
          ],
        },
      }),
    )
    expect(out).not.toHaveProperty('extra')
    expect(out?.tags).toEqual({ route: '/api/health', requestId: 'req-1' })
    expect(out?.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename).toBe('app/page.tsx')
  })

  it('입력 이벤트를 변경하지 않는다', () => {
    const event = errorEvent({ request: { headers: { cookie: 'a=b' } }, extra: { a: 1 } })
    const snapshot = serialized(event)
    scrubEvent(event)
    expect(serialized(event)).toBe(snapshot)
  })

  it('스크럽 중 실패하면 null — 원본이 나가지 않는다', () => {
    const broken = errorEvent({})
    Object.defineProperty(broken, 'request', {
      enumerable: true,
      get() {
        throw new Error('boom')
      },
    })
    expect(() => scrubEvent(broken)).not.toThrow()
    expect(scrubEvent(broken)).toBeNull()
  })
})
