'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomizationPreview } from '@/components/customize/customization-preview'
import { ThemeSelector } from '@/components/customize/theme-selector'
import { LayoutSelector } from '@/components/customize/layout-selector'
import { ColorPicker } from '@/components/customize/color-picker'
import { ProfileCustomizer } from '@/components/customize/profile-customizer'
import { SocialLinksManager } from '@/components/customize/social-links-manager'
import { WishlistSelector } from '@/components/customize/wishlist-selector'
import { useI18n } from '@/lib/i18n/context'
import { EyeIcon } from '@heroicons/react/24/outline'
import CustomizeHeader from './components/customize-header'
import CustomizeTabs from './components/customize-tabs'
import EmptyState from './components/empty-state'

// 기본 커스터마이징 템플릿
const getDefaultCustomization = (wishlistTitle: string = '위시리스트') => ({
  theme: 'modern',
  layout: 'grid',
  colors: {
    primary: '#3b82f6',
    background: '#0f172a', 
    text: '#ffffff',
    accent: '#6366f1'
  },
  profile: {
    displayName: wishlistTitle,
    bio: '원하는 상품들을 모아놓은 공간입니다',
    avatar: '',
    showItemCount: true,
    showCreatedDate: false
  },
  socialLinks: [
    { platform: 'instagram', url: '', enabled: false },
    { platform: 'twitter', url: '', enabled: false },
    { platform: 'youtube', url: '', enabled: false }
  ]
})

export default function CustomizePage() {
  const { t } = useI18n()
  const [selectedWishlist, setSelectedWishlist] = useState<any>(null)
  const [wishlistCustomizations, setWishlistCustomizations] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'theme' | 'layout' | 'colors' | 'profile' | 'social'>('theme')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  
  // 현재 선택된 위시리스트의 커스터마이징 설정
  const currentCustomization = selectedWishlist 
    ? (wishlistCustomizations[selectedWishlist.id] || getDefaultCustomization(selectedWishlist.title))
    : getDefaultCustomization()


  // 위시리스트 선택 핸들러
  const handleWishlistSelect = (wishlist: any) => {
    setSelectedWishlist(wishlist)
    // 해당 위시리스트의 커스터마이징이 없으면 기본값으로 초기화
    if (!wishlistCustomizations[wishlist.id]) {
      setWishlistCustomizations(prev => ({
        ...prev,
        [wishlist.id]: getDefaultCustomization(wishlist.title)
      }))
    }
  }

  // 현재 선택된 위시리스트의 커스터마이징 업데이트
  const updateWishlistCustomization = (updates: any) => {
    if (!selectedWishlist) return
    
    setWishlistCustomizations(prev => ({
      ...prev,
      [selectedWishlist.id]: {
        ...prev[selectedWishlist.id],
        ...updates
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedWishlist) return
    
    setLoading(true)
    // TODO: API 호출로 해당 위시리스트의 커스터마이징 저장
    console.log('Saving customization for wishlist:', selectedWishlist.id, currentCustomization)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
  }

  const updateTheme = (theme: string) => {
    updateWishlistCustomization({ theme })
  }

  const updateLayout = (layout: string) => {
    updateWishlistCustomization({ layout })
  }

  const updateColors = (colors: any) => {
    updateWishlistCustomization({ colors })
  }

  const updateProfile = (profile: any) => {
    updateWishlistCustomization({ profile })
  }

  const updateSocialLinks = (socialLinks: any) => {
    updateWishlistCustomization({ socialLinks })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <CustomizeHeader 
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onSave={handleSave}
        loading={loading}
        selectedWishlist={selectedWishlist}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Customization Options */}
        <div className={`space-y-6 ${showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Wishlist Selector */}
          <WishlistSelector
            selectedWishlistId={selectedWishlist?.id || null}
            onWishlistSelect={handleWishlistSelect}
          />

          {selectedWishlist ? (
            <CustomizeTabs activeTab={activeTab} onTabChange={setActiveTab} />
          ) : (
            <EmptyState />
          )}

          {/* Tab Content - Only show when wishlist is selected */}
          {selectedWishlist && (
            <div className="space-y-6">
              {activeTab === 'theme' && (
                <ThemeSelector
                  selectedTheme={currentCustomization.theme}
                  onThemeChange={updateTheme}
                />
              )}

              {activeTab === 'layout' && (
                <LayoutSelector
                  selectedLayout={currentCustomization.layout}
                  onLayoutChange={updateLayout}
                />
              )}

              {activeTab === 'colors' && (
                <ColorPicker
                  colors={currentCustomization.colors}
                  onColorsChange={updateColors}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileCustomizer
                  profile={currentCustomization.profile}
                  onProfileChange={updateProfile}
                />
              )}

              {activeTab === 'social' && (
                <SocialLinksManager
                  socialLinks={currentCustomization.socialLinks}
                  onSocialLinksChange={updateSocialLinks}
                />
              )}
            </div>
          )}

          {/* Mobile Preview Button */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full text-slate-300 border-slate-600"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
{showPreview ? `${t('settings.customize.preview')} ${t('settings.customize.hidePreview')}` : `${t('settings.customize.preview')} ${t('settings.customize.showPreview')}`}
            </Button>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        {showPreview && selectedWishlist && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CustomizationPreview 
                customization={{
                  ...currentCustomization,
                  wishlistData: selectedWishlist
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}