// features/auth 공개 API — 다른 기능·app 은 '@/features/auth' 로만 import 한다(ESLint FEATURE_BOUNDARY).
// getSession 은 server-only 라 이 index 를 **클라이언트 컴포넌트에서 import 하지 않는다**(빌드 에러로 막힌다). 클라이언트 컴포넌트는
// 이 기능 안의 것(AuthMenu·GoogleSignInButton)이며 서버 컴포넌트(layout·page)가 꽂는다.
export { AuthMenu } from './components/auth-menu'
export { GoogleSignInButton } from './components/google-sign-in-button'
export { getSession } from './server/session'
export {
  ANONYMOUS,
  canView,
  isAdmin,
  isOwner,
  requireAdmin,
  requireOwner,
  requireOwnerOrAdmin,
  requireUser,
  toRequester,
  type AuthenticatedRequester,
  type Owned,
  type Requester,
  type Role,
} from './server/authorization'
