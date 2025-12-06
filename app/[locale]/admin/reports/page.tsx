'use client'

import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function ReportsPage() {
  const reports = [
    { id: '1', type: '부적절한 콘텐츠', reporter: 'user1@example.com', target: 'wishlist/abc123', status: 'pending', createdAt: '2024-03-15 14:30', priority: 'high' },
    { id: '2', type: '스팸', reporter: 'user2@example.com', target: 'user/xyz789', status: 'pending', createdAt: '2024-03-15 10:20', priority: 'medium' },
    { id: '3', type: '저작권 침해', reporter: 'user3@example.com', target: 'item/def456', status: 'pending', createdAt: '2024-03-14 16:45', priority: 'high' },
    { id: '4', type: '사기', reporter: 'user4@example.com', target: 'wishlist/ghi789', status: 'resolved', createdAt: '2024-03-14 09:15', priority: 'low' },
    { id: '5', type: '기타', reporter: 'user5@example.com', target: 'user/jkl012', status: 'rejected', createdAt: '2024-03-13 18:30', priority: 'low' },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    const text = {
      pending: '대기중',
      resolved: '처리완료',
      rejected: '기각됨'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles[status as keyof typeof styles]}`}>
        {text[status as keyof typeof text]}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
      medium: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    const text = {
      high: '높음',
      medium: '보통',
      low: '낮음'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${styles[priority as keyof typeof styles]}`}>
        {text[priority as keyof typeof text]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">신고 처리</h1>
          <p className="text-sm text-slate-400 mt-1">사용자 신고 내역 및 처리</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">대기중</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">처리완료</p>
              <p className="text-2xl font-bold text-white">127</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">기각됨</p>
              <p className="text-2xl font-bold text-white">45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  신고 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  신고자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  대상
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  신고일시
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">{report.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{report.reporter}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300 font-mono text-xs">{report.target}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(report.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{report.createdAt}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {report.status === 'pending' && (
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        처리하기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
