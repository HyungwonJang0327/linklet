'use client'

import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useUser } from '@/hooks/use-user'
import { useWishlists } from '@/hooks/use-wishlists'
import { EyeIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline'

export default function AnalyticsPage() {
  const { t } = useI18n()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userData } = useUser()
  const { data: wishlists, isLoading, error, refetch } = useWishlists(userData?.id)

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">{t('settings.analytics.authRequired')}</h2>
            <p className="text-slate-300">{t('settings.analytics.authRequiredDesc')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="text-slate-300">{t('common.loading')}</div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">{t('common.error')}</h2>
            <p className="text-slate-300">{error instanceof Error ? error.message : t('settings.analytics.failedToLoad')}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t('settings.analytics.retry')}
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // Calculate total stats
  const totalViews = wishlists?.reduce((sum, wishlist) => sum + (wishlist.viewCount || 0), 0) || 0
  const totalClicks = wishlists?.reduce((sum, wishlist) => sum + (wishlist.clickCount || 0), 0) || 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.analytics.title')}</h1>
        <p className="text-slate-300">
          {t('settings.analytics.description')}
        </p>
      </div>

      {/* Total Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <EyeIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t('settings.analytics.totalViews')}</p>
                <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CursorArrowRaysIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t('settings.analytics.totalClicks')}</p>
                <p className="text-3xl font-bold text-white">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Wishlist Stats */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('settings.analytics.wishlistStats')}</h2>

          {wishlists && wishlists.length > 0 ? (
            <div className="space-y-3">
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{wishlist.title}</h3>
                    {wishlist.description && (
                      <p className="text-sm text-slate-400 line-clamp-1">{wishlist.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 ml-4">
                    <div className="flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">{(wishlist.viewCount || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CursorArrowRaysIcon className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{(wishlist.clickCount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">{t('settings.analytics.noWishlists')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">{t('settings.analytics.infoTitle')}</h3>
          <p className="text-sm text-slate-300">{t('settings.analytics.infoDescription')}</p>
        </div>
      </Card>
    </div>
  )
}
