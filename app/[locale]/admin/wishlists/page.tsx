'use client'

import { MagnifyingGlassIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function WishlistsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const wishlists = [
    { id: '1', title: '생일 선물 위시리스트', user: 'john@example.com', items: 12, isPublic: true, views: 245, createdAt: '2024-01-15' },
    { id: '2', title: '크리스마스 위시리스트', user: 'jane@example.com', items: 8, isPublic: true, views: 189, createdAt: '2024-02-20' },
    { id: '3', title: '개인 쇼핑 리스트', user: 'bob@example.com', items: 15, isPublic: false, views: 0, createdAt: '2024-01-10' },
    { id: '4', title: '결혼 선물 리스트', user: 'alice@example.com', items: 23, isPublic: true, views: 567, createdAt: '2024-03-05' },
    { id: '5', title: '취미 용품', user: 'charlie@example.com', items: 6, isPublic: false, views: 0, createdAt: '2024-03-12' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">위시리스트 관리</h1>
          <p className="text-sm text-slate-400 mt-1">전체 위시리스트 목록 및 관리</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">전체 위시리스트</p>
          <p className="text-2xl font-bold text-white mt-1">5,678</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">공개 위시리스트</p>
          <p className="text-2xl font-bold text-white mt-1">3,421</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">전체 아이템</p>
          <p className="text-2xl font-bold text-white mt-1">45,123</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">평균 조회수</p>
          <p className="text-2xl font-bold text-white mt-1">234</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="제목 또는 사용자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Wishlists Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  위시리스트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  아이템
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  공개 상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  조회수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {wishlists.map((wishlist) => (
                <tr key={wishlist.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{wishlist.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{wishlist.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">{wishlist.items}개</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {wishlist.isPublic ? (
                        <>
                          <EyeIcon className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">공개</span>
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">비공개</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{wishlist.views}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{wishlist.createdAt}</span>
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
            총 <span className="text-white font-medium">5,678</span>개의 위시리스트
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
