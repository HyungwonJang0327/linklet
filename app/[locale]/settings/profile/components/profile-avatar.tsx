'use client'

import { UserIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function ProfileAvatar() {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <UserIcon className="w-10 h-10 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">{t('settings.profile.avatar')}</h2>
        <p className="text-slate-400 text-sm">JPG, PNG 파일을 업로드하세요</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 text-slate-300 border-slate-600 hover:bg-slate-700/50"
        >
          {t('settings.profile.uploadPhoto')}
        </Button>
      </div>
    </div>
  )
}