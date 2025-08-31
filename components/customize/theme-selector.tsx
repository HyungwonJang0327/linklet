'use client'

import { Card } from '@/components/ui/card'

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
}

const themes = [
  {
    id: 'modern',
    name: '모던',
    description: '깔끔하고 현대적인 디자인',
    preview: 'from-slate-900 to-blue-900',
    cardStyle: 'bg-white/10 backdrop-blur-sm'
  },
  {
    id: 'gradient',
    name: '그라디언트',
    description: '화려한 그라디언트 배경',
    preview: 'from-purple-600 via-pink-600 to-blue-600',
    cardStyle: 'bg-white/20 backdrop-blur-sm'
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '단순하고 깔끔한 스타일',
    preview: 'from-gray-100 to-gray-200',
    cardStyle: 'bg-white border border-gray-200'
  },
  {
    id: 'neon',
    name: '네온',
    description: '생동감 있는 네온 스타일',
    preview: 'from-black via-purple-900 to-black',
    cardStyle: 'bg-black/50 border border-cyan-400'
  },
  {
    id: 'nature',
    name: '자연',
    description: '자연스럽고 따뜻한 색감',
    preview: 'from-green-800 via-emerald-700 to-teal-600',
    cardStyle: 'bg-white/10 backdrop-blur-sm'
  },
  {
    id: 'sunset',
    name: '선셋',
    description: '노을 같은 따뜻한 색감',
    preview: 'from-orange-600 via-red-500 to-pink-500',
    cardStyle: 'bg-white/20 backdrop-blur-sm'
  }
]

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">테마 선택</h2>
        <p className="text-slate-400 text-sm mb-6">
          위시리스트 페이지의 전체적인 분위기를 설정합니다.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative group p-4 rounded-lg transition-all ${
                selectedTheme === theme.id
                  ? 'ring-2 ring-blue-500 bg-blue-500/10'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              {/* Theme Preview */}
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${theme.preview} mb-3 relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-16 h-4 rounded ${theme.cardStyle} opacity-80`}></div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <div className={`w-8 h-8 rounded-full ${theme.cardStyle} opacity-60`}></div>
                </div>
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${theme.cardStyle} opacity-60`}></div>
                </div>
              </div>
              
              <div className="text-left">
                <h3 className={`font-medium mb-1 ${
                  selectedTheme === theme.id ? 'text-blue-300' : 'text-slate-200'
                }`}>
                  {theme.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  {theme.description}
                </p>
              </div>
              
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}