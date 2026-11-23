import { describe, expect, it } from 'vitest'

import { isAppError, type ErrorCode } from '@/shared/lib/api-error'

import {
  ANONYMOUS,
  canView,
  isAdmin,
  isOwner,
  requireAdmin,
  requireOwner,
  requireOwnerOrAdmin,
  requireUser,
  toRequester,
  type Requester,
  type RequesterSource,
} from './authorization'

// FEATURES F10 동등성 확인 방법: "본인·타인·관리자·비로그인별 판정 결과 표". authorization.ts 머리의 판정표를 그대로 검증한다.

const OWNER_ID = '00000000-0000-7000-8000-000000000001'
const OTHER_ID = '00000000-0000-7000-8000-000000000002'
const ADMIN_ID = '00000000-0000-7000-8000-000000000003'

const owner: Requester = { kind: 'user', userId: OWNER_ID, role: 'user' }
const other: Requester = { kind: 'user', userId: OTHER_ID, role: 'user' }
const admin: Requester = { kind: 'user', userId: ADMIN_ID, role: 'admin' }

const publicResource = { userId: OWNER_ID, isPublic: true }
const privateResource = { userId: OWNER_ID, isPublic: false }

type Outcome = 'pass' | ErrorCode

function outcomeOf(run: () => unknown): Outcome {
  try {
    run()
    return 'pass'
  } catch (error) {
    if (isAppError(error)) return error.code
    throw error
  }
}

describe('toRequester — 세션 사용자 → 요청자', () => {
  const now = new Date('2026-11-23T00:00:00Z')
  const base: RequesterSource = { id: OWNER_ID, role: 'user', banned: false, banExpires: null }

  it('세션이 없으면 anonymous', () => {
    expect(toRequester(null)).toEqual(ANONYMOUS)
    expect(toRequester(undefined)).toEqual(ANONYMOUS)
  })

  it('role 이 admin 이면 관리자, 그 외(user·없음·모르는 값)는 일반 사용자', () => {
    expect(toRequester({ ...base, role: 'admin' })).toEqual({
      kind: 'user',
      userId: OWNER_ID,
      role: 'admin',
    })
    expect(toRequester({ ...base, role: 'user' })).toEqual(owner)
    expect(toRequester({ ...base, role: null })).toEqual(owner)
    expect(toRequester({ ...base, role: undefined })).toEqual(owner)
    expect(toRequester({ ...base, role: 'superuser' })).toEqual(owner)
  })

  // 사용자 결정 2026-11-23 (결정 2): 차단 중인 사용자의 살아 있는 세션은 비로그인
  it('차단 중(banned, 기한 없음)이면 anonymous', () => {
    expect(toRequester({ ...base, banned: true, banExpires: null }, now)).toEqual(ANONYMOUS)
    expect(toRequester({ ...base, banned: true, banExpires: undefined }, now)).toEqual(ANONYMOUS)
  })

  it('차단 기한이 남아 있으면 anonymous, 지났으면 일반 사용자 (admin 플러그인과 같은 기준)', () => {
    const future = new Date('2026-12-01T00:00:00Z')
    const past = new Date('2026-11-01T00:00:00Z')
    expect(toRequester({ ...base, banned: true, banExpires: future }, now)).toEqual(ANONYMOUS)
    expect(toRequester({ ...base, banned: true, banExpires: past }, now)).toEqual(owner)
  })

  it('관리자도 차단되면 anonymous', () => {
    expect(toRequester({ ...base, role: 'admin', banned: true, banExpires: null }, now)).toEqual(
      ANONYMOUS,
    )
  })

  it('banned 가 null·undefined 면 차단 아님', () => {
    expect(toRequester({ ...base, banned: null })).toEqual(owner)
    expect(toRequester({ ...base, banned: undefined })).toEqual(owner)
  })
})

