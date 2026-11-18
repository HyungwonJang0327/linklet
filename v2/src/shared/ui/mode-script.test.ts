import { afterEach, describe, expect, it } from 'vitest'

import { MODE_SCRIPT } from './mode-script'

// decisions/design-tokens.md "모드 스크립트·CSP (F03)" — 인라인 스크립트 본문을 고정한다.
// vitest environment 는 node 그대로(jsdom 없음): document·matchMedia 가짜 객체를 globalThis 에 넣고 끝나면 제거한다.
// new Function(MODE_SCRIPT) 로 실행하면 스크립트 안의 bare `document`·`matchMedia` 가 globalThis 를 본다.

type FakeRoot = {
  attributes: Map<string, string>
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
}

function createFakeRoot(initial: Record<string, string> = {}): FakeRoot {
  const attributes = new Map(Object.entries(initial))
  return {
    attributes,
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => {
      attributes.set(name, value)
    },
  }
}

const g = globalThis as Record<string, unknown>

function install(root: FakeRoot, prefersDark: boolean | undefined): void {
  g['document'] = { documentElement: root }
  if (prefersDark === undefined) delete g['matchMedia']
  else g['matchMedia'] = (query: string) => ({ matches: prefersDark, media: query })
}

function run(): void {
  new Function(MODE_SCRIPT)()
}

afterEach(() => {
  delete g['document']
  delete g['matchMedia']
})

describe('MODE_SCRIPT 문자열', () => {
  it('`<` 가 없어 어떤 위치에서도 </script> 로 태그가 닫히지 않는다', () => {
    expect(MODE_SCRIPT).not.toContain('<')
    expect(MODE_SCRIPT.toLowerCase()).not.toContain('</script')
  })

  it('문법 오류 없이 함수로 만들어진다', () => {
    expect(() => new Function(MODE_SCRIPT)).not.toThrow()
  })
})

describe('MODE_SCRIPT 실행', () => {
  it('data-mode="light" 가 이미 있으면 유지한다 (dark 선호여도)', () => {
    const root = createFakeRoot({ 'data-mode': 'light' })
    install(root, true)
    run()
    expect(root.getAttribute('data-mode')).toBe('light')
  })

  it('data-mode="dark" 가 이미 있으면 유지한다 (light 선호여도)', () => {
    const root = createFakeRoot({ 'data-mode': 'dark' })
    install(root, false)
    run()
    expect(root.getAttribute('data-mode')).toBe('dark')
  })

  it('속성이 없으면 matchMedia 결과(dark)로 설정한다', () => {
    const root = createFakeRoot()
    install(root, true)
    run()
    expect(root.getAttribute('data-mode')).toBe('dark')
  })

  it('속성이 없고 light 선호면 light 로 설정한다', () => {
    const root = createFakeRoot()
    install(root, false)
    run()
    expect(root.getAttribute('data-mode')).toBe('light')
  })

  it('data-mode="system" 이면 matchMedia 결과로 바꾼다', () => {
    const root = createFakeRoot({ 'data-mode': 'system' })
    install(root, true)
    run()
    expect(root.getAttribute('data-mode')).toBe('dark')
  })

  it('matchMedia 가 없어도 throw 하지 않고 light 로 둔다', () => {
    const root = createFakeRoot()
    install(root, undefined)
    expect(run).not.toThrow()
    expect(root.getAttribute('data-mode')).toBe('light')
  })

  it('document 가 없어도 throw 하지 않는다', () => {
    delete g['document']
    delete g['matchMedia']
    expect(run).not.toThrow()
  })

  it('matchMedia 가 throw 해도 삼킨다 (data-mode 는 그대로)', () => {
    const root = createFakeRoot()
    g['document'] = { documentElement: root }
    g['matchMedia'] = () => {
      throw new Error('not supported')
    }
    expect(run).not.toThrow()
    expect(root.getAttribute('data-mode')).toBeNull()
  })
})
