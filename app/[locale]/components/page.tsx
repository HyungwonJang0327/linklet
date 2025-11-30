'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loading, LoadingSpinner } from '@/components/ui/loading'
import {
  dialogOpen,
  dialogClose,
  dialogCloseAll,
} from '@/components/ui/dialog-provider'
import { ArrowRight, Download, Heart, Plus, Search, Settings, Trash2, User } from 'lucide-react'

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingTest = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 3000)
  }

  const handleSimpleAlert = () => {
    dialogOpen({
      type: 'alert',
      title: '성공',
      description: '작업이 성공적으로 완료되었습니다!',
      confirmText: '확인'
    })
  }

  const handleConfirmDialog = () => {
    dialogOpen({
      type: 'confirm',
      title: '작업 확인',
      description: '이 작업을 계속하시겠습니까?',
      onConfirm: () => {
        dialogOpen({
          type: 'alert',
          title: '확인됨',
          description: '작업이 확인되었습니다!'
        })
      },
      onCancel: () => {
        dialogOpen({
          type: 'alert',
          title: '취소됨',
          description: '작업이 취소되었습니다!'
        })
      }
    })
  }

  const handleDeleteDialog = () => {
    dialogOpen({
      type: 'confirm',
      variant: 'destructive',
      title: '항목 삭제',
      description: '이 항목을 삭제하면 복구할 수 없습니다.',
      confirmText: '영구 삭제',
      onConfirm: () => {
        dialogOpen({
          type: 'alert',
          title: '삭제됨',
          description: '항목이 삭제되었습니다!'
        })
      }
    })
  }

  const handleCustomDialog = () => {
    dialogOpen({
      title: '위시리스트 생성',
      size: 'lg',
      children: (
        <div className="space-y-4">
          <Input
            placeholder="위시리스트 제목을 입력하세요"
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm">생일</Button>
            <Button variant="outline" size="sm">크리스마스</Button>
            <Button variant="outline" size="sm">결혼</Button>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-300">
              새로운 위시리스트를 생성하여 원하는 상품들을 관리해보세요.
            </p>
          </div>
        </div>
      ),
      confirmText: '생성하기',
      onConfirm: () => {
        dialogOpen({
          type: 'alert',
          title: '생성됨',
          description: '새 위시리스트가 생성되었습니다!'
        })
      }
    })
  }

  const handleMultipleDialogs = () => {
    // First dialog
    dialogOpen({
      type: 'alert',
      title: '첫 번째 다이얼로그',
      description: '첫 번째 다이얼로그입니다.'
    })

    // Second dialog after short delay
    setTimeout(() => {
      dialogOpen({
        type: 'confirm',
        title: '두 번째 다이얼로그',
        description: '두 번째 다이얼로그가 첫 번째 위에 표시됩니다.',
        onConfirm: () => {
          // Third dialog
          dialogOpen({
            type: 'alert',
            title: '세 번째 다이얼로그',
            description: '마지막 다이얼로그입니다.'
          })
        }
      })
    }, 500)
  }

  const handleCloseTests = () => {
    // Open multiple dialogs for testing close functions
    dialogOpen({
      id: 'test-dialog-1',
      type: 'alert',
      title: '테스트 다이얼로그 1',
      description: 'ID: test-dialog-1'
    })

    setTimeout(() => {
      dialogOpen({
        id: 'test-dialog-2',
        type: 'alert',
        title: '테스트 다이얼로그 2',
        description: 'ID: test-dialog-2'
      })

      setTimeout(() => {
        dialogOpen({
          type: 'alert',
          title: '테스트 다이얼로그 3',
          description: 'ID 없음 - 자동 생성됨'
        })
      }, 300)
    }, 300)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">UI Components</h1>
        <p className="text-slate-400">
          Linklet에서 사용되는 모든 공통 컴포넌트를 확인하고 테스트해보세요.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Buttons */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">With Icons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button><Plus className="w-4 h-4 mr-2" />Add Item</Button>
                  <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
                  <Button variant="ghost"><Settings className="w-4 h-4 mr-2" />Settings</Button>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Input Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  기본 입력
                </label>
                <Input
                  placeholder="텍스트를 입력하세요"
                  value={inputValue}
                  onChange={(e: any) => setInputValue(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  비밀번호 입력
                </label>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  검색 입력
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="검색어를 입력하세요"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  비활성화된 입력
                </label>
                <Input
                  placeholder="비활성화된 입력"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">기본 카드</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm">
                    이것은 기본적인 카드 컴포넌트입니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    위시리스트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-3">
                    나만의 특별한 위시리스트
                  </p>
                  <Button variant="outline" size="sm" fullWidth>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    보기
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    프로필
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-3">
                    사용자 프로필 정보
                  </p>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm">수정</Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Loading States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Loading Spinners</h4>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner />
                    <span className="text-xs text-slate-400">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" />
                    <span className="text-xs text-slate-400">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" />
                    <span className="text-xs text-slate-400">Large</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Loading Demo</h4>
                <div className="space-y-3">
                  <Button onClick={handleLoadingTest} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '로딩 테스트 시작'}
                  </Button>
                  {isLoading && (
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <Loading text="데이터를 불러오는 중..." />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Dialog Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <h4 className="text-slate-200 font-medium">기본 다이얼로그</h4>
                <Button onClick={handleSimpleAlert} variant="outline" fullWidth>
                  알림 다이얼로그
                </Button>
                <Button onClick={handleConfirmDialog} variant="primary" fullWidth>
                  확인 다이얼로그
                </Button>
                <Button
                  onClick={handleDeleteDialog}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제 다이얼로그
                </Button>
              </div>
              <div className="space-y-3">
                <h4 className="text-slate-200 font-medium">커스텀 다이얼로그</h4>
                <Button onClick={handleCustomDialog} variant="outline" fullWidth>
                  <Plus className="w-4 h-4 mr-2" />
                  위시리스트 생성
                </Button>
                <Button onClick={handleMultipleDialogs} variant="primary" fullWidth>
                  다중 다이얼로그
                </Button>
                <Button onClick={handleCloseTests} variant="outline" fullWidth>
                  닫기 테스트용 다이얼로그
                </Button>
              </div>
              <div className="space-y-3">
                <h4 className="text-slate-200 font-medium">닫기 함수 테스트</h4>
                <Button onClick={() => dialogClose('test-dialog-1')} variant="outline" fullWidth>
                  특정 ID 닫기 (test-dialog-1)
                </Button>
                <Button onClick={() => dialogClose()} variant="outline" fullWidth>
                  최상단 다이얼로그 닫기
                </Button>
                <Button onClick={() => dialogCloseAll()} variant="primary" fullWidth>
                  모든 다이얼로그 닫기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">사용 가이드라인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Import 방법</h4>
                <div className="bg-slate-900 p-3 rounded-lg">
                  <code className="text-green-400 text-sm">
                    {`import { Button, Card, Input, dialogOpen, dialogClose } from '@/components/ui'`}
                  </code>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">Dialog API 사용법</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-300 text-sm mb-2">• <strong>dialogOpen()</strong>: 모든 다이얼로그 생성</p>
                    <code className="bg-slate-900 text-green-400 p-2 rounded block text-xs">
                      {`dialogOpen({ type: 'alert', title: '제목', description: '메시지' })`}
                    </code>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm mb-2">• <strong>dialogClose()</strong>: 다이얼로그 닫기</p>
                    <code className="bg-slate-900 text-green-400 p-2 rounded block text-xs">
                      {`dialogClose('id') // 특정 ID | dialogClose() // 최상단 다이얼로그`}
                    </code>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm mb-2">• <strong>dialogCloseAll()</strong>: 모든 다이얼로그 닫기</p>
                    <code className="bg-slate-900 text-green-400 p-2 rounded block text-xs">
                      {`dialogCloseAll() // 모든 다이얼로그를 한번에 닫기`}
                    </code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">컴포넌트 활용 팁</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• <strong>Button</strong>: 주요 액션에는 primary, 보조 액션에는 outline 사용</li>
                  <li>• <strong>Card</strong>: 관련된 정보들을 그룹화할 때 사용</li>
                  <li>• <strong>Dialog</strong>: 사용자의 확인이 필요한 중요한 액션에 사용</li>
                  <li>• <strong>Loading</strong>: 데이터 로딩 시 사용자 경험 향상</li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-200 font-medium mb-3">접근성 고려사항</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• 모든 버튼은 키보드로 접근 가능</li>
                  <li>• 다이얼로그는 ESC 키로 닫기 가능</li>
                  <li>• 적절한 색상 대비 유지</li>
                  <li>• 로딩 상태 시 스크린 리더 지원</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}