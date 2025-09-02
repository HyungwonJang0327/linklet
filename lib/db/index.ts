// Re-export the database client
export { db, prisma } from './client'

// Re-export everything from wishlist and user modules for convenience
export * from './wishlist'
export * from './user'