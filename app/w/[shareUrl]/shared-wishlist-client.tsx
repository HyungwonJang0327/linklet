'use client'

import { useEffect, useRef, useState } from 'react'
import { useSharedWishlist } from '@/hooks/use-wishlists'
import { LoadingSpinner } from '@/components/ui/loading'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { I18nProvider, useI18n } from '@/lib/i18n/context'
import { getDictionary } from '@/lib/i18n/dictionary'
import { type Locale } from '@/lib/i18n/config'

interface SharedWishlistClientProps {
  shareUrl: string
}

// Detect browser language
const detectBrowserLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language.toLowerCase()

  if (browserLang.startsWith('ko')) return 'kr'
  if (browserLang.startsWith('ja')) return 'jp'

  return 'en'
}

// 기본 커스터마이징 설정
const DEFAULT_CUSTOMIZATION = {
  theme: 'modern',
  layout: 'grid',
  colors: {
    primary: '#3b82f6',
    background: '#0f172a',
    text: '#ffffff',
    accent: '#6366f1'
  },
  profile: {
    displayName: '',
    bio: '',
    avatar: '',
    showItemCount: true,
    showCreatedDate: false
  },
  socialLinks: [],
  backgroundImageUrl: ''
}

// Wrapper component with I18nProvider
export default function SharedWishlistClient({ shareUrl }: SharedWishlistClientProps) {
  const [locale, setLocale] = useState<Locale>('en')
  const [dictionary, setDictionary] = useState<any>(null)

  useEffect(() => {
    const loadDictionary = async () => {
      const detectedLocale = detectBrowserLocale()
      setLocale(detectedLocale)
      const dict = await getDictionary(detectedLocale)
      setDictionary(dict)
    }
    loadDictionary()
  }, [])

  if (!dictionary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <SharedWishlistContent shareUrl={shareUrl} locale={locale} />
    </I18nProvider>
  )
}

