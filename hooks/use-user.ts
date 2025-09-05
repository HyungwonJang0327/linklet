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
  if (!userId?.trim()) {
    throw new Error('User ID is required')
  }

  try {
    const response = await fetch(`/api/users?id=${encodeURIComponent(userId.trim())}`)

    if (!response) {
      throw new Error('No response received')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 404) {
        throw new Error('User not found')
      }
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json().catch(() => null)
    if (!result) {
      throw new Error('Invalid user data received')
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch user data')
  }
}

// Update user data
async function updateUser(userId: string, data: UpdateUserData): Promise<UserData> {
  if (!userId?.trim()) {
    throw new Error('User ID is required')
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data is required')
  }

  try {
    // Sanitize data
    const sanitizedData: UpdateUserData = {}
    if (data.name !== undefined) sanitizedData.name = data.name?.trim() || null
    if (data.bio !== undefined) sanitizedData.bio = data.bio?.trim() || null
    if (data.locale !== undefined) sanitizedData.locale = data.locale?.trim() || null

    const response = await fetch(`/api/users?id=${encodeURIComponent(userId.trim())}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    })

    if (!response) {
      throw new Error('No response received')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 404) {
        throw new Error('User not found')
      }
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json().catch(() => null)
    if (!result) {
      throw new Error('Invalid response data')
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update profile')
  }
}

// Hook to fetch user data
export function useUser() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: userKeys.user(user?.id?.trim() || ''),
    queryFn: () => fetchUser(user?.id?.trim() || ''),
    enabled: isAuthenticated && !!user?.id?.trim(),
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