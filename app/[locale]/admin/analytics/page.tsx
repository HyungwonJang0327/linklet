'use client'

import { useState, useEffect } from 'react'

interface CategoryStat {
  category: string
  count: number
}

interface AnalyticsData {
  categoryStats: CategoryStat[]
  topItems: Array<{
    id: string
    title: string
    wishlistCount: number
    clickCount: number
  }>
}

export default function AnalyticsPage() {
  const timeRanges = ['일간', '주간', '월간', '연간']
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      BIRTHDAY: '생일',
      CHRISTMAS: '크리스마스',
      WEDDING: '결혼',
      GENERAL: '일반',
      BABY: '아기',
      ELECTRONICS: '전자제품',
      FASHION: '패션',
      BOOKS: '도서',
      TRAVEL: '여행',
      HOME: '홈'
    }
    return names[category] || category
  }

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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && data.categoryStats.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.categoryStats.slice(0, 8).map((stat) => (
              <div key={stat.category} className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-400">{getCategoryName(stat.category)}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">카테고리 데이터가 없습니다</p>
        )}
      </div>

      {/* Top Items */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">인기 아이템</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && data.topItems.length > 0 ? (
          <div className="space-y-3">
            {data.topItems.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-xs">{item.title}</p>
                    <p className="text-xs text-slate-400">위시리스트 {item.wishlistCount}개에 추가됨</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-400">{item.clickCount.toLocaleString()} 회</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">인기 아이템 데이터가 없습니다</p>
        )}
      </div>
    </div>
  )
}
