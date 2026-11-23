import 'server-only'

import type { AuthSession } from '@/server/auth'
import { AppError } from '@/shared/lib/api-error'

// 권한 판정 — FEATURES F10, decisions/architecture.md A3(서비스 계층 한 곳), decisions/authorization.md.
// 서비스는 세션이 아니라 "요청자(Requester)" 를 받고, 판정은 전부 이 파일의 순수 함수로 한다 — Route Handler·Server Component 는 판정하지 않는다.
// 기존 앱의 헬퍼 1종 + admin 라우트 10개 파일 인라인 isAdmin 체크(AUDIT M5), 인증 없는 읽기 API(M1 IDOR)를 구조로 막는다.
//
// 판정표 (authorization.test.ts 가 같은 표를 검증한다)
// | 요청자 \ 동작        | 로그인 필요 | 관리자 필요 | 소유자만(수정)       | 소유자·관리자(삭제=제재) | 열람 |
// | 비로그인            | 401        | 401        | 401                | 401                   | 공개만 |
// | 본인(소유자)         | 통과        | 403        | 통과               | 통과                  | 항상 |
// | 타인(일반 사용자)     | 통과        | 403        | 공개 403 · 비공개 404 | 공개 403 · 비공개 404   | 공개만 |
// | 관리자(타인 리소스)   | 통과        | 통과        | 공개 403 · 비공개 404 | 통과                  | 공개만 |
// | 차단 중 사용자       | → 비로그인과 같다 (toRequester 가 anonymous 로 바꾼다)                              |
//
// 사용자 결정 2026-11-23:
// 1. 관리자는 소유자가 아니다 — 남의 콘텐츠를 수정·추가하지 못하고, 제재(삭제·차단)만 할 수 있다 (위법 상품·링크 게재 제지 수단)
// 2. 차단 중(banned, banExpires 지나지 않음)인 사용자의 살아 있는 세션은 비로그인으로 본다 — admin 플러그인은 새 세션 생성만 막으므로 여기서 한 번 더 거른다
// 타인 리소스는 비공개면 404(존재를 숨긴다 — error-handling), 공개면 403(존재는 이미 공개). isPublic 을 모르면 404(안전한 쪽).

export type Role = 'user' | 'admin'

export type Requester = { kind: 'anonymous' } | { kind: 'user'; userId: string; role: Role }

export type AuthenticatedRequester = Extract<Requester, { kind: 'user' }>

export const ANONYMOUS: Requester = { kind: 'anonymous' }

/** 소유자가 있는 리소스. isPublic 을 주면 타인에게 403/404 를 구분한다 */
export type Owned = { userId: string; isPublic?: boolean }

/** 세션 사용자 중 판정에 쓰는 필드만 — Better Auth 세션의 user 가 그대로 들어간다(Pick 으로 타입을 묶어 둔다) */
export type RequesterSource = Pick<AuthSession['user'], 'id' | 'role' | 'banned' | 'banExpires'>

function isBanned(user: RequesterSource, now: Date): boolean {
  if (user.banned !== true) return false
  // 기한이 있고 지났으면 차단 해제 상태 — admin 플러그인도 같은 기준으로 세션 생성 시 해제한다
  if (user.banExpires instanceof Date && user.banExpires.getTime() < now.getTime()) return false
  return true
}

/** 세션 → 요청자. 세션이 없거나 차단 중이면 anonymous. role 은 'admin' 만 관리자, 그 외(없음 포함)는 일반 사용자 */
export function toRequester(
  user: RequesterSource | null | undefined,
  now: Date = new Date(),
): Requester {
  if (user === null || user === undefined || isBanned(user, now)) return ANONYMOUS
  return { kind: 'user', userId: user.id, role: user.role === 'admin' ? 'admin' : 'user' }
}

export function isAdmin(requester: Requester): boolean {
  return requester.kind === 'user' && requester.role === 'admin'
}

export function isOwner(requester: Requester, resource: Owned): boolean {
  return requester.kind === 'user' && requester.userId === resource.userId
}

/** 로그인 필요 — 비로그인이면 401 */
export function requireUser(requester: Requester): AuthenticatedRequester {
  if (requester.kind === 'anonymous') throw new AppError('UNAUTHENTICATED')
  return requester
}

/** 관리자 필요 — 비로그인 401, 일반 사용자 403 */
export function requireAdmin(requester: Requester): AuthenticatedRequester {
  const user = requireUser(requester)
  if (user.role !== 'admin') throw new AppError('FORBIDDEN')
  return user
}

function denyNonOwner(resource: Owned): never {
  throw new AppError(resource.isPublic === true ? 'FORBIDDEN' : 'NOT_FOUND')
}

/** 소유자만(수정·추가) — 관리자도 남의 것은 못 고친다. 비로그인 401, 타인은 공개 403 · 비공개 404 */
export function requireOwner(requester: Requester, resource: Owned): AuthenticatedRequester {
  const user = requireUser(requester)
  if (user.userId !== resource.userId) denyNonOwner(resource)
  return user
}

/** 소유자 또는 관리자(삭제 = 제재) — 위법 콘텐츠를 관리자가 내릴 수 있는 유일한 경로. 비로그인 401, 타인은 공개 403 · 비공개 404 */
export function requireOwnerOrAdmin(requester: Requester, resource: Owned): AuthenticatedRequester {
  const user = requireUser(requester)
  if (user.userId !== resource.userId && user.role !== 'admin') denyNonOwner(resource)
  return user
}

/** 열람 — 소유자는 항상, 그 외(관리자 포함)는 공개일 때만. throw 하지 않는다(호출자가 404 로 바꾼다 — 공유 페이지 F24) */
export function canView(requester: Requester, resource: Required<Owned>): boolean {
  return resource.isPublic || isOwner(requester, resource)
}
