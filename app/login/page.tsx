'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleKakaoLogin = async () => {
    setIsLoading(true)
    // TODO: 카카오 로그인 연동 구현
    console.log('카카오 로그인 시작')
    
    // 임시로 로딩 상태만 표시
    setTimeout(() => {
      setIsLoading(false)
      alert('카카오 로그인 연동이 필요합니다')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Linklet</h1>
            <p className="text-slate-300">
              위시리스트를 만들고 쉽게 공유하세요
            </p>
          </div>

          <div className="space-y-4">
            {/* 카카오 로그인 버튼 */}
            <Button 
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 text-base"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              {isLoading ? '로그인 중...' : '카카오로 시작하기'}
            </Button>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">또는</span>
              </div>
            </div>

            {/* 게스트로 시작하기 */}
            <Link href="/">
              <Button variant="outline" className="w-full py-3 text-base border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                게스트로 시작하기
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400">
            <p className="mb-2">게스트로도 위시리스트를 만들 수 있어요!</p>
            <p>단, 로그인하면 위시리스트를 공유할 수 있습니다.</p>
          </div>

          {/* 기능 차이 안내 */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h3 className="font-medium mb-3 text-sm text-white">로그인 시 추가 기능</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• 위시리스트 공유 URL 생성</li>
              <li>• 위시리스트 영구 보관</li>
              <li>• 여러 기기에서 동기화</li>
              <li>• 위시리스트 관리 기능</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}