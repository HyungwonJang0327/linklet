'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlobeAltIcon, LinkIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface QuickAddProductProps {
  wishlists: Array<{
    id: number
    title: string
    itemCount: number
  }>
  onAddProduct: (productUrl: string, wishlistId: string) => Promise<void>
}

export default function QuickAddProduct({ wishlists, onAddProduct }: QuickAddProductProps) {
  const { t } = useI18n()
  const [productUrl, setProductUrl] = useState('')
  const [selectedWishlist, setSelectedWishlist] = useState('')
  const [isAddingProduct, setIsAddingProduct] = useState(false)

  const handleAddProductFromUrl = async () => {
    if (!productUrl || !selectedWishlist) return
    
    setIsAddingProduct(true)
    
    try {
      await onAddProduct(productUrl, selectedWishlist)
      setProductUrl('')
      setSelectedWishlist('')
    } catch (error) {
      console.error('Failed to add product:', error)
    } finally {
      setIsAddingProduct(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GlobeAltIcon className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t('item.addFromUrl') || '상품 링크로 추가'}</h2>
            <p className="text-sm text-slate-400">{t('item.addFromUrlDesc') || '상품 페이지 URL을 입력하여 위시리스트에 바로 추가하세요'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('wishlist.title')}
            </label>
            <select
              value={selectedWishlist}
              onChange={(e) => setSelectedWishlist(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('common.select') || '선택하세요'}</option>
              {wishlists.map((wishlist) => (
                <option key={wishlist.id} value={wishlist.id}>
                  {wishlist.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.productUrl')}
            </label>
            <Input
              value={productUrl}
              onChange={setProductUrl}
              placeholder="https://example.com/product"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button
              onClick={handleAddProductFromUrl}
              loading={isAddingProduct}
              disabled={!productUrl || !selectedWishlist}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {isAddingProduct ? '추가 중...' : (t('item.addFromUrl') || '링크로 추가')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}