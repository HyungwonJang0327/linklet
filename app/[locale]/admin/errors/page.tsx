'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function ErrorsPage() {
  const [timeRange, setTimeRange] = useState('24h')

  const errors = [
    {
      id: '1',
      timestamp: '2024-03-15 14:32:15',
      method: 'POST',
      path: '/api/wishlists',
      status: 500,
      error: 'Internal Server Error',
      message: 'Database connection timeout',
      user: 'john@example.com',
      ip: '192.168.1.1'
    },
    {
      id: '2',
      timestamp: '2024-03-15 13:45:22',
      method: 'GET',
      path: '/api/wishlists/abc123',
      status: 500,
      error: 'Internal Server Error',
      message: 'Prisma query failed: Invalid ID format',
      user: 'jane@example.com',
      ip: '192.168.1.2'
    },
    {
      id: '3',
      timestamp: '2024-03-15 12:18:09',
      method: 'PUT',
      path: '/api/items/xyz789',
      status: 503,
      error: 'Service Unavailable',
      message: 'S3 upload service temporarily unavailable',
      user: 'bob@example.com',
      ip: '192.168.1.3'
    },
    {
      id: '4',
      timestamp: '2024-03-15 11:22:45',
      method: 'POST',
      path: '/api/metadata',
      status: 500,
      error: 'Internal Server Error',
      message: 'URL fetch timeout after 15 seconds',
      user: 'alice@example.com',
      ip: '192.168.1.4'
    },
    {
      id: '5',
      timestamp: '2024-03-15 10:05:33',
      method: 'DELETE',
      path: '/api/wishlists/def456',
      status: 500,
      error: 'Internal Server Error',
      message: 'Foreign key constraint failed',
      user: 'charlie@example.com',
      ip: '192.168.1.5'
    },
  ]

  const stats = [
    { label: '전체 5xx 에러', value: '127', trend: '+12', color: 'red' },
    { label: '500 에러', value: '89', trend: '+8', color: 'orange' },
    { label: '503 에러', value: '38', trend: '+4', color: 'yellow' },
    { label: '에러율', value: '0.23%', trend: '+0.05%', color: 'red' },
  ]

  const errorsByEndpoint = [
    { endpoint: '/api/wishlists', count: 45, percentage: 35 },
    { endpoint: '/api/metadata', count: 32, percentage: 25 },
    { endpoint: '/api/items/*', count: 28, percentage: 22 },
    { endpoint: '/api/users', count: 15, percentage: 12 },
    { endpoint: '기타', count: 7, percentage: 6 },
  ]

  const getStatusBadge = (status: number) => {
    const color = status >= 500 && status < 503 ? 'red' : 'orange'
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded bg-${color}-500/10 text-${color}-400 border-${color}-500/20`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">에러 로그</h1>
          <p className="text-sm text-slate-400 mt-1">HTTP 500번대 에러 모니터링</p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <span className="text-xs text-red-400">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Error Distribution */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">엔드포인트별 에러 분포</h2>
        <div className="space-y-3">
          {errorsByEndpoint.map((item) => (
            <div key={item.endpoint} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-mono">{item.endpoint}</span>
                <span className="text-white font-medium">{item.count}건</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="에러 메시지, 경로, 사용자로 검색..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  요청
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  에러 메시지
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {errors.map((error) => (
                <tr key={error.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300 font-mono">{error.timestamp}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded">
                        {error.method}
                      </span>
                      <span className="text-sm text-slate-300 font-mono">{error.path}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(error.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{error.error}</p>
                      <p className="text-xs text-slate-400 mt-1">{error.message}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-slate-300">{error.user}</p>
                      <p className="text-xs text-slate-500">{error.ip}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            총 <span className="text-white font-medium">127</span>건의 에러
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
              이전
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">2</button>
            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">3</button>
            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
