import { NextResponse, type NextRequest } from 'next/server'

import { negotiateLocale } from '@/shared/i18n'

// 언어 경로 리다이렉트 — FEATURES F05, decisions/url-design.md(`/` → `/{locale}`), architecture.md A6.
// Next 16 은 middleware.ts 가 아니라 proxy.ts (CLAUDE.md 함정 14). 런타임은 Node.js 기본이며 `runtime` 옵션은 둘 수 없다(proxy.md "Runtime").
// 범위는 `/` 하나 — 접두사 없는 다른 경로(`/login` 등)는 보내지 않는다(url-design H1 하위 호환 없음, 페이지 경로는 전부 `/{locale}/...` 또는 `/w/...`).
// 기존 앱 middleware.ts 의 세션 쿠키 체크(F09)·`/w/` 지역 감지(F23)는 여기로 옮기지 않는다.

export function proxy(request: NextRequest): NextResponse {
  // F29: 저장된 언어 설정(쿠키/세션 값)이 있으면 Accept-Language 보다 먼저 본다 — 지금은 헤더만
  const locale = negotiateLocale(request.headers.get('accept-language'))

  // 쿼리스트링 보존 (`/?from=share` → `/ko?from=share`)
  const url = new URL(`/${locale}${request.nextUrl.search}`, request.url)
  const response = NextResponse.redirect(url, 307)
  // 캐시가 언어별로 갈라지게
  response.headers.set('Vary', 'Accept-Language')
  return response
}

export const config = {
  matcher: ['/'],
}
