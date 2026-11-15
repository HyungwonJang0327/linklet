import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'

// decisions/design-tokens.md "Phase 1 적용 결정 — 검증": Tailwind 4 의 공개 compile() 로 globals.css 를 컴파일해
// 기본 팔레트·단계가 비워졌는지, 토큰 유틸리티가 inline 참조로 만들어지는지 고정한다.
// 문법(--x-*: initial, @theme inline reference, @utility, @custom-variant)이 설치된 Tailwind 에서 기대대로 동작함을 이 테스트가 증명한다.

const APP_DIR = import.meta.dirname
const require = createRequire(import.meta.url)
const TAILWIND_INDEX_CSS = require.resolve('tailwindcss/index.css')

// compile() 은 @import 를 스스로 읽지 않는다 — loadStylesheet 로 'tailwindcss'(패키지 index.css)와 상대 경로를 넘긴다
async function loadStylesheet(id: string, base: string) {
  const filePath = id === 'tailwindcss' ? TAILWIND_INDEX_CSS : path.resolve(base, id)
  return { path: filePath, base: path.dirname(filePath), content: readFileSync(filePath, 'utf8') }
}

const FORBIDDEN_CANDIDATES = [
  'bg-slate-800',
  'text-red-500',
  'text-sm',
  'font-bold',
  'rounded-xl',
  'shadow-md',
  'leading-tight',
  'font-sans',
]
const REQUIRED_CANDIDATES = [
  'bg-page',
  'text-fg',
  'bg-accent',
  'text-on-accent',
  'border-line-strong',
  'rounded-btn',
  'shadow-float',
  'px-page-x',
  'min-h-touch',
  'h-control',
  'text-display',
  'text-body',
  // 컴파일 검증용 후보 — @custom-variant dark 가 [data-mode="dark"] 로 생성되는지 본다. 컴포넌트에서의 사용은 ESLint 가 막는다
  // eslint-disable-next-line no-restricted-syntax
  'dark:bg-accent',
]

/** 컴파일 결과에서 해당 클래스의 규칙 본문을 꺼낸다(없으면 null). 셀렉터는 Tailwind 가 이스케이프한 형태를 그대로 찾는다 */
function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) return null
  const end = css.indexOf('}', start)
  return css.slice(start, end)
}

describe('globals.css — Tailwind @theme 연결 (decisions/design-tokens.md)', () => {
  let css = ''

  beforeAll(async () => {
    const source = readFileSync(path.join(APP_DIR, 'globals.css'), 'utf8')
    const compiled = await compile(source, { base: APP_DIR, loadStylesheet })
    css = compiled.build([...FORBIDDEN_CANDIDATES, ...REQUIRED_CANDIDATES])
  })

  it('토큰 사본이 포함된다 — [data-skin][data-mode] 블록과 --c-bg', () => {
    expect(css).toContain('[data-skin="canvas"][data-mode="light"]')
    expect(css).toContain('--c-bg:')
  })

  it.each(FORBIDDEN_CANDIDATES)(
    '기본 팔레트·단계 initial — %s 는 만들어지지 않는다',
    (candidate) => {
      expect(ruleBody(css, `.${candidate}`)).toBeNull()
    },
  )

  it('--color-*: initial — 기본 색 변수가 하나도 방출되지 않는다', () => {
    expect(css).not.toMatch(/--color-(slate|gray|zinc|neutral|stone|red|blue|green)-\d+/)
  })

  it('--font-*: initial — Tailwind 글꼴 스택(Segoe UI)이 :root 변수로 방출되지 않는다', () => {
    expect(css).not.toMatch(/--font-sans:\s*-apple-system, BlinkMacSystemFont, "Segoe UI"/)
  })

  it('@theme inline — bg-page 는 토큰 변수 var(--c-bg) 를 직접 참조한다', () => {
    expect(ruleBody(css, '.bg-page')).toContain('background-color: var(--c-bg)')
  })

  it.each([
    ['.text-fg', 'color: var(--c-text)'],
    ['.bg-accent', 'background-color: var(--c-accent)'],
    ['.text-on-accent', 'color: var(--c-on-accent)'],
    ['.border-line-strong', 'border-color: var(--c-border-strong)'],
    ['.rounded-btn', 'border-radius: var(--r-btn)'],
    ['.shadow-float', '--tw-shadow: var(--shadow-float)'],
    ['.px-page-x', 'padding-inline: var(--pad-x)'],
    ['.min-h-touch', 'min-height: var(--touch)'],
    ['.h-control', 'height: var(--control-h)'],
    ['.text-body', 'font: var(--t-body)'],
  ])('토큰 유틸리티 %s → %s', (selector, declaration) => {
    expect(ruleBody(css, selector)).toContain(declaration)
  })

  it('@utility text-display — font 축약형 + 자간', () => {
    const body = ruleBody(css, '.text-display')
    expect(body).toContain('font: var(--t-display)')
    expect(body).toContain('letter-spacing: var(--t-display-ls)')
  })

  it('@theme inline reference — 토큰과 이름이 같은 --shadow-float 가 :root 자기 참조로 방출되지 않는다', () => {
    expect(css).not.toContain('--shadow-float: var(--shadow-float)')
  })

  it('글꼴 — preflight 의 html { font-family } 가 tokens.css 의 --font-sans 를 읽는다', () => {
    const html = ruleBody(css, 'html, :host')
    expect(html).toContain('font-family: var(--font-sans')
  })

  it('@custom-variant dark — [data-mode="dark"] 로 생성된다(사용은 ESLint 가 막는다)', () => {
    expect(css).toMatch(/\[data-mode=["']dark["']\] \.dark\\:bg-accent \{/)
  })

  it('color-scheme 이 data-mode 에 붙는다', () => {
    // tokens.css 의 [data-mode="dark"] { --shadow-float } 블록과 셀렉터가 같으므로 선언까지 묶어 찾는다
    expect(css).toMatch(/\[data-mode=["']dark["']\]\s*\{\s*color-scheme: dark/)
    expect(css).toMatch(/\[data-mode=["']light["']\]\s*\{\s*color-scheme: light/)
  })
})
