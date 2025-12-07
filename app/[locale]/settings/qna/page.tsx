'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface QnA {
  id: string
  question: string
  answer: string | null
  status: 'pending' | 'answered' | 'closed'
  createdAt: string
  updatedAt: string
}

export default function QnAPage() {
  const { user } = useAuth()
  const [qnas, setQnas] = useState<QnA[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [question, setQuestion] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQnAs()
  }, [])

  const fetchQnAs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/qna')

      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }

      const data = await response.json()
      setQnas(data.qnas)
    } catch (error) {
      console.error('Error fetching QnAs:', error)
      setError('문의사항을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setError('질문을 입력해주세요')
      return
    }

    if (question.length > 2000) {
      setError('질문은 2000자 이내로 작성해주세요')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/qna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: question.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit question')
      }

      setQuestion('')
      await fetchQnAs()
    } catch (error) {
      console.error('Error submitting question:', error)
      setError(error instanceof Error ? error.message : '질문 등록에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded">
            <ClockIcon className="w-3 h-3" />
            대기중
          </span>
        )
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded">
            <CheckCircleIcon className="w-3 h-3" />
            답변완료
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded">
            <XCircleIcon className="w-3 h-3" />
            종료
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">문의하기</h1>
          <p className="text-sm text-slate-400 mt-1">
            궁금한 사항을 문의해주세요. 빠른 시일 내에 답변드리겠습니다.
          </p>
        </div>
      </div>

      {/* New Question Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">새 문의 작성</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-slate-300 mb-2">
              문의 내용
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="문의하실 내용을 자세히 작성해주세요..."
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                {question.length}/2000
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !question.trim()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? '등록 중...' : '문의 등록'}
          </button>
        </form>
      </div>

      {/* QnA List */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">내 문의 내역</h2>

        {qnas.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">아직 문의 내역이 없습니다</p>
            <p className="text-sm text-slate-500 mt-2">궁금한 사항을 문의해주세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {qnas.map((qna) => (
              <div
                key={qna.id}
                className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleExpand(qna.id)}
                  className="w-full px-4 py-4 flex items-start gap-3 hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(qna.status)}
                      <span className="text-xs text-slate-500">
                        {formatDate(qna.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white line-clamp-2">
                      {qna.question}
                    </p>
                  </div>
                  <div className="flex-shrink-0 pt-1">
                    {expandedId === qna.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === qna.id && (
                  <div className="px-4 pb-4 border-t border-slate-700/50">
                    <div className="pt-4 space-y-4">
                      {/* Full Question */}
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">문의 내용</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {qna.question}
                        </p>
                      </div>

                      {/* Answer */}
                      {qna.answer ? (
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-2">답변</p>
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">
                              {qna.answer}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            답변일: {formatDate(qna.updatedAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            답변 대기 중입니다. 빠른 시일 내에 답변드리겠습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
