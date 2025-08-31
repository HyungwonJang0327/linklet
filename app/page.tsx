import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            위시리스트를 만들고
            <br />
            <span className="text-blue-400">쉽게 공유하세요</span>
          </h1>
          <p className="text-lg text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            원하는 상품들을 모아서 위시리스트를 만들고, <br /> 친구들과 가족들에게 간단하게 공유할 수 있습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-base font-medium w-full sm:w-auto">
                위시리스트 만들기
              </Button>
            </Link>
            <Link href="/w/wkfd31p4lh8kxnb4kofdlu5b">
              <Button variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 text-base font-medium w-full sm:w-auto">
                예시 보기
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                간편한 링크 추가
              </h3>
              <p className="text-slate-300">
                상품 링크만 붙여넣으면 자동으로 정보를 가져와서 위시리스트에 추가됩니다.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all backdrop-blur-sm">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                쉬운 공유
              </h3>
              <p className="text-slate-300">
                고유한 링크를 생성해서 누구나 쉽게 당신의 위시리스트를 확인할 수 있습니다.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all backdrop-blur-sm">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                무료로 시작
              </h3>
              <p className="text-slate-300">
                회원가입 없이도 바로 위시리스트를 만들어볼 수 있습니다. 로그인하면 더 많은 기능을 이용할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2025 Linklet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
