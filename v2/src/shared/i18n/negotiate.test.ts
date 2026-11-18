import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE } from './config'
import { negotiateLocale } from './negotiate'

// FEATURES F05 — `/` 가 브라우저 언어 경로로, 미지원 언어는 기본 언어(ko)
describe('negotiateLocale', () => {
  describe('지원 언어 일치', () => {
    it.each([
      ['ko', 'ko'],
      ['en', 'en'],
      ['ja', 'ja'],
      ['ko-KR', 'ko'],
      ['en-US', 'en'],
      ['ja-JP', 'ja'],
      ['en-US,en;q=0.9,ko;q=0.8', 'en'],
      ['ja,en-US;q=0.9,en;q=0.8', 'ja'],
    ])('%s → %s', (header, expected) => {
      expect(negotiateLocale(header)).toBe(expected)
    })

    it('대소문자를 무시한다 (JA-jp → ja, EN → en)', () => {
      expect(negotiateLocale('JA-jp')).toBe('ja')
      expect(negotiateLocale('EN')).toBe('en')
      expect(negotiateLocale('Ko-kr')).toBe('ko')
    })
  })

  describe('q 가중치', () => {
    it('q 내림차순으로 본다 (en;q=0.3,ko;q=0.9 → ko)', () => {
      expect(negotiateLocale('en;q=0.3,ko;q=0.9')).toBe('ko')
    })

    it('q 가 없으면 1 — 가중치 없는 항목이 q=0.9 보다 앞선다', () => {
      expect(negotiateLocale('en;q=0.9,ja')).toBe('ja')
    })

    it('q 동률이면 나열 순서', () => {
      expect(negotiateLocale('ja;q=0.5,en;q=0.5')).toBe('ja')
      expect(negotiateLocale('en;q=0.5,ja;q=0.5')).toBe('en')
    })

    it('q=0 은 제외한다', () => {
      expect(negotiateLocale('ja;q=0,en;q=0.5')).toBe('en')
      expect(negotiateLocale('ja;q=0')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('ja;q=0.0,en')).toBe('en')
    })

    it('깨진 q(q=abc·범위 밖) 는 그 항목만 버린다', () => {
      expect(negotiateLocale('ja;q=abc,en')).toBe('en')
      expect(negotiateLocale('ja;q=abc')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('ja;q=1.5,en;q=0.5')).toBe('en')
      expect(negotiateLocale('ja;q=,en')).toBe('en')
    })

    it('q 가 아닌 파라미터는 무시한다', () => {
      expect(negotiateLocale('ja;foo=bar')).toBe('ja')
      expect(negotiateLocale('ja;Q=0.2,en;q=0.5')).toBe('en')
    })
  })

  describe('미지원 언어·와일드카드 → 기본 언어', () => {
    it('미지원 언어만 있으면 ko (zh, fr-FR)', () => {
      expect(negotiateLocale('zh')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('fr-FR,fr;q=0.9')).toBe(DEFAULT_LOCALE)
    })

    it('미지원 언어 뒤에 지원 언어가 있으면 그 언어 (fr,ja;q=0.8 → ja)', () => {
      expect(negotiateLocale('fr,ja;q=0.8')).toBe('ja')
    })

    it('* 는 기본 언어 — 더 높은 q 의 지원 언어가 있으면 그 언어', () => {
      expect(negotiateLocale('*')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('ja;q=0.5,*;q=0.9')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('*;q=0.5,ja')).toBe('ja')
    })

    it('기존 앱 코드(kr·jp)는 언어 태그가 아니므로 ko', () => {
      expect(negotiateLocale('jp')).toBe(DEFAULT_LOCALE)
      expect(negotiateLocale('kr')).toBe(DEFAULT_LOCALE)
    })
  })

  describe('없거나 비어 있거나 깨진 헤더 → throw 없이 기본 언어', () => {
    it.each([null, undefined, '', '   ', ',', ',,;;', ';q=0.9', '-'])('%j → ko', (header) => {
      expect(negotiateLocale(header)).toBe(DEFAULT_LOCALE)
    })

    it('서브태그가 비어 있어도 기본 서브태그만 본다 (en- → en)', () => {
      expect(negotiateLocale('en-')).toBe('en')
    })

    it('공백·빈 항목·중복은 허용한다', () => {
      expect(negotiateLocale(' ja , en ; q = 0.5 ,, ')).toBe('ja')
      expect(negotiateLocale('ja,ja,ja;q=0.1')).toBe('ja')
      expect(negotiateLocale('zh, zh-TW;q=0.9, en;q=0.8, en;q=0.7')).toBe('en')
    })

    it('아주 긴 헤더는 앞부분만 보고 끝낸다', () => {
      const filler = 'zh;q=0.9,'.repeat(1000)
      // 2000자를 넘긴 뒤에 오는 지원 언어는 무시된다
      expect(negotiateLocale(`${filler}ja`)).toBe(DEFAULT_LOCALE)
      // 앞부분에 있으면 정상 적용
      expect(negotiateLocale(`ja,${filler}`)).toBe('ja')
    })
  })
})
