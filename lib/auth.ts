export interface User {
  id: string
  name: string
  email: string
  profileImage?: string
  provider: 'kakao'
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// 로컬 스토리지 키
const AUTH_STORAGE_KEY = 'linklet_auth'

// 로컬 스토리지에서 인증 정보 가져오기
export function getStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isLoading: false, isAuthenticated: false }
  }

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) {
      return { user: null, isLoading: false, isAuthenticated: false }
    }

    const parsed = JSON.parse(stored)
    return {
      user: parsed.user,
      isLoading: false,
      isAuthenticated: !!parsed.user
    }
  } catch (error) {
    console.error('Failed to parse stored auth:', error)
    return { user: null, isLoading: false, isAuthenticated: false }
  }
}

// 로컬 스토리지에 인증 정보 저장
export function setStoredAuth(user: User | null) {
  if (typeof window === 'undefined') return

  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (error) {
    console.error('Failed to store auth:', error)
  }
}

// 로그아웃
export function logout() {
  setStoredAuth(null)
  // 페이지 새로고침으로 상태 초기화
  window.location.href = '/'
}

// 카카오 로그인 URL 생성 (나중에 구현)
export function getKakaoLoginUrl(): string {
  // TODO: 카카오 앱 설정 후 구현
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    throw new Error('Kakao login configuration is missing')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code'
  })

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}

// JWT 토큰 검증 (나중에 구현)
export async function validateToken(token: string): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}