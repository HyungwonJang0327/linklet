// 플레이스홀더 문법 `{name}` 하나 — decisions/i18n.md L4. t() 치환과 사전 테스트(플레이스홀더 집합 비교)가 같은 정규식을 쓴다
// 기존 앱 버그(사전 `{title}` vs t() `{{key}}`, worklog 2026-11-10)를 "정규식이 한 곳" 으로 막는다

export const PLACEHOLDER_PATTERN = /\{([A-Za-z0-9_]+)\}/g

/** 문장에 등장하는 플레이스홀더 이름(중복 제거·정렬) — 테스트와 도구용 */
export function placeholderNames(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    if (match[1] !== undefined) names.add(match[1])
  }
  return [...names].sort()
}
