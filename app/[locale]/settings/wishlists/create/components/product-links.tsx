'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlobeAltIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface ProductLinksProps {
  productLinks: string[]
  setProductLinks: React.Dispatch<React.SetStateAction<string[]>>
  linkErrors: Record<number, string>
  setLinkErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>
  loading: boolean
  isValidUrl: (string: string) => boolean
}

export default function ProductLinks({ 
  productLinks, 
  setProductLinks, 
  linkErrors, 
  setLinkErrors, 
  loading, 
  isValidUrl 
}: ProductLinksProps) {
  const { t } = useI18n()
  
  const addProductLink = () => {
    if (productLinks.length < 10) {
      setProductLinks([...productLinks, ''])
    }
  }

  const removeProductLink = (index: number) => {
    if (productLinks.length > 1) {
      const newLinks = productLinks.filter((_, i) => i !== index)
      setProductLinks(newLinks)
      
      // Remove error for removed link
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  const updateProductLink = (index: number, value: string) => {
    const newLinks = [...productLinks]
    newLinks[index] = value
    setProductLinks(newLinks)
    
    // Clear error when user starts typing
    if (linkErrors[index]) {
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <GlobeAltIcon className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">{t('wishlist.create.productLinks') || '상품 링크 추가 (선택사항)'}</h2>
            <p className="text-sm text-slate-400 mt-1">{t('wishlist.create.productLinksDesc') || '위시리스트 생성과 함께 원하는 상품들을 바로 추가해보세요'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {productLinks.map((link, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={link}
                  onChange={(value) => updateProductLink(index, value)}
                  placeholder={`${t('wishlist.create.productLink')} ${index + 1} (${t('common.example')}: https://example.com/product)` || `상품 링크 ${index + 1} (예: https://example.com/product)`}
                  className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${
                    linkErrors[index] ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
                {linkErrors[index] && (
                  <p className="text-red-400 text-xs mt-1">{linkErrors[index]}</p>
                )}
              </div>
              
              <div className="flex items-start gap-2">
                {productLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProductLink(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-10"
                    disabled={loading}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
                
                {index === productLinks.length - 1 && productLinks.length < 10 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addProductLink}
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 h-10"
                    disabled={loading}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>{t('wishlist.create.maxLinks') || '최대 10개의 상품 링크를 추가할 수 있습니다'}</span>
            <span>{productLinks.filter(link => link.trim()).length}/10</span>
          </div>
          
          {productLinks.length < 10 && productLinks.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProductLink}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
              disabled={loading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('wishlist.create.addLink') || '링크 추가'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}