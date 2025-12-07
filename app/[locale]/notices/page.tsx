'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { ChevronDownIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ko, enUS, ja } from 'date-fns/locale'

interface Notice {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export default function NoticesPage() {
  const { t, locale } = useI18n()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
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

  const toggleNotice = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const localeMap = {
      kr: ko,
      en: enUS,
      jp: ja,
    }
    return format(date, 'PPP', { locale: localeMap[locale as keyof typeof localeMap] })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <MegaphoneIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            {t('notices.title')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('notices.description')}
          </p>
        </div>

        {/* Notices List */}
        {notices.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center">
            <MegaphoneIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('notices.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all"
              >
                {/* Notice Header */}
                <button
                  onClick={() => toggleNotice(notice.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-3 mb-2">
                      {notice.isPinned && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {t('notices.pinned')}
                        </span>
                      )}
                      <span className="text-sm text-slate-400">
                        {t('notices.date')}: {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {notice.title}
                    </h3>
                  </div>
                  <ChevronDownIcon
                    className={`w-6 h-6 text-slate-400 transition-transform ${
                      openId === notice.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Notice Content (Accordion) */}
                {openId === notice.id && (
                  <div className="px-6 pb-6 border-t border-slate-700/50">
                    <div className="pt-4 prose prose-invert prose-slate max-w-none">
                      <div className="text-slate-300 whitespace-pre-wrap">
                        {notice.content}
                      </div>
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
