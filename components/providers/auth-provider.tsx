'use client'

import { SessionProvider, useSession, signOut } from 'next-auth/react'
import React, { createContext, useContext } from 'react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  
  const user = session?.user ? {
    id: (session.user as any).id || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null

  const logout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const contextValue: AuthContextType = {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    logout
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}