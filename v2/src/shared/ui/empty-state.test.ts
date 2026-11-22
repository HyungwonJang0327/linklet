import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { EMPTY_STATE_ACTION_CLASS, EmptyState } from './empty-state'

// F06 — 제목·설명·action 렌더. 새 의존성(RTL) 없이 react-dom/server 로 렌더한다 (client.test.ts 와 같은 방식)

describe('EmptyState', () => {
  it('제목(h1)·설명(p) 을 그 순서로 렌더한다', () => {
    const html = renderToString(
      createElement(EmptyState, { title: '제목입니다', description: '설명입니다' }),
    )
    expect(html).toMatch(/<h1[^>]*>제목입니다<\/h1>/)
    expect(html).toMatch(/<p[^>]*>설명입니다<\/p>/)
    expect(html.indexOf('제목입니다')).toBeLessThan(html.indexOf('설명입니다'))
  })

  it('action 이 없으면 행동 영역을 그리지 않는다', () => {
    const html = renderToString(createElement(EmptyState, { title: 't', description: 'd' }))
    expect(html).not.toContain('<a')
    expect(html).not.toContain('<button')
  })

  it('action 으로 넘긴 링크·버튼을 설명 뒤에 그린다', () => {
    const html = renderToString(
      createElement(EmptyState, {
        title: 't',
        description: 'd',
        action: createElement('a', { href: '/ko', className: EMPTY_STATE_ACTION_CLASS }, '홈으로'),
      }),
    )
    expect(html).toMatch(/<a href="\/ko"[^>]*>홈으로<\/a>/)
    expect(html.indexOf('d</p>')).toBeLessThan(html.indexOf('<a href'))
  })

  it('토큰 클래스만 쓴다 — 원색·기본 단계·dark: 없음 (design-tokens.md)', () => {
    const html = renderToString(createElement(EmptyState, { title: 't', description: 'd' }))
    const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]?.split(' ') ?? [])
    expect(classes.length).toBeGreaterThan(0)
    for (const cls of [...classes, ...EMPTY_STATE_ACTION_CLASS.split(' ')]) {
      expect(cls).not.toMatch(/^(bg|text|border)-(slate|gray|zinc|neutral|blue|red|white|black)/)
      expect(cls).not.toMatch(/^dark:/)
      expect(cls).not.toMatch(/^text-(xs|sm|base|lg|xl|\dxl)$/)
    }
    // 행동 요소에 포커스 링이 있다 (§4-3)
    expect(EMPTY_STATE_ACTION_CLASS).toContain('focus-visible:outline-focus')
  })
})
