'use client'

import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', wishlists: 12, createdAt: '2024-01-15', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', wishlists: 8, createdAt: '2024-02-20', status: 'active' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'ADMIN', wishlists: 5, createdAt: '2024-01-10', status: 'active' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'USER', wishlists: 15, createdAt: '2024-03-05', status: 'inactive' },
    { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', role: 'USER', wishlists: 3, createdAt: '2024-03-12', status: 'active' },
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
          <p className="text-sm text-slate-400 mt-1">전체 사용자 목록 및 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>새 사용자 추가</span>
        </button>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <FunnelIcon className="w-5 h-5" />
            <span>필터</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  작업
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
            총 <span className="text-white font-medium">1,234</span>명의 사용자
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
