'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface RateLimitContextValue {
  isGloballyRateLimited: boolean
  rateLimitSecondsLeft: number
  handleRateLimitDetected: () => void
}

const RateLimitContext = createContext<RateLimitContextValue | undefined>(undefined)

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [isGloballyRateLimited, setIsGloballyRateLimited] = useState(false)
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0)

  const handleRateLimitDetected = useCallback(() => {
    setIsGloballyRateLimited(true)
    setRateLimitSecondsLeft(60)

    // Countdown timer
    const interval = setInterval(() => {
      setRateLimitSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsGloballyRateLimited(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  return (
    <RateLimitContext.Provider
      value={{
        isGloballyRateLimited,
        rateLimitSecondsLeft,
        handleRateLimitDetected,
      }}
    >
      {children}
    </RateLimitContext.Provider>
  )
}

export function useRateLimit() {
  const context = useContext(RateLimitContext)
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider')
  }
  return context
}
