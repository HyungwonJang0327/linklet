import { describe, expect, expectTypeOf, it } from 'vitest'

import { ERROR_CODES } from '@/shared/lib/api-error'

import { LOCALES } from '../config'
import { placeholderNames } from '../placeholder'
import type { Dictionary, DictionaryKey, DictionarySource, Params } from '../types'
import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'

// decisions/i18n.md L9 (a)(b)(c)(e) — 세 사전의 키·플레이스홀더 집합 일치, errors.* ↔ ERROR_CODES, 빈 값 없음

const DICTIONARIES: Record<(typeof LOCALES)[number], Dictionary> = { ko, en, ja }

/** 중첩 사전 → `{ 'errors.NOT_FOUND': '…', … }` */
function flatten(source: DictionarySource, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out[path] = value
    else Object.assign(out, flatten(value, path))
  }
  return out
}

const FLAT = Object.fromEntries(
  LOCALES.map((locale) => [locale, flatten(DICTIONARIES[locale])]),
) as Record<(typeof LOCALES)[number], Record<string, string>>

const KO_KEYS = Object.keys(FLAT.ko).sort()

describe('사전 키 집합 (a)', () => {
  it('ko 의 최상위 그룹은 기반 키(errors·common·metadata) + F06 화면 키(notFound·errorPage) + F08 키(login·auth) + F09 키(unauthorized·forbidden) 다', () => {
    expect(Object.keys(ko).sort()).toEqual([
      'auth',
      'common',
      'errorPage',
      'errors',
      'forbidden',
      'login',
      'metadata',
      'notFound',
      'unauthorized',
    ])
    expect(KO_KEYS.length).toBeGreaterThan(0)
  })

  it.each(LOCALES)('%s 의 평탄화 키 집합이 ko 와 같다 (런타임)', (locale) => {
    expect(Object.keys(FLAT[locale]).sort()).toEqual(KO_KEYS)
  })

  it('en·ja 는 Dictionary 타입을 만족한다 (타입)', () => {
    expectTypeOf(en).toMatchTypeOf<Dictionary>()
    expectTypeOf(ja).toMatchTypeOf<Dictionary>()
    expectTypeOf(ko).toMatchTypeOf<Dictionary>()
  })
})

describe('플레이스홀더 집합 (b)', () => {
  // 2026-11-10 기준선 실측: 사전 `{title}` 미치환 버그 — 언어마다 플레이스홀더가 다르면 치환이 어긋난다
  it.each(KO_KEYS)('%s — 세 언어의 플레이스홀더 이름이 같다', (key) => {
    const expected = placeholderNames(FLAT.ko[key] ?? '')
    for (const locale of LOCALES) {
      expect(placeholderNames(FLAT[locale][key] ?? ''), locale).toEqual(expected)
    }
  })

  it('`{{` 문법은 어느 사전에도 없다 (t() 는 `{name}` 만 치환)', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(FLAT[locale])) {
        expect(value, `${locale}:${key}`).not.toContain('{{')
        expect(value, `${locale}:${key}`).not.toContain('}}')
      }
    }
  })
})

describe('errors.* ↔ ERROR_CODES (c)', () => {
  it('errors 키는 ERROR_CODES 10종 + UNKNOWN 과 정확히 1:1 이다', () => {
    const expected = [...ERROR_CODES, 'UNKNOWN'].sort()
    expect(Object.keys(ko.errors).sort()).toEqual(expected)
    expect(expected).toHaveLength(11)
  })

  it('errors 문장에 내부 코드·영어 식별자가 노출되지 않는다 (ko·ja)', () => {
    for (const locale of ['ko', 'ja'] as const) {
      for (const [code, message] of Object.entries(DICTIONARIES[locale].errors)) {
        expect(message, `${locale}:${code}`).not.toMatch(/[A-Z_]{4,}/)
      }
    }
  })
})

describe('값 (e)', () => {
  it('빈 문자열·앞뒤 공백 값이 없다', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(FLAT[locale])) {
        expect(value, `${locale}:${key}`).not.toBe('')
        expect(value, `${locale}:${key}`).toBe(value.trim())
      }
    }
  })

  it('이메일·URL 이 들어 있지 않다 (시크릿·개인정보 유입 방지)', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(FLAT[locale])) {
        expect(value, `${locale}:${key}`).not.toMatch(/@|https?:\/\//)
      }
    }
  })

  it('앱 이름은 세 언어 모두 Linklet 이다', () => {
    for (const locale of LOCALES) expect(DICTIONARIES[locale].common.appName).toBe('Linklet')
  })
})

describe('파생 타입', () => {
  it('DictionaryKey 는 점 표기 리프 경로다', () => {
    expectTypeOf<'errors.NOT_FOUND'>().toMatchTypeOf<DictionaryKey>()
    expectTypeOf<'common.retry'>().toMatchTypeOf<DictionaryKey>()
    expectTypeOf<'metadata.title'>().toMatchTypeOf<DictionaryKey>()
    // 중간 노드·없는 키는 DictionaryKey 가 아니다
    expectTypeOf<'errors'>().not.toMatchTypeOf<DictionaryKey>()
    expectTypeOf<'errors.NOPE'>().not.toMatchTypeOf<DictionaryKey>()
  })

  it('플레이스홀더 없는 키의 Params 는 never 다', () => {
    expectTypeOf<Params<'errors.NOT_FOUND'>>().toBeNever()
    expectTypeOf<Params<'common.appName'>>().toBeNever()
  })

  it('런타임 키 전부가 DictionaryKey 타입과 같은 집합이다', () => {
    // 타입 유니온을 런타임 배열로 꺼낼 수 없으므로 "평탄화 키 전부가 키 타입의 값으로 할당 가능" 을 샘플로 고정
    const sample: DictionaryKey[] = ['errors.UNKNOWN', 'common.loading', 'metadata.description']
    for (const key of sample) expect(KO_KEYS).toContain(key)
  })
})
