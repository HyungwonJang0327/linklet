import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Wishlist,
  CreateWishlistRequest,
  CreateWishlistItemRequest,
  ApiResponse
} from '@/lib/types'

// Query Keys
export const wishlistKeys = {
  all: ['wishlists'] as const,
  lists: () => [...wishlistKeys.all, 'list'] as const,
  list: (filters: string) => [...wishlistKeys.lists(), filters] as const,
  details: () => [...wishlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...wishlistKeys.details(), id] as const,
  shared: (shareUrl: string) => [...wishlistKeys.all, 'shared', shareUrl] as const,
  user: (userId: string) => [...wishlistKeys.lists(), 'user', userId] as const,
}

// API Functions
async function fetchWishlists(userId?: string): Promise<Wishlist[]> {
  const url = userId ? `/api/wishlists?userId=${userId}` : '/api/wishlists'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch wishlists')
  }
  return response.json()
}

async function fetchWishlist(id: string): Promise<Wishlist> {
  const response = await fetch(`/api/wishlists/${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Wishlist not found')
    }
    throw new Error('Failed to fetch wishlist')
  }
  return response.json()
}

async function fetchSharedWishlist(shareUrl: string): Promise<Wishlist> {
  const response = await fetch(`/api/wishlists/share/${shareUrl}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Wishlist not found')
    }
    if (response.status === 403) {
      throw new Error('This wishlist is private')
    }
    throw new Error('Failed to fetch wishlist')
  }
  return response.json()
}

async function createWishlist(data: CreateWishlistRequest): Promise<Wishlist> {
  const response = await fetch('/api/wishlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create wishlist')
  }

  return response.json()
}

async function createWishlistItem(wishlistId: string, data: CreateWishlistItemRequest): Promise<any> {
  const response = await fetch(`/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create wishlist item')
  }

  return response.json()
}

async function deleteWishlist(id: string): Promise<void> {
  const response = await fetch(`/api/wishlists/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete wishlist')
  }
}

async function deleteWishlistItem(itemId: string): Promise<void> {
  const response = await fetch(`/api/items/${itemId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete wishlist item')
  }
}

// Hooks
export function useWishlists(userId?: string) {
  return useQuery({
    queryKey: userId ? wishlistKeys.user(userId) : wishlistKeys.lists(),
    queryFn: () => fetchWishlists(userId),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: userId ? !!userId : true,
  })
}

export function useWishlist(id: string) {
  return useQuery({
    queryKey: wishlistKeys.detail(id),
    queryFn: () => fetchWishlist(id),
    enabled: !!id,
  })
}

export function useSharedWishlist(shareUrl: string) {
  return useQuery({
    queryKey: wishlistKeys.shared(shareUrl),
    queryFn: () => fetchSharedWishlist(shareUrl),
    enabled: !!shareUrl,
    staleTime: 1000 * 60 * 10, // 공유 위시리스트는 더 긴 캐시
    retry: (failureCount, error) => {
      // 404나 403은 재시도하지 않음
      if (error?.message.includes('not found') || error?.message.includes('private')) {
        return false
      }
      return failureCount < 2
    }
  })
}

export function useCreateWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWishlist,
    onSuccess: () => {
      // 위시리스트 목록 무효화
      queryClient.invalidateQueries({ queryKey: wishlistKeys.lists() })
    },
  })
}

export function useCreateWishlistItem(wishlistId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWishlistItemRequest) => createWishlistItem(wishlistId, data),
    onSuccess: () => {
      // 해당 위시리스트 무효화
      queryClient.invalidateQueries({ queryKey: wishlistKeys.detail(wishlistId) })
      // 공유 위시리스트가 있다면 함께 무효화
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    },
  })
}

export function useDeleteWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.lists() })
    },
  })
}

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWishlistItem,
    onSuccess: () => {
      // 모든 위시리스트 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    },
  })
}