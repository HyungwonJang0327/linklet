'use client'

import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'

export default function FeedbackPage() {
  const feedbacks = [
    { id: '1', user: 'user1@example.com', rating: 5, message: '정말 유용한 서비스입니다! 친구들과 위시리스트를 공유하기 편해요.', type: 'positive', createdAt: '2024-03-15 14:30', status: 'new' },
    { id: '2', user: 'user2@example.com', rating: 4, message: '좋은데 모바일 앱이 있으면 더 좋을 것 같아요.', type: 'suggestion', createdAt: '2024-03-15 10:20', status: 'new' },
    { id: '3', user: 'user3@example.com', rating: 3, message: '가끔 로딩이 느린 것 같습니다.', type: 'issue', createdAt: '2024-03-14 16:45', status: 'new' },
    { id: '4', user: 'user4@example.com', rating: 5, message: 'UI가 깔끔하고 사용하기 쉬워요!', type: 'positive', createdAt: '2024-03-14 09:15', status: 'reviewed' },
    { id: '5', user: 'user5@example.com', rating: 2, message: '카테고리를 더 추가해주세요.', type: 'suggestion', createdAt: '2024-03-13 18:30', status: 'reviewed' },
  ]

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIcon key={star} className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarOutlineIcon key={star} className="w-4 h-4 text-slate-600" />
          )
        ))}
      </div>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles = {
      positive: 'bg-green-500/10 text-green-400 border-green-500/20',
      suggestion: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      issue: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    const text = {
      positive: '긍정적',
      suggestion: '제안',
      issue: '문제'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles[type as keyof typeof styles]}`}>
        {text[type as keyof typeof text]}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = status === 'new'
      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    const text = status === 'new' ? '새 피드백' : '확인됨'
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles}`}>
        {text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">피드백 처리</h1>
          <p className="text-sm text-slate-400 mt-1">사용자 피드백 및 의견</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">전체 피드백</p>
          <p className="text-2xl font-bold text-white mt-1">234</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">미확인</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">5</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">평균 평점</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-white">4.2</p>
            {renderStars(4)}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">긍정 비율</p>
          <p className="text-2xl font-bold text-green-400 mt-1">78%</p>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {feedback.user.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{feedback.user}</span>
                    {getTypeBadge(feedback.type)}
                    {getStatusBadge(feedback.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {renderStars(feedback.rating)}
                    <span>•</span>
                    <span>{feedback.createdAt}</span>
                  </div>
                </div>
              </div>
              {feedback.status === 'new' && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  확인 처리
                </button>
              )}
            </div>
            <p className="text-slate-300 leading-relaxed pl-13">{feedback.message}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
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
  )
}
