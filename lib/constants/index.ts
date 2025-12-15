export const APP_CONFIG = {
  name: 'Linklet',
  description: 'Your Personal Wishlist Manager',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  maxWishlistsPerUser: {
    free: 2,
    pro: Infinity
  },
  maxItemsPerWishlist: Infinity,
  maxProductLinksOnCreate: 10,
  supportedLocales: ['kr', 'en', 'jp'] as const,
  defaultLocale: 'kr' as const
}

export const WISHLIST_CATEGORIES = [
  'general',
  'birthday',
  'christmas',
  'wedding',
  'baby',
  'electronics',
  'fashion',
  'books',
  'travel',
  'home'
] as const

export const VALIDATION_RULES = {
  wishlist: {
    title: {
      minLength: 2,
      maxLength: 100
    },
    description: {
      maxLength: 500
    }
  },
  wishlistItem: {
    title: {
      minLength: 1,
      maxLength: 200
    },
    description: {
      maxLength: 1000
    },
    price: {
      maxLength: 50
    },
    priority: {
      min: 0,
      max: 9999
    }
  },
  user: {
    name: {
      maxLength: 100
    },
    bio: {
      maxLength: 500
    }
  }
}

export const ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  invalidInput: 'Please check your input and try again.',
  networkError: 'Network error. Please check your connection.',
  serverError: 'Server error. Please try again later.'
}