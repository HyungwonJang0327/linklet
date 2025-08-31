import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 위시리스트는 자주 변경되지 않으므로 캐시를 길게 설정
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 30, // 30분 (이전 cacheTime)
        // 네트워크 에러 시 재시도
        retry: (failureCount, error) => {
          // 404는 재시도하지 않음
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // 뮤테이션 에러 시 재시도 안함
        retry: false,
      }
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 항상 새로운 query client 생성
    return makeQueryClient()
  } else {
    // 브라우저: 싱글톤 패턴으로 query client 재사용
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}