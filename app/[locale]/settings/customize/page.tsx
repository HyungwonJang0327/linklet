'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CustomizationPreview } from '@/components/customize/customization-preview'
import { ThemeSelector } from '@/components/customize/theme-selector'
import { LayoutSelector } from '@/components/customize/layout-selector'
import { ColorPicker } from '@/components/customize/color-picker'
import { ProfileCustomizer } from '@/components/customize/profile-customizer'
import { SocialLinksManager } from '@/components/customize/social-links-manager'
import { WishlistSelector } from '@/components/customize/wishlist-selector'
import { useI18n } from '@/lib/i18n/context'
import useDebounce from '@/hooks/use-debounce'
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const isInitialMount = useRef(true)

  // 현재 선택된 위시리스트의 커스터마이징 설정
  const currentCustomization = selectedWishlist
    ? (wishlistCustomizations[selectedWishlist.id] || getDefaultCustomization(selectedWishlist.title))
    : getDefaultCustomization()

  // 3초 디바운스된 커스터마이징 설정
  const debouncedCustomization = useDebounce(currentCustomization, 3000)


  // 위시리스트 선택 핸들러
  const handleWishlistSelect = (wishlist: any) => {
    setSelectedWishlist(wishlist)

    // DB에서 불러온 customization이 있으면 사용, 없으면 기본값 사용
    if (!wishlistCustomizations[wishlist.id]) {
      const savedCustomization = wishlist.customization || getDefaultCustomization(wishlist.title)
      setWishlistCustomizations(prev => ({
        ...prev,
        [wishlist.id]: savedCustomization
      }))
    }
  }

  // 현재 선택된 위시리스트의 커스터마이징 업데이트
  const updateWishlistCustomization = (updates: any) => {
    if (!selectedWishlist) return

    setSaveStatus('unsaved')
    setWishlistCustomizations(prev => ({
      ...prev,
      [selectedWishlist.id]: {
        ...prev[selectedWishlist.id],
        ...updates
      }
    }))
  }

  // 자동 저장 로직
  useEffect(() => {
    // 초기 마운트 시에는 저장하지 않음
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // 위시리스트가 선택되지 않았으면 저장하지 않음
    if (!selectedWishlist) return

    // 저장 상태가 unsaved가 아니면 저장하지 않음 (이미 저장 중이거나 저장됨)
    if (saveStatus !== 'unsaved') return

    const autoSave = async () => {
      setSaveStatus('saving')
      try {
        const response = await fetch(`/api/wishlists/${selectedWishlist.id}/customization`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debouncedCustomization)
        })

        if (!response.ok) {
          throw new Error('Failed to save customization')
        }

        const data = await response.json()

        // 성공 시 selectedWishlist 업데이트
        setSelectedWishlist((prev: any) => ({
          ...prev,
          customization: data.customization
        }))

        setSaveStatus('saved')
      } catch (error) {
        console.error('Error auto-saving customization:', error)
        setSaveStatus('unsaved')
      }
    }

    autoSave()
  }, [debouncedCustomization, selectedWishlist?.id])

  const handleSave = async () => {
    if (!selectedWishlist) return

    setLoading(true)
    try {
      const response = await fetch(`/api/wishlists/${selectedWishlist.id}/customization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCustomization)
      })

      if (!response.ok) {
        throw new Error('Failed to save customization')
      }

      const data = await response.json()

      // 성공 시 selectedWishlist 업데이트
      setSelectedWishlist({
        ...selectedWishlist,
        customization: data.customization
      })

      alert(t('settings.customize.saveSuccess'))
    } catch (error) {
      console.error('Error saving customization:', error)
      alert(t('settings.customize.saveFailed'))
    } finally {
      setLoading(false)
    }
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
        saveStatus={saveStatus}
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