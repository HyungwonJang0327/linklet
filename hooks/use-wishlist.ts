'use client'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import type { CreateWishlistData } from '@/lib/db/wishlist'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface CreateWishlistRequest {
  title: string
  description?: string
  isPublic?: boolean
  category?: string
  userId?: string
  productLinks?: Array<{
    url: string
    metadata?: ProductMetadata | null
  }>
}

interface WishlistResponse {
  id: string
  title: string
  description?: string
  shareUrl: string
  isPublic: boolean
  category: string
  createdAt: string
  updatedAt: string
  userId?: string
  items?: Array<{
    id: string
    title: string
    description?: string
    productUrl: string
    imageUrl?: string
    price?: string
    siteName?: string
    priority: number
    isCompleted: boolean
  }>
}

export const wishlistKeys = {
  all: ['wishlists'] as const,
  user: (userId: string) => [...wishlistKeys.all, 'user', userId] as const,
  detail: (id: string) => [...wishlistKeys.all, 'detail', id] as const,
}

export function useCreateWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWishlistRequest): Promise<WishlistResponse> => {
      if (!data?.title?.trim()) {
        throw new Error('Wishlist title is required')
      }

      try {
        const response = await fetch('/api/wishlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            title: data.title.trim(),
            description: data.description?.trim() || undefined,
            productLinks: data.productLinks?.filter(link => link?.url?.trim()) || []
          }),
        })

        if (!response) {
          throw new Error('No response received')
        }

        const result = await response.json().catch(() => ({ error: 'Invalid response format' }))

        if (!response.ok) {
          throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        return result ?? { error: 'Empty response' }
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Network error occurred')
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries with defensive checks
      if (variables?.userId?.trim()) {
        queryClient.invalidateQueries({ 
          queryKey: wishlistKeys.user(variables.userId.trim()) 
        })
      }
      queryClient.invalidateQueries({ 
        queryKey: wishlistKeys.all 
      })
    },
    onError: (error) => {
      console.error('Failed to create wishlist:', error)
    },
  })
}

export function useUserWishlists(userId?: string) {
  return useQuery({
    queryKey: wishlistKeys.user(userId?.trim() || ''),
    queryFn: async (): Promise<WishlistResponse[]> => {
      const trimmedUserId = userId?.trim()
      if (!trimmedUserId) throw new Error('User ID is required')
      
      try {
        const response = await fetch(`/api/wishlists?userId=${encodeURIComponent(trimmedUserId)}`)
        
        if (!response) {
          throw new Error('No response received')
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json().catch(() => [])
        return Array.isArray(result) ? result : []
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Failed to fetch wishlists')
      }
    },
    enabled: !!userId?.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useWishlistById(id: string) {
  return useQuery({
    queryKey: wishlistKeys.detail(id?.trim() || ''),
    queryFn: async (): Promise<WishlistResponse> => {
      const trimmedId = id?.trim()
      if (!trimmedId) throw new Error('Wishlist ID is required')
      
      try {
        const response = await fetch(`/api/wishlists/${encodeURIComponent(trimmedId)}`)
        
        if (!response) {
          throw new Error('No response received')
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 404) {
            throw new Error('Wishlist not found')
          }
          throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json().catch(() => null)
        if (!result) {
          throw new Error('Invalid wishlist data received')
        }
        
        return result
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Failed to fetch wishlist')
      }
    },
    enabled: !!id?.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}