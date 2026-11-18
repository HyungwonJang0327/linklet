import { PLACEHOLDER_PATTERN } from './placeholder'
import type { Dictionary, DictionarySource, T, TranslateFn, Widen } from './types'

// t() — decisions/i18n.md L4. 점 경로 조회 → 문자열이 아니면 키 문자열 반환(로그 없음) → `{name}` 치환
// 서버 컴포넌트(getDictionary → createT)와 클라이언트(I18nProvider → useT)가 같은 함수를 쓴다 (L6)
// 복수형은 아직 없다 (L5) — 첫 영어 개수 문구가 생길 때 tn() 으로 확장

/** 점 경로로 값 조회. 중간에 끊기거나 리프가 문자열이 아니면 undefined */
function lookup(dictionary: DictionarySource, key: string): string | undefined {
  let node: string | DictionarySource | undefined = dictionary
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = Object.hasOwn(node, segment) ? node[segment] : undefined
  }
  return typeof node === 'string' ? node : undefined
}

/** `{name}` → params[name]. params 에 없는 플레이스홀더는 그대로 둔다(타입이 막지만 런타임 방어) */
function interpolate(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(PLACEHOLDER_PATTERN, (whole, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole,
  )
}

/**
 * 사전 D 의 리터럴 구조에 묶인 t() 를 만든다. 런타임 인자는 어떤 언어 사전이든(Widen<D>) 받는다.
 * 앱 코드는 아래 createT 를 쓴다 — 이 제네릭은 테스트가 인라인 사전으로 치환·타입을 고정하기 위한 것
 */
export function createTranslator<D extends DictionarySource>(dictionary: Widen<D>): TranslateFn<D> {
  return (key, ...args) => {
    const value = lookup(dictionary, key)
    if (value === undefined) return key
    const params = args[0] as Readonly<Record<string, string | number>> | undefined
    return params === undefined ? value : interpolate(value, params)
  }
}

/** 앱 사전(ko 구조)에 묶인 t(). `getDictionary(locale)` 결과를 넘긴다 */
export function createT(dictionary: Dictionary): T {
  return createTranslator(dictionary)
}
