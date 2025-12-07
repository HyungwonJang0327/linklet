'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/use-debounce'

interface Inquiry {
  id: string
  type: 'QUESTION' | 'FEEDBACK' | 'BUG_REPORT' | 'FEATURE_REQUEST'
  subject: string
  content: string
  response?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category?: string
  createdAt: string
  respondedAt?: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchInquiries()
  }, [currentPage, debouncedSearchTerm, typeFilter, statusFilter])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/inquiries?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInquiries(data.inquiries)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (inquiryId: string, response: string, status: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inquiryId,
          response,
          status
        })
      })

      if (res.ok) {
        setSelectedInquiry(null)
        setResponseText('')
        fetchInquiries()
      }
    } catch (error) {
      console.error('Error responding to inquiry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeLabel = (type: Inquiry['type']) => {
    const labels = {
      QUESTION: '문의',
      FEEDBACK: '피드백',
      BUG_REPORT: '버그',
      FEATURE_REQUEST: '기능제안'
    }
    return labels[type]
  }

  const getStatusBadge = (status: Inquiry['status']) => {
    const styles = {
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ANSWERED: 'bg-green-500/10 text-green-400 border-green-500/20',
      CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }

    const labels = {
      PENDING: '대기중',
      IN_PROGRESS: '처리중',
      ANSWERED: '답변완료',
      CLOSED: '종료'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    )
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
      <div>
        <h1 className="text-2xl font-bold text-white">헬프 센터 관리</h1>
        <p className="text-sm text-slate-400 mt-1">사용자 문의 및 지원 요청 관리</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">전체 유형</option>
            <option value="QUESTION">문의사항</option>
            <option value="FEEDBACK">피드백</option>
            <option value="BUG_REPORT">버그 제보</option>
            <option value="FEATURE_REQUEST">기능 제안</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="PENDING">대기중</option>
            <option value="IN_PROGRESS">처리중</option>
            <option value="ANSWERED">답변완료</option>
            <option value="CLOSED">종료</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">문의 내역이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">유형</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">작성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded">
                          {getTypeLabel(inquiry.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white max-w-md truncate">
                          {inquiry.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{inquiry.user.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{inquiry.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(inquiry.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedInquiry(inquiry)
                            setResponseText(inquiry.response || '')
                          }}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {inquiry.response ? '수정' : '답변'}
                        </button>
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

      {/* Response Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInquiry.subject}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedInquiry.user.name} · {new Date(selectedInquiry.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedInquiry.content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">답변</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="답변을 입력하세요..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRespond(selectedInquiry.id, responseText, 'ANSWERED')}
                  disabled={submitting || !responseText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '처리 중...' : '답변 완료'}
                </button>
                <button
                  onClick={() => handleRespond(selectedInquiry.id, responseText, 'IN_PROGRESS')}
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  처리중으로 변경
                </button>
                <button
                  onClick={() => {
                    setSelectedInquiry(null)
                    setResponseText('')
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
