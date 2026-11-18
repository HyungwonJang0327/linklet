import { describe, expect, expectTypeOf, it } from 'vitest'

import { en } from './dictionaries/en'
import { ja } from './dictionaries/ja'
import { ko } from './dictionaries/ko'
import { createT, createTranslator } from './t'
import type { ParamsOf, T, TranslateFn, LeafKey } from './types'

// decisions/i18n.md L4·L9(d) — 치환, 누락 키는 키 문자열 반환(로그 없음), `{{` 미지원

// 실제 사전에는 플레이스홀더 키가 아직 없다(errors.* 는 code → 키로 일반 처리되므로 params 를 요구하면 안 된다).
// 치환 경로와 Params 타입은 이 인라인 사전으로 고정한다
const TEST_SOURCE = {
  greeting: '안녕 {name}',
  twice: '{name} 그리고 {name}',
  count: '{count}개 중 {done}개',
  plain: '플레이스홀더 없음',
  nested: { deep: { leaf: '깊은 {value}' } },
  braces: '{{name}} 는 치환하지 않는 옛 문법',
  nonString: { x: 'x' },
} as const
type TestSource = typeof TEST_SOURCE
const tt = createTranslator<TestSource>(TEST_SOURCE)

describe('createTranslator — 치환 (d)', () => {
  it('{name} 을 params 값으로 바꾼다', () => {
    expect(tt('greeting', { name: '링클릿' })).toBe('안녕 링클릿')
  })

  it('같은 플레이스홀더가 여러 번 나오면 전부 바꾼다', () => {
    expect(tt('twice', { name: 'A' })).toBe('A 그리고 A')
  })

  it('숫자 params 는 String() 으로 바꾼다', () => {
    expect(tt('count', { count: 3, done: 0 })).toBe('3개 중 0개')
  })

  it('깊은 경로도 조회·치환한다', () => {
    expect(tt('nested.deep.leaf', { value: 'v' })).toBe('깊은 v')
  })

  it('plain 키는 params 없이 값을 그대로 돌려준다', () => {
    expect(tt('plain')).toBe('플레이스홀더 없음')
  })

  it('치환 값에 `{x}` 가 들어 있어도 재치환하지 않는다', () => {
    expect(tt('greeting', { name: '{name}' })).toBe('안녕 {name}')
  })

  it('params 에 없는 플레이스홀더는 그대로 남는다 (런타임 방어)', () => {
    // 타입이 막는 상황 — 런타임만 확인
    const loose = tt as unknown as (key: string, params?: Record<string, string>) => string
    expect(loose('count', { count: '1' })).toBe('1개 중 {done}개')
  })

  it('`{{name}}` 은 치환 대상이 아니다 — 안쪽 `{name}` 만 바뀌고 바깥 중괄호는 남는다', () => {
    // 사전에 `{{` 가 없음은 dictionaries.test.ts 가 고정한다. 여기서는 정규식이 `{name}` 하나임만 확인
    const loose = tt as unknown as (key: string, params?: Record<string, string>) => string
    expect(loose('braces', { name: 'X' })).toBe('{X} 는 치환하지 않는 옛 문법')
  })
})

describe('createTranslator — 누락 키', () => {
  const loose = tt as unknown as (key: string, params?: Record<string, string>) => string

  it.each(['missing', 'nested.missing', 'nested.deep.leaf.tooDeep', 'nonString', ''])(
    '%j → 키 문자열 그대로 반환',
    (key) => {
      expect(loose(key)).toBe(key)
    },
  )

  it('프로토타입 속성(toString·constructor 등)을 값으로 취급하지 않는다', () => {
    expect(loose('toString')).toBe('toString')
    expect(loose('nested.constructor')).toBe('nested.constructor')
    expect(loose('__proto__')).toBe('__proto__')
  })

  it('params 가 있어도 누락 키는 키 문자열이다', () => {
    expect(loose('missing', { name: 'x' })).toBe('missing')
  })

  it('로그를 남기지 않는다', () => {
    const calls: unknown[] = []
    const original = { warn: console.warn, error: console.error, log: console.log }
    console.warn = console.error = console.log = (...a: unknown[]) => calls.push(a)
    try {
      loose('missing')
    } finally {
      Object.assign(console, original)
    }
    expect(calls).toEqual([])
  })
})

describe('createT — 실제 사전', () => {
  it.each([
    ['ko', ko, '다시 시도'],
    ['en', en, 'Try again'],
    ['ja', ja, 'もう一度試す'],
  ] as const)('%s 사전으로 common.retry', (_locale, dictionary, expected) => {
    expect(createT(dictionary)('common.retry')).toBe(expected)
  })

  it('errors.UNKNOWN 을 세 언어 모두 돌려준다', () => {
    for (const dictionary of [ko, en, ja]) {
      expect(createT(dictionary)('errors.UNKNOWN')).toBe(dictionary.errors.UNKNOWN)
    }
  })
})

describe('타입', () => {
  it('createT 는 앱 사전에 묶인 T 를 돌려준다', () => {
    expectTypeOf(createT(ko)).toEqualTypeOf<T>()
    expectTypeOf(createT(en)).toEqualTypeOf<T>()
  })

  it('LeafKey 는 리프 경로만, 중간 노드는 제외', () => {
    expectTypeOf<LeafKey<TestSource>>().toEqualTypeOf<
      'greeting' | 'twice' | 'count' | 'plain' | 'nested.deep.leaf' | 'braces' | 'nonString.x'
    >()
  })

  it('ParamsOf 는 ko 문장에서 플레이스홀더 이름을 추출한다', () => {
    expectTypeOf<ParamsOf<TestSource, 'greeting'>>().toEqualTypeOf<{
      readonly name: string | number
    }>()
    expectTypeOf<ParamsOf<TestSource, 'count'>>().toEqualTypeOf<{
      readonly count: string | number
      readonly done: string | number
    }>()
    expectTypeOf<ParamsOf<TestSource, 'plain'>>().toBeNever()
  })

  it('없는 키·params 누락·초과 params 는 컴파일 에러', () => {
    // @ts-expect-error 없는 키
    tt('nope')
    // @ts-expect-error 중간 노드는 키가 아니다
    tt('nested')
    // @ts-expect-error 플레이스홀더 키에 params 누락
    tt('greeting')
    // @ts-expect-error params 에 필요한 이름 누락
    tt('count', { count: 1 })
    // @ts-expect-error 없는 params 추가 (객체 리터럴 초과 속성)
    tt('greeting', { name: 'a', extra: 1 })
    // @ts-expect-error 플레이스홀더 없는 키에 params 전달
    tt('plain', { name: 'a' })
    // @ts-expect-error params 값은 string | number 만
    tt('greeting', { name: true })
  })

  it('앱 사전 T — 현재 키는 전부 params 없이 호출한다', () => {
    const t = createT(ko)
    t('errors.NOT_FOUND')
    t('metadata.title')
    // @ts-expect-error 기존 앱 키(wishlist.categories.GENERAL 등)는 사전에 없다
    t('wishlist.categories.GENERAL')
    // @ts-expect-error params 를 받지 않는다
    t('errors.NOT_FOUND', { x: 1 })
  })

  it('TranslateFn 의 반환은 항상 string', () => {
    expectTypeOf<ReturnType<TranslateFn<TestSource>>>().toEqualTypeOf<string>()
  })
})
