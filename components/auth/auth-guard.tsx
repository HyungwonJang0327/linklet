'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Unauthorized } from '@/components/errors/unauthorized'
import { LoadingSpinner } from '@/components/ui/loading'
import { useI18n } from '@/lib/i18n/context'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  title?: string
  description?: string
}

export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
  title,
  description
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useI18n()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">{t('auth.guard.checkingAuth')}</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Use custom fallback if provided, otherwise show default unauthorized component
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Unauthorized
        title={title}
        description={description}
      />
    )
  }

  // If authentication is not required or user is authenticated, show children
  return <div key={`auth-${isAuthenticated}`}>{children}</div>
}

// Higher-order component version for easier usage
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    title?: string
    description?: string
    fallback?: React.ReactNode
  }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard
        title={options?.title}
        description={options?.description}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}