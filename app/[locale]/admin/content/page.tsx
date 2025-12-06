'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, FlagIcon } from '@heroicons/react/24/outline'

export default function ContentPage() {
  const [filter, setFilter] = useState('all')

  const contents = [
    {
      id: '1',
      type: 'wishlist',
      title: '생일 선물 위시리스트',
      user: 'john@example.com',
      status: 'public',
      imageCount: 5,
      flagged: false,
      createdAt: '2024-03-15',
      views: 234
    },
    {
      id: '2',
      type: 'wishlist',
      title: '크리스마스 위시리스트',
      user: 'jane@example.com',
      status: 'public',
      imageCount: 12,
      flagged: true,
      createdAt: '2024-03-14',
      views: 567
    },
    {
      id: '3',
      type: 'image',
      title: 'product-image-1.jpg',
      user: 'bob@example.com',
      status: 'active',
      size: '2.3 MB',
      flagged: false,
      createdAt: '2024-03-13',
      views: 0
    },
    {
      id: '4',
      type: 'wishlist',
      title: '결혼 선물 리스트',
      user: 'alice@example.com',
      status: 'public',
      imageCount: 8,
      flagged: true,
      createdAt: '2024-03-12',
      views: 892
    },
  ]

  const stats = [
    { label: '전체 공개 위시리스트', value: '3,421', color: 'blue' },
    { label: '전체 이미지', value: '12,543', color: 'purple' },
    { label: '검토 필요', value: '23', color: 'red' },
    { label: '오늘 생성', value: '45', color: 'green' },
  ]

  const getTypeBadge = (type: string) => {
    const styles = type === 'wishlist'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles}`}>
        {type === 'wishlist' ? '위시리스트' : '이미지'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">컨텐츠 관리</h1>
        <p className="text-sm text-slate-400 mt-1">공개 컨텐츠 검토 및 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="제목 또는 사용자로 검색..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'flagged', 'recent'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f === 'all' ? '전체' : f === 'flagged' ? '검토필요' : '최근'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  컨텐츠
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  작성자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  정보
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
              {contents.map((content) => (
                <tr key={content.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {content.flagged && (
                        <FlagIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{content.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(content.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{content.user}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {content.status === 'public' ? (
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
                    <span className="text-sm text-slate-300">
                      {content.type === 'wishlist'
                        ? `이미지 ${content.imageCount}개`
                        : content.size}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{content.createdAt}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        보기
                      </button>
                      {content.flagged && (
                        <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            총 <span className="text-white font-medium">3,444</span>개의 컨텐츠
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
