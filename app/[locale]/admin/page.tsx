'use client'

import { useState, useEffect } from 'react'
import {
  UsersIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface DashboardData {
  stats: {
    totalUsers: number
    totalWishlists: number
    activeUsers: number
    errorsLast24Hours: number
    userChange: string
    wishlistChange: string
    activeUserChange: string
    errorChange: string
  }
  recentActivities: Array<{
    user: string
    action: string
    time: string
  }>
  categoryStats: Array<{
    category: string
    count: number
  }>
  popularWishlists: Array<{
    id: string
    title: string
    category: string
    userName: string
    itemCount: number
  }>
  qnaList: Array<{
    id: string
    question: string
    user: string
    status: string
  }>
  recentErrors: Array<{
    id: string
    endpoint: string
    method: string
    statusCode: number
    message: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">데이터 로드 실패</h3>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-slate-400">
          <p>데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: '총 사용자',
      value: data.stats.totalUsers.toLocaleString(),
      change: data.stats.userChange,
      trend: data.stats.userChange.startsWith('-') ? 'down' : 'up',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      name: '총 위시리스트',
      value: data.stats.totalWishlists.toLocaleString(),
      change: data.stats.wishlistChange,
      trend: data.stats.wishlistChange.startsWith('-') ? 'down' : 'up',
      icon: GiftIcon,
      color: 'purple'
    },
    {
      name: '활성 사용자 (30일)',
      value: data.stats.activeUsers.toLocaleString(),
      change: data.stats.activeUserChange,
      trend: data.stats.activeUserChange.startsWith('-') ? 'down' : 'up',
      icon: ChartBarIcon,
      color: 'green'
    },
    {
      name: '5xx 에러 (24h)',
      value: data.stats.errorsLast24Hours.toLocaleString(),
      change: data.stats.errorChange,
      trend: data.stats.errorChange.startsWith('-') ? 'down' : 'up',
      icon: ExclamationTriangleIcon,
      color: 'red'
    }
  ]

  const recentActivities = data.recentActivities

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg border ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {stat.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-slate-400">{stat.name}</p>
            </div>
          )
        })}
      </div>

      {/* Grid Layout for Multiple Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QnA List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">최근 문의사항</h2>
          <div className="space-y-3">
            {data.qnaList.length > 0 ? (
              data.qnaList.map((qna) => (
                <div
                  key={qna.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{qna.question}</p>
                    <p className="text-xs text-slate-400">{qna.user}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded">
                    대기중
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">현재 처리할 문의사항이 없습니다</p>
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">최근 5xx 에러</h2>
          <div className="space-y-3">
            {data.recentErrors.length > 0 ? (
              data.recentErrors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {error.method} {error.endpoint}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{error.message}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded ml-2">
                    {error.statusCode}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">최근 에러가 없습니다</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{activity.user}</p>
                    <p className="text-xs text-slate-400">{activity.action}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">최근 활동이 없습니다</p>
            )}
          </div>
        </div>

        {/* Popular Wishlists */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">인기 위시리스트</h2>
          <div className="space-y-3">
            {data.popularWishlists.length > 0 ? (
              data.popularWishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{wishlist.title}</p>
                    <p className="text-xs text-slate-400">{wishlist.userName}</p>
                  </div>
                  <span className="text-xs font-medium text-blue-400 ml-2">
                    {wishlist.itemCount}개
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">데이터가 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">시스템 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">API 상태</span>
            <span className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">정상</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">데이터베이스</span>
            <span className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">정상</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">서버 응답시간</span>
            <span className="text-white font-medium">24ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}