// Main component
function SharedWishlistContent({ shareUrl, locale }: SharedWishlistClientProps & { locale: Locale }) {
  const { data: wishlist, isLoading, error } = useSharedWishlist(shareUrl)
  const { t } = useI18n()
  const viewTracked = useRef(false)

  // Track view count when wishlist loads
  useEffect(() => {
    if (wishlist && !viewTracked.current) {
      viewTracked.current = true
      fetch(`/api/wishlists/${wishlist.id}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view' })
      }).catch(err => console.error('Failed to track view:', err))
    }
  }, [wishlist])

  // Track click on item
  const trackClick = (itemId: string, itemTitle: string, productUrl: string) => {
    if (!wishlist) return

    // Track in Linklet database
    fetch(`/api/wishlists/${wishlist.id}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click', itemId })
    }).catch(err => console.error('Failed to track click:', err))

    // Track in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'wishlist_item_click', {
        wishlist_id: wishlist.id,
        wishlist_title: wishlist.title,
        item_id: itemId,
        item_title: itemTitle,
        product_url: productUrl
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    if (error.message.includes('not found')) {
      notFound()
    }

    if (error.message.includes('private')) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white">
              {t('wishlist.shared.private')}
            </h1>
            <p className="text-slate-300">
              {t('wishlist.shared.privateMessage')}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">
            {t('wishlist.shared.error')}
          </h1>
          <p className="text-slate-300">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!wishlist) {
    notFound()
  }

  // 커스터마이징 설정 가져오기 (없으면 기본값 사용)
  const customization = wishlist.customization
    ? (typeof wishlist.customization === 'string'
        ? JSON.parse(wishlist.customization)
        : wishlist.customization)
    : DEFAULT_CUSTOMIZATION

  // 테마 스타일 가져오기
  const getThemeStyles = () => {
    const { theme, colors } = customization

    const baseStyles = {
      backgroundColor: colors.background,
      color: colors.text
    }

    switch (theme) {
      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          color: '#ffffff'
        }
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          color: '#1f2937'
        }
      case 'neon':
        return {
          ...baseStyles,
          backgroundColor: '#000000',
          boxShadow: `0 0 20px ${colors.accent}30`
        }
      case 'nature':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, #065f46, #047857)`
        }
      case 'sunset':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, #ea580c, #dc2626)`
        }
      default:
        return baseStyles
    }
  }

  // 레이아웃 클래스 가져오기
  const getLayoutClass = () => {
    switch (customization.layout) {
      case 'list':
        return 'grid grid-cols-1 gap-3'
      case 'masonry':
        return 'columns-2 gap-3'
      case 'carousel':
        return 'flex gap-3 overflow-x-auto pb-4'
      default:
        return 'grid grid-cols-2 gap-3'
    }
  }

  // 활성화된 소셜 링크 필터링
  const enabledSocialLinks = customization.socialLinks?.filter((link: any) => link.enabled && link.url) || []

  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString(locale === 'kr' ? 'ko-KR' : locale === 'jp' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={getThemeStyles()}
    >
      {/* Background Image */}
      {customization.backgroundImageUrl && (
        <div className="absolute inset-0">
          <Image
            key={customization.backgroundImageUrl}
            src={customization.backgroundImageUrl}
            alt="Background"
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="mx-auto py-8 px-4 relative z-10" style={{ maxWidth: '720px' }}>
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
            {customization.profile.avatar ? (
              <Image
                src={customization.profile.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
                width={80}
                height={80}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: customization.colors.primary }}
              >
                <UserCircleIcon className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: customization.colors.text }}
          >
            {customization.profile.displayName || wishlist.title}
          </h1>

          {customization.profile.bio && (
            <p
              className="text-sm opacity-80 mb-4"
              style={{ color: customization.colors.text }}
            >
              {customization.profile.bio}
            </p>
          )}

          {wishlist.description && !customization.profile.bio && (
            <p
              className="text-sm opacity-80 mb-4"
              style={{ color: customization.colors.text }}
            >
              {wishlist.description}
            </p>
          )}

          {/* Social Links */}
          {enabledSocialLinks.length > 0 && (
            <div className="flex justify-center gap-2 mb-4">
              {enabledSocialLinks.map((link: any, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-transform hover:scale-110"
                  style={{
                    backgroundColor: customization.colors.primary + '20',
                    color: customization.colors.primary,
                    border: `1px solid ${customization.colors.primary}`
                  }}
                >
                  {link.platform.charAt(0).toUpperCase()}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-xs opacity-70">
            {customization.profile.showItemCount && (
              <span>{wishlist.items?.length || 0} {t('wishlist.items')}</span>
            )}
            {customization.profile.showCreatedDate && (
              <span>{formatDate(wishlist.createdAt)}</span>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlist.items && wishlist.items.length > 0 ? (
          <div className={getLayoutClass()}>
            {wishlist.items.map((item: any) => (
              <a
                key={item.id}
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(item.id, item.title, item.productUrl)}
                className={`group rounded-lg overflow-hidden transition-all hover:scale-[1.02] ${
                  customization.layout === 'list' ? 'flex gap-3' : 'flex flex-col'
                } ${
                  customization.layout === 'masonry' ? 'break-inside-avoid mb-3' : ''
                }`}
                style={{
                  backgroundColor: customization.theme === 'minimal'
                    ? '#f8fafc'
                    : customization.colors.primary + '15',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${customization.colors.primary}30`
                }}
              >
                <div className={`${
                  customization.layout === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full aspect-square'
                } bg-slate-600 rounded relative overflow-hidden`}>
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
                      <span className="text-slate-400 text-4xl">🎁</span>
                    </div>
                  )}
                </div>

                <div className={`p-3 ${customization.layout === 'list' ? 'flex-1' : ''}`}>
                  <h3
                    className={`font-semibold mb-1 ${
                      customization.layout === 'list' ? 'text-base' : 'text-sm'
                    }`}
                    style={{ color: customization.colors.text }}
                  >
                    {item.title}
                  </h3>

                  {item.description && customization.layout === 'list' && (
                    <p
                      className="text-xs opacity-70 mb-1 line-clamp-2"
                      style={{ color: customization.colors.text }}
                    >
                      {item.description}
                    </p>
                  )}

                  {item.price && (
                    <p
                      className="text-xs font-medium mt-1"
                      style={{
                        color: customization.colors.accent || customization.colors.primary
                      }}
                    >
                      {item.price}
                    </p>
                  )}

                  {item.siteName && customization.layout === 'list' && (
                    <p
                      className="text-xs opacity-60 mt-1"
                      style={{ color: customization.colors.text }}
                    >
                      {item.siteName}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p
              className="text-lg opacity-70"
              style={{ color: customization.colors.text }}
            >
              {t('wishlist.noItems')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p
            className="text-sm opacity-50"
            style={{ color: customization.colors.text }}
          >
            Powered by Linklet
          </p>
        </div>
      </div>
    </div>
  )
}