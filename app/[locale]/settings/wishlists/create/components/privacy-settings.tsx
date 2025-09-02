'use client'

import { Card } from '@/components/ui/card'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface PrivacySettingsProps {
  formData: {
    isPublic: boolean
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string
    description: string
    isPublic: boolean
    category: string
  }>>
}

export default function PrivacySettings({ formData, setFormData }: PrivacySettingsProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-6">공개 설정</h2>

        <div className="space-y-4">
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              formData.isPublic 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
          >
            <div className="flex items-start gap-3">
              <EyeIcon className={`w-5 h-5 mt-0.5 ${
                formData.isPublic ? 'text-blue-400' : 'text-slate-400'
              }`} />
              <div>
                <div className={`font-medium ${
                  formData.isPublic ? 'text-blue-300' : 'text-slate-200'
                }`}>
                  공개 위시리스트
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  링크를 아는 사람이면 누구나 볼 수 있습니다
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              !formData.isPublic 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
          >
            <div className="flex items-start gap-3">
              <EyeSlashIcon className={`w-5 h-5 mt-0.5 ${
                !formData.isPublic ? 'text-blue-400' : 'text-slate-400'
              }`} />
              <div>
                <div className={`font-medium ${
                  !formData.isPublic ? 'text-blue-300' : 'text-slate-200'
                }`}>
                  비공개 위시리스트
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  나만 볼 수 있습니다
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}