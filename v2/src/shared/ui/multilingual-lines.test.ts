import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LOCALES } from '@/shared/i18n'

import { MultilingualLines } from './multilingual-lines'

// F06 — Provider 없는 global 화면의 세 언어 줄. LOCALES 순서대로, 줄마다 lang 속성

describe('MultilingualLines', () => {
  it('LOCALES 순서로 lang 이 붙은 줄을 하나씩 그린다', () => {
    const html = renderToString(
      createElement(MultilingualLines, {
        texts: { ko: '한국어 줄', en: 'English line', ja: '日本語の行' },
      }),
    )
    const langs = [...html.matchAll(/lang="([a-z]+)"/g)].map((m) => m[1])
    expect(langs).toEqual([...LOCALES])
    expect(html).toMatch(/<span lang="ko"[^>]*>한국어 줄<\/span>/)
    expect(html).toMatch(/<span lang="en"[^>]*>English line<\/span>/)
    expect(html).toMatch(/<span lang="ja"[^>]*>日本語の行<\/span>/)
    expect(html.indexOf('한국어 줄')).toBeLessThan(html.indexOf('English line'))
    expect(html.indexOf('English line')).toBeLessThan(html.indexOf('日本語の行'))
  })
})
