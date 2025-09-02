'use client'

interface AppearancePreviewProps {
  settings: {
    theme: string
    fontSize: string
    compactMode: boolean
  }
}

export default function AppearancePreview({ settings }: AppearancePreviewProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-6">미리보기</h2>
      
      <div className="border border-slate-600 rounded-lg p-4 bg-slate-900/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          <div>
            <div className={`font-medium text-slate-200 ${
              settings.fontSize === 'small' ? 'text-sm' : 
              settings.fontSize === 'large' ? 'text-lg' : 'text-base'
            }`}>
              위시리스트 예시
            </div>
            <div className={`text-slate-400 ${
              settings.fontSize === 'small' ? 'text-xs' : 
              settings.fontSize === 'large' ? 'text-base' : 'text-sm'
            }`}>
              이것은 설정에 따른 미리보기입니다
            </div>
          </div>
        </div>
        <div className={`text-slate-300 ${
          settings.fontSize === 'small' ? 'text-sm' : 
          settings.fontSize === 'large' ? 'text-lg' : 'text-base'
        } ${settings.compactMode ? 'leading-tight' : 'leading-relaxed'}`}>
          현재 설정: {settings.theme === 'light' ? '라이트' : settings.theme === 'dark' ? '다크' : '시스템'} 테마, {
            settings.fontSize === 'small' ? '작은' : settings.fontSize === 'large' ? '큰' : '보통'
          } 글자 크기
        </div>
      </div>
    </>
  )
}