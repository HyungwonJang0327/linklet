'use client'

export default function AnalyticsPage() {
  const timeRanges = ['일간', '주간', '월간', '연간']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">통계 분석</h1>
          <p className="text-sm text-slate-400 mt-1">서비스 사용 현황 및 통계</p>
        </div>
        <div className="flex gap-2">
          {timeRanges.map((range, index) => (
            <button
              key={range}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">사용자 증가 추이</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-500">차트 영역 (Chart.js 또는 Recharts 사용 예정)</p>
          </div>
        </div>

        {/* Wishlist Creation Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">위시리스트 생성 추이</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-500">차트 영역 (Chart.js 또는 Recharts 사용 예정)</p>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">카테고리별 분포</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400">생일</p>
            <p className="text-2xl font-bold text-white mt-1">1,234</p>
            <p className="text-xs text-green-400 mt-1">↑ 12.3%</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400">크리스마스</p>
            <p className="text-2xl font-bold text-white mt-1">892</p>
            <p className="text-xs text-green-400 mt-1">↑ 8.1%</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400">결혼</p>
            <p className="text-2xl font-bold text-white mt-1">567</p>
            <p className="text-xs text-green-400 mt-1">↑ 15.2%</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400">일반</p>
            <p className="text-2xl font-bold text-white mt-1">2,985</p>
            <p className="text-xs text-red-400 mt-1">↓ 3.4%</p>
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">인기 아이템</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {item}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">샘플 상품 {item}</p>
                  <p className="text-xs text-slate-400">위시리스트 {Math.floor(Math.random() * 100)}개에 추가됨</p>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-400">{Math.floor(Math.random() * 500)} 회</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
