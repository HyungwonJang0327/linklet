'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface ProfileCustomizerProps {
  profile: {
    displayName: string
    bio: string
    avatar: string
    showItemCount: boolean
    showCreatedDate: boolean
  }
  onProfileChange: (profile: any) => void
}

export function ProfileCustomizer({ profile, onProfileChange }: ProfileCustomizerProps) {
  const updateProfile = (updates: Partial<typeof profile>) => {
    onProfileChange({ ...profile, ...updates })
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">프로필 설정</h2>
        <p className="text-slate-400 text-sm mb-6">
          공유 위시리스트에 표시될 프로필 정보를 설정합니다.
        </p>

        {/* Avatar Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">프로필 이미지</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <UserCircleIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  이미지 업로드
                </Button>
                {profile.avatar && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updateProfile({ avatar: '' })}
                    className="text-red-400 hover:text-red-300"
                  >
                    제거
                  </Button>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                JPG, PNG 파일 (최대 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <Input
            label="표시 이름"
            value={profile.displayName}
            onChange={(value: string) => updateProfile({ displayName: value })}
            placeholder="예: 홍길동의 위시리스트"
            className="bg-slate-900/50 border-slate-600 text-white"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              소개글
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              placeholder="위시리스트에 대한 간단한 소개를 적어주세요..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              maxLength={200}
            />
            <div className="text-right text-slate-400 text-xs mt-1">
              {profile.bio.length}/200
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">표시 옵션</h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile.showItemCount}
                onChange={(e) => updateProfile({ showItemCount: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">아이템 개수 표시</div>
                <div className="text-slate-400 text-sm">위시리스트의 총 아이템 개수를 표시합니다</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile.showCreatedDate}
                onChange={(e) => updateProfile({ showCreatedDate: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">생성일 표시</div>
                <div className="text-slate-400 text-sm">위시리스트를 만든 날짜를 표시합니다</div>
              </div>
            </label>
          </div>
        </div>

        {/* Badge Section */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">배지 설정</h3>
          <p className="text-slate-400 text-sm mb-4">
            위시리스트에 표시할 배지를 선택하세요.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'verified', name: '인증됨', color: 'bg-blue-500', icon: '✓' },
              { id: 'premium', name: '프리미엄', color: 'bg-yellow-500', icon: '⭐' },
              { id: 'creator', name: '크리에이터', color: 'bg-purple-500', icon: '🎨' },
              { id: 'trendy', name: '트렌디', color: 'bg-pink-500', icon: '🔥' },
              { id: 'eco', name: '친환경', color: 'bg-green-500', icon: '🌱' },
              { id: 'budget', name: '알뜰쇼핑', color: 'bg-orange-500', icon: '💰' }
            ].map((badge) => (
              <button
                key={badge.id}
                className="p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-all group text-left"
              >
                <div className={`w-8 h-8 ${badge.color} rounded-lg flex items-center justify-center text-white text-sm mb-2`}>
                  {badge.icon}
                </div>
                <div className="text-slate-200 text-sm font-medium group-hover:text-white">
                  {badge.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}