import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// decisions/design-tokens.md "Phase 1 적용 결정" — v2 는 토큰 사본을 import 하고, 원본과 바이트 단위로 같아야 한다.
// 원본은 design/mockups/tokens.css — 값이 바뀌면 원본을 고치고 복사한다. 사본을 직접 편집하지 않는다.
const COPY_PATH = path.join(import.meta.dirname, 'tokens.css')
const SOURCE_PATH = path.join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'design',
  'mockups',
  'tokens.css',
)

describe('src/app/tokens.css (디자인 토큰 사본)', () => {
  it('원본 design/mockups/tokens.css 와 바이트 동일하다 — 값이 바뀌면 원본을 고치고 복사한다', () => {
    const copy = readFileSync(COPY_PATH, 'utf8')
    const source = readFileSync(SOURCE_PATH, 'utf8')
    expect(copy).toBe(source)
  })

  it('Tailwind 연결(@theme·@utility·@custom-variant)은 사본에 두지 않는다 — globals.css 에만', () => {
    const copy = readFileSync(COPY_PATH, 'utf8')
    expect(copy).not.toMatch(/@theme|@utility|@custom-variant|@import/)
  })
})
