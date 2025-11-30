// Database Types
export interface User {
  id: string
  email: string | null
  name: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Wishlist {
  id: string
  title: string
  description: string | null
  shareUrl: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  userId: string | null
  user?: User | null
  items: WishlistItem[]
  _count?: {
    items: number
  }
}

export interface WishlistItem {
  id: string
  title: string
  description: string | null
  productUrl: string
  imageUrl: string | null
  price: string | null
  priority: number
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
  wishlistId: string
  wishlist?: Wishlist
}

// Form Types
export interface CreateWishlistRequest {
  title: string
  description?: string
  userId?: string
}

export interface CreateWishlistItemRequest {
  title: string
  description?: string
  productUrl: string
  imageUrl?: string
  price?: string
  priority?: number
}

// Component Types
export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  fullWidth?: boolean
}

export interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'url'
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}