describe('isAdmin · isOwner', () => {
  it.each<[string, Requester, boolean]>([
    ['비로그인', ANONYMOUS, false],
    ['본인', owner, false],
    ['타인', other, false],
    ['관리자', admin, true],
  ])('isAdmin(%s) = %s', (_label, requester, expected) => {
    expect(isAdmin(requester)).toBe(expected)
  })

  it.each<[string, Requester, boolean]>([
    ['비로그인', ANONYMOUS, false],
    ['본인', owner, true],
    ['타인', other, false],
    ['관리자', admin, false],
  ])('isOwner(%s) = %s', (_label, requester, expected) => {
    expect(isOwner(requester, publicResource)).toBe(expected)
  })
})

describe('판정표 — 요청자 × 동작', () => {
  // 열: 로그인 필요 / 관리자 필요 / 소유자만(공개·비공개) / 소유자·관리자(공개·비공개)
  it.each<[string, Requester, Outcome, Outcome, Outcome, Outcome, Outcome, Outcome]>([
    // 요청자    requireUser  requireAdmin  owner/공개   owner/비공개  ownerOrAdmin/공개  ownerOrAdmin/비공개
    [
      '비로그인',
      ANONYMOUS,
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
    ],
    ['본인', owner, 'pass', 'FORBIDDEN', 'pass', 'pass', 'pass', 'pass'],
    ['타인', other, 'pass', 'FORBIDDEN', 'FORBIDDEN', 'NOT_FOUND', 'FORBIDDEN', 'NOT_FOUND'],
    // 사용자 결정 2026-11-23 (결정 1): 관리자는 소유자가 아니다 — 수정은 못 하고 제재(삭제)만
    ['관리자', admin, 'pass', 'pass', 'FORBIDDEN', 'NOT_FOUND', 'pass', 'pass'],
  ])(
    '%s',
    (
      _label,
      requester,
      user,
      adminOnly,
      ownerPublic,
      ownerPrivate,
      ownerOrAdminPublic,
      ownerOrAdminPrivate,
    ) => {
      expect(outcomeOf(() => requireUser(requester))).toBe(user)
      expect(outcomeOf(() => requireAdmin(requester))).toBe(adminOnly)
      expect(outcomeOf(() => requireOwner(requester, publicResource))).toBe(ownerPublic)
      expect(outcomeOf(() => requireOwner(requester, privateResource))).toBe(ownerPrivate)
      expect(outcomeOf(() => requireOwnerOrAdmin(requester, publicResource))).toBe(
        ownerOrAdminPublic,
      )
      expect(outcomeOf(() => requireOwnerOrAdmin(requester, privateResource))).toBe(
        ownerOrAdminPrivate,
      )
    },
  )

  it('isPublic 을 모르는 리소스는 타인에게 404 (안전한 쪽)', () => {
    const unknownVisibility = { userId: OWNER_ID }
    expect(outcomeOf(() => requireOwner(other, unknownVisibility))).toBe('NOT_FOUND')
    expect(outcomeOf(() => requireOwner(admin, unknownVisibility))).toBe('NOT_FOUND')
    expect(outcomeOf(() => requireOwnerOrAdmin(other, unknownVisibility))).toBe('NOT_FOUND')
    expect(outcomeOf(() => requireOwnerOrAdmin(admin, unknownVisibility))).toBe('pass')
  })

  it('통과하면 로그인 요청자를 그대로 돌려준다 (서비스가 userId 를 이어서 쓴다)', () => {
    expect(requireUser(owner)).toBe(owner)
    expect(requireAdmin(admin)).toBe(admin)
    expect(requireOwner(owner, privateResource)).toBe(owner)
    expect(requireOwnerOrAdmin(admin, privateResource)).toBe(admin)
  })
})

describe('canView — 열람', () => {
  it.each<[string, Requester, boolean, boolean]>([
    // 요청자   공개   비공개
    ['비로그인', ANONYMOUS, true, false],
    ['본인', owner, true, true],
    ['타인', other, true, false],
    ['관리자', admin, true, false],
  ])('%s: 공개 %s · 비공개 %s', (_label, requester, expectPublic, expectPrivate) => {
    expect(canView(requester, publicResource)).toBe(expectPublic)
    expect(canView(requester, privateResource)).toBe(expectPrivate)
  })
})
