'use client'

import {
  UsersIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const stats = [
    {
      name: '총 사용자',
      value: '1,234',
      change: '+12.3%',
      trend: 'up',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      name: '총 위시리스트',
      value: '5,678',
      change: '+8.1%',
      trend: 'up',
      icon: GiftIcon,
      color: 'purple'
    },
    {
      name: '활성 사용자 (30일)',
      value: '892',
      change: '+15.2%',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'green'
    },
    {
      name: '5xx 에러 (24h)',
      value: '12',
      change: '-25.0%',
      trend: 'down',
      icon: ExclamationTriangleIcon,
      color: 'red'
    }
  ]

  const recentActivities = [
    { user: 'user@example.com', action: '새 위시리스트 생성', time: '5분 전' },
    { user: 'test@example.com', action: '회원가입', time: '12분 전' },
    { user: 'admin@example.com', action: '위시리스트 공유', time: '23분 전' },
    { user: 'demo@example.com', action: '아이템 추가', time: '1시간 전' },
    { user: 'sample@example.com', action: '프로필 업데이트', time: '2시간 전' },
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activity.user}</p>
                  <p className="text-xs text-slate-400">{activity.action}</p>
                </div>
                <span className="text-xs text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">빠른 작업</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
              신규 사용자 추가
            </button>
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
              공지사항 작성
            </button>
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
              리포트 생성
            </button>
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
              백업 실행
            </button>
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
