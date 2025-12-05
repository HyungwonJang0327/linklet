'use client'

import { Card } from '@/components/ui/card'
import { UserCircleIcon, HeartIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface CustomizationPreviewProps {
  customization: {
    theme: string
    layout: string
    colors: {
      primary: string
      background: string
      text: string
      accent: string
    }
    profile: {
      displayName: string
      bio: string
      avatar: string
      showItemCount: boolean
      showCreatedDate: boolean
    }
    socialLinks: Array<{
      platform: string
      url: string
      enabled: boolean
    }>
    wishlistData?: {
      id: string
      title: string
      description: string
      itemCount: number
      shareUrl: string
      createdAt: string
      items?: Array<{
        id: string
        title: string
        description: string | null
        imageUrl: string | null
        price: string | null
        productUrl: string
      }>
    }
  }
}

const sampleWishlistItems = [
  {
    id: '1',
    title: 'iPhone 15 Pro',
    description: '최신 스마트폰',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
    price: '1,200,000원'
  },
  {
    id: '2', 
    title: 'MacBook Pro',
    description: '개발용 노트북',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop',
    price: '2,500,000원'
  },
  {
    id: '3',
    title: 'AirPods Pro',
    description: '무선 이어폰',
    imageUrl: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=300&h=300&fit=crop',
    price: '350,000원'
  },
  {
    id: '4',
    title: 'Apple Watch',
    description: '스마트 워치',
    imageUrl: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=300&h=300&fit=crop',
    price: '500,000원'
  }
]

export function CustomizationPreview({ customization }: CustomizationPreviewProps) {
  const { wishlistData } = customization

  // 실제 위시리스트 아이템이 있으면 사용, 없으면 샘플 데이터 사용
  const displayItems = wishlistData?.items && wishlistData.items.length > 0
    ? wishlistData.items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
        price: item.price || '가격 정보 없음'
      }))
    : sampleWishlistItems

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

  const getLayoutClass = () => {
    switch (customization.layout) {
      case 'list':
        return 'grid grid-cols-1 gap-2'
      case 'masonry':
        return 'grid grid-cols-2 gap-2'
      case 'carousel':
        return 'flex gap-2 overflow-x-auto'
      default:
        return 'grid grid-cols-2 gap-2'
    }
  }

  const enabledSocialLinks = customization.socialLinks.filter(link => link.enabled && link.url)

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          실시간 미리보기
        </h3>
        
        {/* Mobile Frame */}
        <div className="mx-auto max-w-sm">
          <div className="bg-slate-900 rounded-xl p-2 shadow-xl">
            <div 
              className="rounded-lg overflow-hidden min-h-[400px]"
              style={getThemeStyles()}
            >
              <div className="p-4">
                {/* Profile Section */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                    {customization.profile.avatar ? (
                      <Image
                        src={customization.profile.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: customization.colors.primary }}
                      >
                        <UserCircleIcon className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h1 
                    className="text-lg font-bold mb-2"
                    style={{ color: customization.colors.text }}
                  >
                    {customization.profile.displayName || wishlistData?.title || '위시리스트 제목'}
                  </h1>
                  
                  {customization.profile.bio && (
                    <p 
                      className="text-sm opacity-80 mb-3"
                      style={{ color: customization.colors.text }}
                    >
                      {customization.profile.bio}
                    </p>
                  )}

                  {/* Social Links Preview */}
                  {enabledSocialLinks.length > 0 && (
                    <div className="flex justify-center gap-2 mb-4">
                      {enabledSocialLinks.slice(0, 4).map((link, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                          style={{ 
                            backgroundColor: customization.colors.primary + '20',
                            color: customization.colors.primary
                          }}
                        >
                          {link.platform.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-4 text-xs opacity-70">
                    {customization.profile.showItemCount && (
                      <span>{(wishlistData?.itemCount || 4).toLocaleString()}개 아이템</span>
                    )}
                    {customization.profile.showCreatedDate && (
                      <span>{wishlistData?.createdAt || '2024.08.31'}</span>
                    )}
                  </div>
                </div>

                {/* Wishlist Items */}
                <div className={getLayoutClass()}>
                  {displayItems.map((item, index) => {
                    if (customization.layout === 'carousel' && index > 1) return null
                    if (customization.layout === 'masonry' && index > 3) return null
                    if (customization.layout === 'list' && index > 2) return null
                    if (customization.layout === 'grid' && index > 3) return null
                    
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg overflow-hidden ${
                          customization.layout === 'list' ? 'flex gap-3' : ''
                        }`}
                        style={{
                          backgroundColor: customization.theme === 'minimal' 
                            ? '#f8fafc' 
                            : customization.colors.primary + '15',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <div className={`${
                          customization.layout === 'list' ? 'w-16 h-16' : 'aspect-square'
                        } bg-slate-600 rounded relative`}>
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        
                        <div className={`p-2 ${customization.layout === 'list' ? 'flex-1' : ''}`}>
                          <h3 
                            className={`font-medium truncate ${
                              customization.layout === 'list' ? 'text-sm' : 'text-xs'
                            }`}
                            style={{ color: customization.colors.text }}
                          >
                            {item.title}
                          </h3>
                          {customization.layout !== 'carousel' && (
                            <p 
                              className="text-xs opacity-70 mt-1"
                              style={{ 
                                color: customization.colors.accent || customization.colors.primary 
                              }}
                            >
                              {item.price}
                            </p>
                          )}
                        </div>

                        {customization.layout !== 'list' && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <HeartIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="mt-4 text-center">
          <div className="text-slate-400 text-xs mb-2">
            {wishlistData ? `"${wishlistData.title}"` : '위시리스트'} · {customization.theme} 테마 · {customization.layout} 레이아웃
          </div>
          <div className="flex justify-center gap-2 text-xs">
            <span 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: customization.colors.primary + '20',
                color: customization.colors.primary 
              }}
            >
              {customization.colors.primary}
            </span>
            <span 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: customization.colors.accent + '20',
                color: customization.colors.accent 
              }}
            >
              {customization.colors.accent}
            </span>
          </div>
          {wishlistData?.shareUrl && (
            <div className="mt-2 text-slate-500 text-xs">
              공유 링크: /w/{wishlistData.shareUrl}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}