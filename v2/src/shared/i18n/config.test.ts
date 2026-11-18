import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, isLocale, LOCALE_NAMES, LOCALES } from './config'

// decisions/i18n.md L1 · url-design.md U3 — ko·en·ja (ISO 639-1), 기본 ko
describe('언어 상수', () => {
  it('지원 언어는 ko·en·ja 순서 그대로다', () => {
    expect(LOCALES).toEqual(['ko', 'en', 'ja'])
  })

  it('기본 언어는 ko 다', () => {
    expect(DEFAULT_LOCALE).toBe('ko')
    expect(LOCALES).toContain(DEFAULT_LOCALE)
  })

  it('언어 이름은 각 언어의 자기 표기다', () => {
    expect(LOCALE_NAMES).toEqual({ ko: '한국어', en: 'English', ja: '日本語' })
  })
})

describe('isLocale', () => {
  it.each(LOCALES)('%s → true', (locale) => {
    expect(isLocale(locale)).toBe(true)
  })

  // 기존 앱 코드(kr·jp)는 받지 않는다 — F05 에서 경로 전환
  it.each(['kr', 'jp', 'KO', 'ko-KR', 'en-US', '', ' ko'])('%j → false', (value) => {
    expect(isLocale(value)).toBe(false)
  })

  it.each([undefined, null, 0, true, ['ko'], { toString: () => 'ko' }])(
    '문자열이 아니면 false (%j)',
    (value) => {
      expect(isLocale(value)).toBe(false)
    },
  )
})
