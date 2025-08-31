'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface SocialLinksManagerProps {
  socialLinks: Array<{
    platform: string
    url: string
    enabled: boolean
  }>
  onSocialLinksChange: (links: any[]) => void
}

const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', icon: '📷', baseUrl: 'https://instagram.com/', placeholder: 'username' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', baseUrl: 'https://x.com/', placeholder: 'username' },
  { id: 'youtube', name: 'YouTube', icon: '📺', baseUrl: 'https://youtube.com/@', placeholder: 'channelname' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', baseUrl: 'https://tiktok.com/@', placeholder: 'username' },
  { id: 'facebook', name: 'Facebook', icon: '👥', baseUrl: 'https://facebook.com/', placeholder: 'username' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', baseUrl: 'https://linkedin.com/in/', placeholder: 'username' },
  { id: 'github', name: 'GitHub', icon: '👨‍💻', baseUrl: 'https://github.com/', placeholder: 'username' },
  { id: 'website', name: '개인 웹사이트', icon: '🌐', baseUrl: 'https://', placeholder: 'example.com' }
]

export function SocialLinksManager({ socialLinks, onSocialLinksChange }: SocialLinksManagerProps) {
  const updateSocialLink = (index: number, updates: Partial<typeof socialLinks[0]>) => {
    const newLinks = [...socialLinks]
    newLinks[index] = { ...newLinks[index], ...updates }
    onSocialLinksChange(newLinks)
  }

  const addSocialLink = (platform: string) => {
    const platformInfo = socialPlatforms.find(p => p.id === platform)
    const newLink = {
      platform,
      url: platformInfo?.baseUrl || '',
      enabled: true
    }
    onSocialLinksChange([...socialLinks, newLink])
  }

  const removeSocialLink = (index: number) => {
    const newLinks = socialLinks.filter((_, i) => i !== index)
    onSocialLinksChange(newLinks)
  }

  const getPlatformInfo = (platform: string) => {
    return socialPlatforms.find(p => p.id === platform) || socialPlatforms[0]
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">소셜 링크</h2>
        <p className="text-slate-400 text-sm mb-6">
          위시리스트 페이지에 표시할 소셜미디어 링크를 추가하세요.
        </p>

        {/* Existing Social Links */}
        <div className="space-y-4 mb-6">
          {socialLinks.map((link, index) => {
            const platformInfo = getPlatformInfo(link.platform)
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  link.enabled 
                    ? 'border-slate-600 bg-slate-700/30' 
                    : 'border-slate-700/50 bg-slate-800/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{platformInfo.icon}</span>
                    <span className="text-slate-200 font-medium">{platformInfo.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) => updateSocialLink(index, { enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-slate-400 text-sm">활성화</span>
                    </label>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSocialLink(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Input
                    label="URL"
                    value={link.url}
                    onChange={(value: string) => updateSocialLink(index, { url: value })}
                    placeholder={platformInfo.baseUrl + platformInfo.placeholder}
                    disabled={!link.enabled}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                  
                  {link.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">미리보기:</span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline truncate"
                      >
                        {link.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {socialLinks.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-4">아직 추가된 소셜 링크가 없습니다.</div>
              <div className="text-slate-500 text-sm">아래에서 플랫폼을 선택해 링크를 추가해보세요.</div>
            </div>
          )}
        </div>

        {/* Add New Social Link */}
        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">새 소셜 링크 추가</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {socialPlatforms
              .filter(platform => !socialLinks.some(link => link.platform === platform.id))
              .map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => addSocialLink(platform.id)}
                  className="p-3 rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{platform.icon}</span>
                    <PlusIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                  </div>
                  <div className="text-slate-200 text-sm font-medium group-hover:text-white">
                    {platform.name}
                  </div>
                </button>
              ))}
          </div>
          
          {socialLinks.length >= socialPlatforms.length && (
            <div className="text-center py-4">
              <div className="text-slate-400 text-sm">모든 플랫폼이 추가되었습니다!</div>
            </div>
          )}
        </div>

        {/* Link Display Options */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">표시 옵션</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">링크 스타일</div>
                <div className="text-slate-400 text-sm">소셜 링크의 표시 방식</div>
              </div>
              <select className="px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-sm">
                <option>아이콘만</option>
                <option>아이콘 + 텍스트</option>
                <option>버튼 형태</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">링크 위치</div>
                <div className="text-slate-400 text-sm">페이지에서의 표시 위치</div>
              </div>
              <select className="px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-sm">
                <option>프로필 아래</option>
                <option>페이지 상단</option>
                <option>페이지 하단</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">새 탭에서 열기</div>
                <div className="text-slate-400 text-sm">소셜 링크를 클릭할 때 새 탭에서 열기</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}