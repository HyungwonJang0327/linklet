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
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.userId) {
        queryClient.invalidateQueries({ 
          queryKey: wishlistKeys.user(variables.userId) 
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
    queryKey: wishlistKeys.user(userId || ''),
    queryFn: async (): Promise<WishlistResponse[]> => {
      if (!userId) throw new Error('User ID is required')
      
      const response = await fetch(`/api/wishlists?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlists')
      }
      
      return response.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useWishlistById(id: string) {
  return useQuery({
    queryKey: wishlistKeys.detail(id),
    queryFn: async (): Promise<WishlistResponse> => {
      const response = await fetch(`/api/wishlists/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }
      
      return response.json()
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}