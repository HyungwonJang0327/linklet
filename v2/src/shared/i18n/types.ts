import type { ko } from './dictionaries/ko'

// 사전 타입 — decisions/i18n.md L3·L4. ko 의 리터럴 구조에서 세 가지를 파생한다:
// Dictionary(값을 string 으로 넓힌 구조 — en·ja 가 satisfies), DictionaryKey(점 표기 리프 경로), Params<K>(그 키의 ko 문장 플레이스홀더)
// 아래 제네릭(DictionarySource·Widen·LeafKey·ParamsOf …)은 ko 에 묶이지 않아 테스트가 인라인 사전으로 치환 경로를 고정할 수 있다

/** 사전의 원본 형태 — 문자열 리프를 가진 중첩 객체 */
export type DictionarySource = { readonly [key: string]: string | DictionarySource }

/** 리프를 string 으로 넓힌 구조 타입 — 키 집합은 같고 문장은 자유 */
export type Widen<D> = {
  readonly [K in keyof D]: D[K] extends string ? string : Widen<D[K]>
}

/** 재귀 깊이 제한 — DictionaryKey 가 TS 재귀 한계에 닿지 않게 (사전은 2~3단계면 충분) */
type Prev = [never, 0, 1, 2, 3, 4]

/** 점 표기 리프 경로 유니온 (`'errors.NOT_FOUND' | 'common.retry' | …`) */
export type LeafKey<D, Depth extends number = 5> = [Depth] extends [never]
  ? never
  : {
      [K in keyof D & string]: D[K] extends string
        ? K
        : D[K] extends DictionarySource
          ? `${K}.${LeafKey<D[K], Prev[Depth]>}`
          : never
    }[keyof D & string]

/** 점 경로로 값 타입 조회 */
export type ValueAt<D, K extends string> = K extends `${infer Head}.${infer Rest}`
  ? Head extends keyof D
    ? ValueAt<D[Head], Rest>
    : never
  : K extends keyof D
    ? D[K]
    : never

/** 문장 리터럴에서 `{name}` 이름 추출. 리터럴이 아닌 string 이면 never (플레이스홀더 없음으로 취급) */
export type PlaceholderNames<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderNames<Rest>
  : never

/** 키 K 의 params 객체 타입 — 플레이스홀더가 없으면 never */
export type ParamsOf<D, K extends string> =
  PlaceholderNames<ValueAt<D, K> & string> extends infer Names
    ? [Names] extends [never]
      ? never
      : { readonly [N in Names & string]: string | number }
    : never

/** t() 의 나머지 인자 — 플레이스홀더가 있는 키만 params 를 받는다(필수), 없으면 인자 자체를 받지 않는다 */
export type ParamArgs<D, K extends string> = [ParamsOf<D, K>] extends [never]
  ? []
  : [params: ParamsOf<D, K>]

/** 사전 D 에 묶인 t() 시그니처 */
export type TranslateFn<D> = <K extends LeafKey<D>>(key: K, ...args: ParamArgs<D, K>) => string

// ---- 앱 사전(ko 원본)에 묶인 공개 타입 ----

/** ko 의 리터럴 구조 — Params 추출의 기준 */
export type DictionarySourceOfApp = typeof ko

/** 세 언어가 공유하는 구조 타입 — en·ja 는 `satisfies Dictionary` */
export type Dictionary = Widen<DictionarySourceOfApp>

/** 사전 키 (점 표기 리프 경로) */
export type DictionaryKey = LeafKey<DictionarySourceOfApp>

/** 키 K 의 params 타입 — 플레이스홀더가 없는 키는 never */
export type Params<K extends DictionaryKey> = ParamsOf<DictionarySourceOfApp, K>

/** 앱 사전에 묶인 t() */
export type T = TranslateFn<DictionarySourceOfApp>
