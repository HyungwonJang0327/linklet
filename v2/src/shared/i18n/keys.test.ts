import { describe, expect, expectTypeOf, it } from 'vitest'

import { ERROR_CODES } from '@/shared/lib/api-error'

import { ko } from './dictionaries/ko'
import { errorMessageKey, UNKNOWN_ERROR_KEY } from './keys'
import type { DictionaryKey } from './types'

// decisions/i18n.md L8 · error-handling E3 — 코드 10종 → errors.{CODE}, 그 밖은 errors.UNKNOWN

describe('errorMessageKey', () => {
  it.each(ERROR_CODES)('%s → errors.%s', (code) => {
    expect(errorMessageKey(code)).toBe(`errors.${code}`)
  })

  it('매핑된 키는 전부 ko 사전에 실제로 있다', () => {
    for (const code of ERROR_CODES) {
      const key = errorMessageKey(code).replace('errors.', '') as keyof typeof ko.errors
      expect(typeof ko.errors[key]).toBe('string')
    }
    expect(ko.errors.UNKNOWN).toEqual(expect.any(String))
  })

  it.each(['', 'nope', 'not_found', 'Not Found', 'errors.NOT_FOUND', 'UNKNOWN', 'toString'])(
    '모르는 문자열 %j → errors.UNKNOWN',
    (value) => {
      expect(errorMessageKey(value)).toBe(UNKNOWN_ERROR_KEY)
      expect(UNKNOWN_ERROR_KEY).toBe('errors.UNKNOWN')
    },
  )

  it('반환 타입은 DictionaryKey 라 그대로 t() 에 넘길 수 있다', () => {
    expectTypeOf(errorMessageKey('NOT_FOUND')).toEqualTypeOf<DictionaryKey>()
  })
})
