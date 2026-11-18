import { DEFAULT_LOCALE, isLocale, type Locale } from './config'

// Accept-Language 협상 — FEATURES F05, decisions/i18n.md L1, url-design.md U3.
// 서버·클라이언트 공용 순수 문자열 처리(Node 전용 API 없음). proxy.ts(`/` 리다이렉트)와
// 공유 페이지 /w/{shareId} 서버 컴포넌트(F23, 표시 언어 결정)가 같은 함수를 쓴다.
// 라이브러리(negotiator 등)는 쓰지 않는다 — 필요한 규칙이 작고 결정 없는 의존성은 금지(dependencies.md).

/** 이보다 긴 헤더는 앞부분만 본다 — 비정상 입력에 대한 처리량 방어 (정규식 없이 split 만 쓰므로 백트래킹 위험은 없다) */
const MAX_HEADER_LENGTH = 2000

type LanguageRange = {
  /** 소문자 언어 태그 (예: 'ko-kr', 'ja', '*') */
  tag: string
  /** RFC 9110 가중치 0~1. 없으면 1 */
  quality: number
  /** 헤더 안의 나열 순서 — q 동률일 때 앞선 것을 우선 */
  order: number
}

/** `;q=0.8` 같은 파라미터를 가중치 숫자로. 없으면 1, 깨진 값(`q=abc`·범위 밖)은 null 로 그 항목을 버린다 */
function parseQuality(params: string[]): number | null {
  for (const param of params) {
    const [key, value] = param.split('=', 2).map((part) => part.trim())
    if (key?.toLowerCase() !== 'q') continue
    if (value === undefined || value === '') return null
    const quality = Number(value)
    if (!Number.isFinite(quality) || quality < 0 || quality > 1) return null
    return quality
  }
  return 1
}

/** 헤더를 언어 범위 목록으로. 빈 항목·깨진 항목·q=0 은 제외한다 */
function parseAcceptLanguage(header: string): LanguageRange[] {
  const ranges: LanguageRange[] = []
  header
    .slice(0, MAX_HEADER_LENGTH)
    .split(',')
    .forEach((entry, order) => {
      const [rawTag, ...params] = entry.split(';')
      const tag = rawTag?.trim().toLowerCase()
      if (!tag) return
      const quality = parseQuality(params)
      if (quality === null || quality === 0) return
      ranges.push({ tag, quality, order })
    })
  return ranges
}

/** `ko-KR` → `ko`, `*` → `*`. 기본 서브태그(첫 조각)만 본다 — 지역·스크립트는 지원 언어 판단에 쓰지 않는다 */
function primarySubtag(tag: string): string {
  return tag.split('-', 1)[0] ?? tag
}

/**
 * Accept-Language 헤더에서 지원 언어 하나를 고른다.
 * - q 내림차순(동률은 나열 순서)으로 보며 기본 서브태그가 LOCALES 에 있으면 그 값
 * - `*` 또는 일치하는 언어가 없으면 DEFAULT_LOCALE
 * - 헤더가 없거나 비어 있거나 깨져 있어도 throw 하지 않고 DEFAULT_LOCALE
 *
 * F29(저장된 언어 설정)는 이 함수 밖에서 먼저 판단한다 — 이 함수는 헤더만 본다.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const ranges = parseAcceptLanguage(acceptLanguage).sort(
    (a, b) => b.quality - a.quality || a.order - b.order,
  )

  for (const range of ranges) {
    if (range.tag === '*') return DEFAULT_LOCALE
    const candidate = primarySubtag(range.tag)
    if (isLocale(candidate)) return candidate
  }
  return DEFAULT_LOCALE
}
