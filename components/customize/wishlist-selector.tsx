'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDownIcon, 
  PlusIcon, 
  EyeIcon,
  ShareIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'

// Mock data - 실제로는 API에서 가져올 데이터
const mockWishlists = [
  {
    id: '1',
    title: '생일 선물 위시리스트',
    description: '30세 생일 기념 선물 모음',
    itemCount: 12,
    shareUrl: 'birthday-2024',
    isPublic: true,
    createdAt: '2024-08-15',
    lastCustomized: '2024-08-30'
  },
  {
    id: '2', 
    title: '결혼 준비 용품',
    description: '신혼집 꾸미기 위한 필수템들',
    itemCount: 8,
    shareUrl: 'wedding-prep',
    isPublic: false,
    createdAt: '2024-07-20',
    lastCustomized: null
  },
  {
    id: '3',
    title: '여행 준비물',
    description: '유럽 여행을 위한 준비물',
    itemCount: 15,
    shareUrl: 'europe-trip-2024',
    isPublic: true,
    createdAt: '2024-08-01',
    lastCustomized: '2024-08-25'
  }
]

interface WishlistSelectorProps {
  selectedWishlistId: string | null
  onWishlistSelect: (wishlist: any) => void
}

export function WishlistSelector({ selectedWishlistId, onWishlistSelect }: WishlistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedWishlist = mockWishlists.find(w => w.id === selectedWishlistId)

  const handleSelect = (wishlist: any) => {
    onWishlistSelect(wishlist)
    setIsOpen(false)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative z-30">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">위시리스트 선택</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="text-slate-300 border-slate-600 hover:bg-slate-700/50"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            새 위시리스트
          </Button>
        </div>
        
        <p className="text-slate-400 text-sm mb-6">
          커스터마이징할 위시리스트를 선택하세요. 각 위시리스트마다 다른 디자인을 적용할 수 있습니다.
        </p>

        {/* Selected Wishlist Display */}
        <div className="relative mb-4 z-40">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-left hover:bg-slate-700/70 transition-colors"
          >
            {selectedWishlist ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">{selectedWishlist.title}</div>
                  <div className="text-sm text-slate-400">{selectedWishlist.itemCount}개 아이템</div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedWishlist.lastCustomized && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <Cog6ToothIcon className="w-3 h-3" />
                      커스터마이징됨
                    </div>
                  )}
                  <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            ) : (
              <div className="text-slate-400">위시리스트를 선택해주세요</div>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
              {mockWishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  onClick={() => handleSelect(wishlist)}
                  className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                    selectedWishlistId === wishlist.id ? 'bg-blue-600/10 border-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-medium mb-1 ${
                        selectedWishlistId === wishlist.id ? 'text-blue-300' : 'text-white'
                      }`}>
                        {wishlist.title}
                      </div>
                      <div className="text-sm text-slate-400 mb-2">{wishlist.description}</div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{wishlist.itemCount}개 아이템</span>
                        <span>{wishlist.createdAt}</span>
                        {wishlist.isPublic && (
                          <div className="flex items-center gap-1 text-green-400">
                            <EyeIcon className="w-3 h-3" />
                            공개
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      {wishlist.lastCustomized && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <Cog6ToothIcon className="w-3 h-3" />
                          커스터마이징됨
                        </div>
                      )}
                      
                      {wishlist.isPublic && wishlist.shareUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/w/${wishlist.shareUrl}`, '_blank')
                          }}
                          className="text-slate-400 hover:text-white p-1 h-auto hover:bg-slate-600/50 rounded transition-colors"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Wishlist Info */}
        {selectedWishlist && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">선택된 위시리스트</h3>
              {selectedWishlist.isPublic && selectedWishlist.shareUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">공유 링크:</span>
                  <code className="text-xs bg-slate-900/50 px-2 py-1 rounded text-blue-300">
                    /w/{selectedWishlist.shareUrl}
                  </code>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">아이템 수:</span>
                <span className="text-white ml-2">{selectedWishlist.itemCount}개</span>
              </div>
              <div>
                <span className="text-slate-400">생성일:</span>
                <span className="text-white ml-2">{selectedWishlist.createdAt}</span>
              </div>
              <div>
                <span className="text-slate-400">공개 상태:</span>
                <span className={`ml-2 ${selectedWishlist.isPublic ? 'text-green-400' : 'text-orange-400'}`}>
                  {selectedWishlist.isPublic ? '공개' : '비공개'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">마지막 커스터마이징:</span>
                <span className="text-white ml-2">
                  {selectedWishlist.lastCustomized || '없음'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}