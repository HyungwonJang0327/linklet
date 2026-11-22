import type { Dictionary } from '../types'

// 영어 사전 — ko 와 같은 키 집합을 satisfies 가 강제한다 (누락·초과 모두 컴파일 에러). 문장은 직역이 아니라 같은 행동 안내
// 복수형은 아직 지원하지 않으므로 개수에 중립으로 쓴다 (decisions/i18n.md L5)
export const en = {
  errors: {
    VALIDATION_FAILED: 'Some of what you entered needs a fix. Check the highlighted fields.',
    UNAUTHENTICATED: 'You need to sign in first. Sign in and try again.',
    FORBIDDEN: "You don't have permission to do this. Make sure this wishlist is yours.",
    NOT_FOUND: "We couldn't find that. Check the address or go back to your lists.",
    CONFLICT: 'This was changed somewhere else first. Refresh and try again.',
    LIMIT_REACHED: "You've reached the limit. Clear out some unused items and try again.",
    RATE_LIMITED: 'Too many requests in a row. Take a short break and try again.',
    UPSTREAM_FAILED:
      "We couldn't load the link details. Check the address or fill them in yourself.",
    INTERNAL: 'Something went wrong. Please try again in a moment.',
    UNAVAILABLE: 'Linklet is briefly unavailable. Please try again in a bit.',
    UNKNOWN: 'Something unexpected happened. Refresh or try again in a moment.',
  },
  common: {
    appName: 'Linklet',
    retry: 'Try again',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'OK',
    back: 'Back',
    loading: 'Loading…',
  },
  notFound: {
    title: "We couldn't find that page",
    description:
      'The address may have changed, or the page was removed. Head back home and try finding it again.',
    home: 'Go home',
  },
  errorPage: {
    title: 'Something went wrong',
    description: 'Please try again in a moment. If it keeps happening, let us know.',
  },
  metadata: {
    title: 'Linklet — Paste a link, build your wishlist',
    description:
      'Everything you want lately, gathered into one pretty wishlist page just by pasting links. Share it with friends with a single link.',
  },
} satisfies Dictionary
