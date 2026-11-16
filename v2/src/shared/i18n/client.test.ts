import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { I18nProvider, useLocale, useT } from './client'
import { en } from './dictionaries/en'
import { ko } from './dictionaries/ko'

// Provider 안·밖 동작 — 새 의존성(RTL) 없이 react-dom/server 로 렌더한다 (decisions/dependencies.md)

function Probe() {
  const t = useT()
  const locale = useLocale()
  return createElement('p', null, `${locale}:${t('common.retry')}`)
}

describe('I18nProvider · useT · useLocale', () => {
  it.each([
    ['ko', ko, 'ko:다시 시도'],
    ['en', en, 'en:Try again'],
  ] as const)('%s 사전을 내려주면 그 언어로 번역한다', (locale, dictionary, expected) => {
    const html = renderToString(
      createElement(I18nProvider, { locale, dictionary }, createElement(Probe)),
    )
    expect(html).toContain(expected)
  })

  it('Provider 밖에서 useT 를 쓰면 throw 한다 (개발자 실수)', () => {
    expect(() => renderToString(createElement(Probe))).toThrow(
      'useT must be used within <I18nProvider>',
    )
  })

  it('Provider 밖에서 useLocale 을 쓰면 throw 한다', () => {
    function LocaleOnly() {
      return createElement('span', null, useLocale())
    }
    expect(() => renderToString(createElement(LocaleOnly))).toThrow(
      'useLocale must be used within <I18nProvider>',
    )
  })
})
