'use client'

import { Card } from '@/components/ui/card'
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  TableCellsIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'

interface LayoutSelectorProps {
  selectedLayout: string
  onLayoutChange: (layout: string) => void
}

const layouts = [
  {
    id: 'grid',
    name: '그리드',
    description: '카드 형태로 정렬',
    icon: Squares2X2Icon,
    preview: (
      <div className="grid grid-cols-2 gap-1 h-12">
        <div className="bg-slate-600 rounded"></div>
        <div className="bg-slate-600 rounded"></div>
        <div className="bg-slate-600 rounded"></div>
        <div className="bg-slate-600 rounded"></div>
      </div>
    )
  },
  {
    id: 'list',
    name: '리스트',
    description: '세로로 나열된 형태',
    icon: ListBulletIcon,
    preview: (
      <div className="space-y-1 h-12">
        <div className="bg-slate-600 rounded h-2"></div>
        <div className="bg-slate-600 rounded h-2"></div>
        <div className="bg-slate-600 rounded h-2"></div>
        <div className="bg-slate-600 rounded h-2"></div>
      </div>
    )
  },
  {
    id: 'masonry',
    name: '메이슨리',
    description: '핀터레스트 스타일',
    icon: TableCellsIcon,
    preview: (
      <div className="grid grid-cols-2 gap-1 h-12">
        <div className="space-y-1">
          <div className="bg-slate-600 rounded h-3"></div>
          <div className="bg-slate-600 rounded h-2"></div>
        </div>
        <div className="space-y-1">
          <div className="bg-slate-600 rounded h-2"></div>
          <div className="bg-slate-600 rounded h-3"></div>
        </div>
      </div>
    )
  },
  {
    id: 'carousel',
    name: '캐러셀',
    description: '슬라이드 형태',
    icon: RectangleStackIcon,
    preview: (
      <div className="relative h-12 bg-slate-600 rounded overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-8 bg-slate-500 rounded-l"></div>
        <div className="absolute inset-y-0 right-0 w-8 bg-slate-700 rounded-r opacity-50"></div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white/50 rounded-full"></div>
          <div className="w-1 h-1 bg-white/50 rounded-full"></div>
        </div>
      </div>
    )
  }
]

export function LayoutSelector({ selectedLayout, onLayoutChange }: LayoutSelectorProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">레이아웃</h2>
        <p className="text-slate-400 text-sm mb-6">
          위시리스트 아이템이 표시되는 방식을 선택합니다.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onLayoutChange(layout.id)}
              className={`p-4 rounded-lg border-2 transition-all group ${
                selectedLayout === layout.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  selectedLayout === layout.id ? 'bg-blue-500/20' : 'bg-slate-700/50'
                }`}>
                  <layout.icon className={`w-5 h-5 ${
                    selectedLayout === layout.id ? 'text-blue-400' : 'text-slate-400'
                  }`} />
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className={`font-medium mb-1 ${
                    selectedLayout === layout.id ? 'text-blue-300' : 'text-slate-200'
                  }`}>
                    {layout.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    {layout.description}
                  </p>
                  <div className="w-full">
                    {layout.preview}
                  </div>
                </div>
              </div>
              
              {selectedLayout === layout.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Layout Options */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">레이아웃 옵션</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">아이템 간격</div>
                <div className="text-slate-400 text-sm">아이템 사이의 여백 조절</div>
              </div>
              <select className="px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-sm">
                <option>좁게</option>
                <option>보통</option>
                <option>넓게</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">한 줄당 아이템 수</div>
                <div className="text-slate-400 text-sm">데스크톱에서 보이는 개수</div>
              </div>
              <select className="px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-sm">
                <option>2개</option>
                <option>3개</option>
                <option>4개</option>
                <option>자동</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">애니메이션 효과</div>
                <div className="text-slate-400 text-sm">호버 시 확대/축소 효과</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}