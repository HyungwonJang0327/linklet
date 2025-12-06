'use client'

import { useState } from 'react'
import { Cog6ToothIcon, BellIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', name: '일반 설정', icon: Cog6ToothIcon },
    { id: 'notifications', name: '알림 설정', icon: BellIcon },
    { id: 'email', name: '이메일 템플릿', icon: EnvelopeIcon },
    { id: 'security', name: '보안 설정', icon: ShieldCheckIcon },
  ]

  const categories = [
    { id: 'GENERAL', name: '일반', description: '기본 카테고리', color: 'blue', enabled: true },
    { id: 'BIRTHDAY', name: '생일', description: '생일 선물', color: 'pink', enabled: true },
    { id: 'CHRISTMAS', name: '크리스마스', description: '연말 선물', color: 'red', enabled: true },
    { id: 'WEDDING', name: '결혼', description: '결혼 선물', color: 'purple', enabled: true },
    { id: 'GRADUATION', name: '졸업', description: '졸업 선물', color: 'green', enabled: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">시스템 설정</h1>
        <p className="text-sm text-slate-400 mt-1">서비스 설정 및 관리</p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">서비스 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  서비스 이름
                </label>
                <input
                  type="text"
                  defaultValue="Linklet"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  서비스 설명
                </label>
                <textarea
                  rows={3}
                  defaultValue="위시리스트를 쉽게 만들고 공유하는 서비스"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">위시리스트 카테고리</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                카테고리 추가
              </button>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                    <div>
                      <p className="text-sm font-medium text-white">{category.name}</p>
                      <p className="text-xs text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={category.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button className="text-slate-400 hover:text-white text-sm">
                      편집
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">기능 플래그</h2>
            <div className="space-y-3">
              {[
                { name: '회원가입 허용', description: '새로운 사용자 가입 가능 여부', enabled: true },
                { name: '공개 위시리스트 생성', description: '공개 위시리스트 생성 기능', enabled: true },
                { name: '이미지 업로드', description: 'S3 이미지 업로드 기능', enabled: true },
                { name: '프리미엄 기능', description: '유료 기능 활성화', enabled: false },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{feature.name}</p>
                    <p className="text-xs text-slate-400">{feature.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={feature.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">알림 설정</h2>
          <p className="text-slate-400">알림 설정 기능이 여기에 표시됩니다.</p>
        </div>
      )}

      {/* Email Templates */}
      {activeTab === 'email' && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">이메일 템플릿</h2>
          <p className="text-slate-400">이메일 템플릿 설정이 여기에 표시됩니다.</p>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">보안 설정</h2>
          <p className="text-slate-400">보안 설정이 여기에 표시됩니다.</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          변경사항 저장
        </button>
      </div>
    </div>
  )
}
