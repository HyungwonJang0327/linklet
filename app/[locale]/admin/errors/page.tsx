'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/use-debounce'

interface ErrorLog {
  id: string
  endpoint: string
  method: string
  statusCode: number
  message: string
  stack: string | null
  userId: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    email: string | null
    name: string | null
  } | null
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface Stats {
  total5xxErrors: number
  status500Errors: number
  status503Errors: number
}

interface EndpointStat {
  endpoint: string
  count: number
  percentage: number
}

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [stats, setStats] = useState<Stats>({ total5xxErrors: 0, status500Errors: 0, status503Errors: 0 })
  const [errorsByEndpoint, setErrorsByEndpoint] = useState<EndpointStat[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState('24h')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchErrors()
  }, [currentPage, timeRange, debouncedSearchTerm])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        timeRange
      })
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)

      const response = await fetch(`/api/admin/errors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors)
        setPagination(data.pagination)
        setStats(data.stats)
        setErrorsByEndpoint(data.errorsByEndpoint)
      }
    } catch (error) {
      console.error('Error fetching error logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const renderPaginationButtons = () => {
    if (!pagination || pagination.totalPages === 0) return null

    const buttons = []
    const maxButtons = 5
    const totalPages = pagination.totalPages

    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {i}
        </button>
      )
    }

    return buttons
  }

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <p className="text-sm text-slate-400">전체 5xx 에러</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">{stats.total5xxErrors.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
            <p className="text-sm text-slate-400">500 에러</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">{stats.status500Errors.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <p className="text-sm text-slate-400">503 에러</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">{stats.status503Errors.toLocaleString()}</p>
          </div>
        </div>
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
            placeholder="에러 메시지, 경로, 메서드로 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : errors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-400">에러 로그가 없습니다</p>
                  </td>
                </tr>
              ) : (
                errors.map((error) => (
                  <tr key={error.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300 font-mono">{formatDate(error.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded">
                          {error.method}
                        </span>
                        <span className="text-sm text-slate-300 font-mono truncate max-w-xs">{error.endpoint}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(error.statusCode)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-slate-300 truncate">{error.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-slate-300">
                          {error.user?.email || error.user?.name || '익명'}
                        </p>
                        <p className="text-xs text-slate-500">{error.ip || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedError(error)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              총 <span className="text-white font-medium">{pagination.totalCount.toLocaleString()}</span>건의 에러
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedError && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedError(null)}
        >
          <div
            className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded">
                      {selectedError.method}
                    </span>
                    {getStatusBadge(selectedError.statusCode)}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedError.endpoint}</h2>
                  <p className="text-sm text-slate-400">{formatDate(selectedError.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Error Message */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">에러 메시지</h3>
                <p className="text-sm text-white">{selectedError.message}</p>
              </div>

              {/* User Info */}
              {(selectedError.user || selectedError.ip) && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">사용자 정보</h3>
                  <div className="space-y-1 text-sm">
                    {selectedError.user && (
                      <div>
                        <span className="text-slate-400">이메일: </span>
                        <span className="text-white">{selectedError.user.email || selectedError.user.name || '익명'}</span>
                      </div>
                    )}
                    {selectedError.ip && (
                      <div>
                        <span className="text-slate-400">IP: </span>
                        <span className="text-white font-mono">{selectedError.ip}</span>
                      </div>
                    )}
                    {selectedError.userId && (
                      <div>
                        <span className="text-slate-400">User ID: </span>
                        <span className="text-white font-mono">{selectedError.userId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Agent */}
              {selectedError.userAgent && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">User Agent</h3>
                  <p className="text-xs text-slate-400 font-mono break-all">{selectedError.userAgent}</p>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stack && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Stack Trace</h3>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {selectedError.stack}
                  </pre>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
