import { describe, expect, it } from 'vitest'

import { LOCALES, type Locale } from '../config'
import { en } from './en'
import { getDictionary } from './index'
import { ja } from './ja'
import { ko } from './ko'

// decisions/i18n.md L6 — 로케일별 동적 import. 정적 import 와 같은 객체를 돌려준다

describe('getDictionary', () => {
  it.each([
    ['ko', ko],
    ['en', en],
    ['ja', ja],
  ] as const)('%s → 해당 언어 사전', async (locale, expected) => {
    await expect(getDictionary(locale)).resolves.toBe(expected)
  })

  it('세 언어 모두 로드되고 서로 다른 객체다', async () => {
    const loaded = await Promise.all(LOCALES.map((locale) => getDictionary(locale)))
    expect(new Set(loaded).size).toBe(3)
  })

  it('지원하지 않는 값이 타입을 뚫고 들어오면 throw 한다 (개발자 실수)', () => {
    expect(() => getDictionary('kr' as Locale)).toThrow('unsupported locale')
  })
})
