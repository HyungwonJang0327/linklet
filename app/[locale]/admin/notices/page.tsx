'use client'

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface Notice {
  id: string
  title: string
  content: string
  isPublished: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublished: true,
    isPinned: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNotices()
  }, [currentPage])

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/admin/notices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotices(data.notices)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingNotice ? '/api/admin/notices' : '/api/admin/notices'
      const method = editingNotice ? 'PUT' : 'POST'
      const body = editingNotice
        ? { ...formData, id: editingNotice.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setFormData({
          title: '',
          content: '',
          isPublished: true,
          isPinned: false
        })
        setEditingNotice(null)
        setShowForm(false)
        fetchNotices()
      }
    } catch (error) {
      console.error('Error submitting notice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      isPublished: notice.isPublished,
      isPinned: notice.isPinned
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/notices?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNotices()
      }
    } catch (error) {
      console.error('Error deleting notice:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingNotice(null)
    setFormData({
      title: '',
      content: '',
      isPublished: true,
      isPinned: false
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">공지사항 관리</h1>
          <p className="text-sm text-slate-400 mt-1">공지사항 작성 및 관리</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          새 공지사항 작성
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="공지사항 내용을 입력하세요..."
                required
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                공개
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                상단 고정
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? '저장 중...' : editingNotice ? '수정' : '작성'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                취소
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">작성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {notice.isPinned && (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                              고정
                            </span>
                          )}
                          {notice.isPublished ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded flex items-center gap-1">
                              <EyeIcon className="w-3 h-3" />
                              공개
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded flex items-center gap-1">
                              <EyeSlashIcon className="w-3 h-3" />
                              비공개
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white max-w-md truncate">
                          {notice.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(notice)}
                            className="text-blue-400 hover:text-blue-300"
                            title="수정"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="text-red-400 hover:text-red-300"
                            title="삭제"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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
                  총 <span className="text-white font-medium">{pagination.totalCount}</span>건
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
