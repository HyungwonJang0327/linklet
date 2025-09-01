'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'linklet-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme | null
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error)
    }
  }, [storageKey])

  // Update resolved theme when theme changes or system preference changes
  useEffect(() => {
    if (!mounted) return

    const updateResolvedTheme = () => {
      try {
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          setResolvedTheme(systemTheme)
        } else {
          setResolvedTheme(theme)
        }
      } catch (error) {
        console.error('Failed to detect system theme:', error)
        setResolvedTheme('dark') // Fallback
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    if (theme === 'system') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', updateResolvedTheme)
        return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
      } catch (error) {
        console.error('Failed to set up media query listener:', error)
      }
    }
  }, [theme, mounted])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (!mounted) return

    try {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(resolvedTheme)

      localStorage.setItem(storageKey, theme)
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }, [theme, resolvedTheme, storageKey, mounted])

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}