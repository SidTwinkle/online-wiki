import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { User } from '~/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
  } catch {
    return null
  }
}

// Session management utilities
export function generateSessionToken(): string {
  return jwt.sign(
    { 
      type: 'session',
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function getSessionExpiryDate(days: number = 7): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + days)
  return expiryDate
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date()
}