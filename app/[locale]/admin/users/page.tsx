'use client'

import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

interface User {
  id: string
  name: string
  email: string
  role: string
  wishlists: number
  createdAt: string
  status: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search term by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchUsers()
  }, [currentPage, debouncedSearchTerm])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (currentPage !== 1) {
      setCurrentPage(1) // Reset to first page on search
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = role === 'ADMIN'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles}`}>
        {role}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = status === 'active'
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles}`}>
        {status === 'active' ? '활성' : '비활성'}
      </span>
    )
  }

  const renderPaginationButtons = () => {
    if (!pagination || pagination.totalPages === 0) return null

    const buttons = []
    const maxButtons = 5
    const totalPages = pagination.totalPages

    // Calculate start and end pages
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

    // Adjust startPage if we're near the end
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
          <p className="text-sm text-slate-400 mt-1">전체 사용자 목록 및 관리</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">사용자가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      위시리스트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">{user.wishlists}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">{user.createdAt}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  총 <span className="text-white font-medium">{pagination.totalCount.toLocaleString()}</span>명의 사용자
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
          </>
        )}
      </div>
    </div>
  )
}
