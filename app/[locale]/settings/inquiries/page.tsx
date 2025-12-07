'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  PlusIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  BugAntIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

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
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'QUESTION' as Inquiry['type'],
    subject: '',
    content: '',
    priority: undefined as Inquiry['priority']
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiries()
  }, [filter])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('type', filter)

      const response = await fetch(`/api/inquiries?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInquiries(data)
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({
          type: 'QUESTION',
          subject: '',
          content: '',
          priority: undefined
        })
        setShowForm(false)
        fetchInquiries()
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeIcon = (type: Inquiry['type']) => {
    switch (type) {
      case 'QUESTION': return <QuestionMarkCircleIcon className="w-5 h-5" />
      case 'FEEDBACK': return <ChatBubbleLeftRightIcon className="w-5 h-5" />
      case 'BUG_REPORT': return <BugAntIcon className="w-5 h-5" />
      case 'FEATURE_REQUEST': return <LightBulbIcon className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: Inquiry['type']) => {
    switch (type) {
      case 'QUESTION': return '문의사항'
      case 'FEEDBACK': return '피드백'
      case 'BUG_REPORT': return '버그 제보'
      case 'FEATURE_REQUEST': return '기능 제안'
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">문의 및 피드백</h1>
          <p className="text-sm text-slate-400 mt-1">궁금한 사항이나 의견을 남겨주세요</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          새 문의 작성
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Inquiry['type'] })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="QUESTION">문의사항</option>
                <option value="FEEDBACK">피드백</option>
                <option value="BUG_REPORT">버그 제보</option>
                <option value="FEATURE_REQUEST">기능 제안</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">제목</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? '제출 중...' : '제출'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'QUESTION', 'FEEDBACK', 'BUG_REPORT', 'FEATURE_REQUEST'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type === 'all' ? '전체' : getTypeLabel(type as Inquiry['type'])}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-slate-400">문의 내역이 없습니다</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-blue-400">
                    {getTypeIcon(inquiry.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{inquiry.subject}</h3>
                    <p className="text-sm text-slate-400 mt-1">{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded">
                    {getTypeLabel(inquiry.type)}
                  </span>
                  {getStatusBadge(inquiry.status)}
                </div>
              </div>

              <div className="text-sm text-slate-300 whitespace-pre-wrap">
                {inquiry.content}
              </div>

              {inquiry.response && (
                <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">답변</span>
                    {inquiry.respondedAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(inquiry.respondedAt).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{inquiry.response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
