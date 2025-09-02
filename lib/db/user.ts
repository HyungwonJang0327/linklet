import { db } from './index'

export interface CreateUserData {
  email?: string
  name?: string
  bio?: string
  avatar?: string
  locale?: string
}

export interface UpdateUserData {
  name?: string
  bio?: string
  avatar?: string
  locale?: string
}

// User Operations
export async function createUser(data: CreateUserData) {
  return db.user.create({
    data,
    include: {
      _count: {
        select: {
          wishlists: true
        }
      }
    }
  })
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          wishlists: true
        }
      }
    }
  })
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: {
      _count: {
        select: {
          wishlists: true
        }
      }
    }
  })
}

export async function updateUser(id: string, data: UpdateUserData) {
  return db.user.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          wishlists: true
        }
      }
    }
  })
}

export async function deleteUser(id: string) {
  // This will also cascade delete all wishlists and their items due to the schema relationships
  return db.user.delete({
    where: { id }
  })
}

// Session Operations
export async function createSession(userId: string, sessionToken: string, expires: Date) {
  return db.session.create({
    data: {
      userId,
      sessionToken,
      expires
    }
  })
}

export async function getSessionByToken(sessionToken: string) {
  return db.session.findUnique({
    where: { sessionToken },
    include: {
      user: true
    }
  })
}

export async function updateSession(sessionToken: string, data: { expires?: Date }) {
  return db.session.update({
    where: { sessionToken },
    data
  })
}

export async function deleteSession(sessionToken: string) {
  return db.session.delete({
    where: { sessionToken }
  })
}

export async function deleteUserSessions(userId: string) {
  return db.session.deleteMany({
    where: { userId }
  })
}