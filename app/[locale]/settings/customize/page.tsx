'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomizationPreview } from '@/components/customize/customization-preview'
import { ThemeSelector } from '@/components/customize/theme-selector'
import { LayoutSelector } from '@/components/customize/layout-selector'
import { ColorPicker } from '@/components/customize/color-picker'
import { ProfileCustomizer } from '@/components/customize/profile-customizer'
import { SocialLinksManager } from '@/components/customize/social-links-manager'
import { WishlistSelector } from '@/components/customize/wishlist-selector'
import { useI18n } from '@/lib/i18n/context'
import { 
  PaintBrushIcon, 
  RectangleStackIcon, 
  UserCircleIcon, 
  LinkIcon,
  SwatchIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

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

  const tabs = [
    { id: 'theme', name: t('settings.customize.tabs.theme'), icon: PaintBrushIcon },
    { id: 'layout', name: t('settings.customize.tabs.layout'), icon: RectangleStackIcon },
    { id: 'colors', name: t('settings.customize.tabs.colors'), icon: SwatchIcon },
    { id: 'profile', name: t('settings.customize.tabs.profile'), icon: UserCircleIcon },
    { id: 'social', name: t('settings.customize.tabs.social'), icon: LinkIcon }
  ]

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('settings.customize.title')}</h1>
            <p className="text-slate-300">
              {t('settings.customize.description')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={showPreview ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden lg:flex"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
{t('settings.customize.preview')} {showPreview ? t('settings.customize.hidePreview') : t('settings.customize.showPreview')}
            </Button>
            
            <Button 
              onClick={handleSave}
              loading={loading}
              disabled={!selectedWishlist}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
{selectedWishlist ? t('settings.customize.saveChanges') : t('settings.customize.selectWishlist')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Customization Options */}
        <div className={`space-y-6 ${showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Wishlist Selector */}
          <WishlistSelector
            selectedWishlistId={selectedWishlist?.id || null}
            onWishlistSelect={handleWishlistSelect}
          />

          {selectedWishlist ? (
            <>
              {/* Tab Navigation */}
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-1">
                <div className="flex flex-wrap gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <SwatchIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{t('settings.customize.selectWishlist')}</h3>
                <p className="text-slate-400">
                  {t('settings.customize.selectWishlistDesc')}
                </p>
              </div>
            </Card>
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