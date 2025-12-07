'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { MegaphoneIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Notice {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
}

export default function NoticesPage() {
  const { t } = useI18n()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notices')
      if (response.ok) {
        const data = await response.json()
        setNotices(data)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isNew = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('notices.title')}</h1>
          <p className="text-slate-400">{t('notices.description')}</p>
        </div>

        {/* Notices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
            <MegaphoneIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{t('notices.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {notice.isPinned && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                          {t('notices.pinned')}
                        </span>
                      )}
                      {isNew(notice.createdAt) && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          {t('notices.new')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">{notice.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(notice.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedNotice.isPinned && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                        {t('notices.pinned')}
                      </span>
                    )}
                    {isNew(selectedNotice.createdAt) && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                        {t('notices.new')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedNotice.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(selectedNotice.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedNotice.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
