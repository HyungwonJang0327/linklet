'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthState, User, getStoredAuth, setStoredAuth } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    // 컴포넌트 마운트 시 로컬 스토리지에서 인증 정보 로드
    try {
      const stored = getStoredAuth()
      setAuthState(stored)
    } catch (error) {
      console.error('Failed to load auth state:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }, [])

  const login = (user: User) => {
    const newState = {
      user,
      isLoading: false,
      isAuthenticated: true
    }
    setAuthState(newState)
    setStoredAuth(user)
  }

  const logout = () => {
    const newState = {
      user: null,
      isLoading: false,
      isAuthenticated: false
    }
    setAuthState(newState)
    setStoredAuth(null)
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}