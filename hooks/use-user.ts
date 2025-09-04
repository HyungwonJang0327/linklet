'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'

interface UserData {
  id: string
  name?: string
  email?: string
  bio?: string
  image?: string
  locale?: string
  createdAt: string
  _count?: {
    wishlists: number
  }
}

interface UpdateUserData {
  name?: string
  bio?: string
  locale?: string
}

// Query keys
export const userKeys = {
  all: ['users'] as const,
  user: (id: string) => [...userKeys.all, id] as const,
}

// Fetch user data
async function fetchUser(userId: string): Promise<UserData> {
  const response = await fetch(`/api/users?id=${userId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch user data')
  }

  return response.json()
}

// Update user data
async function updateUser(userId: string, data: UpdateUserData): Promise<UserData> {
  const response = await fetch(`/api/users?id=${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update profile')
  }

  return response.json()
}

// Hook to fetch user data
export function useUser() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: userKeys.user(user?.id || ''),
    queryFn: () => fetchUser(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Hook to update user data
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: UpdateUserData) => {
      if (!user?.id) {
        throw new Error('User ID is required')
      }
      return updateUser(user.id, data)
    },
    onMutate: async (newData) => {
      if (!user?.id) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.user(user.id) })

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<UserData>(userKeys.user(user.id))

      // Optimistically update to the new value
      queryClient.setQueryData<UserData>(userKeys.user(user.id), (old) => {
        if (!old) return old
        return { ...old, ...newData }
      })

      // Return a context object with the snapshotted value
      return { previousUser }
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser && user?.id) {
        queryClient.setQueryData(userKeys.user(user.id), context.previousUser)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: userKeys.user(user.id) })
      }
    },
  })
}

// Hook to prefetch user data
export function usePrefetchUser() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const prefetchUser = () => {
    if (!user?.id) return

    queryClient.prefetchQuery({
      queryKey: userKeys.user(user.id),
      queryFn: () => fetchUser(user.id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return prefetchUser
}