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

  const isAuthenticated = status !== 'loading' && !!session?.user
  const isLoading = status === 'loading'

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
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
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
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