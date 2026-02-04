import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '~/lib/auth'
import type { User } from '~/types'

describe('Authentication System', () => {
  const mockUser: User = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })

    it('should verify correct passwords', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify valid tokens', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)
      
      expect(payload).toBeDefined()
      expect(payload?.userId).toBe(mockUser.id)
      expect(payload?.username).toBe(mockUser.username)
    })

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here'
      const payload = verifyToken(invalidToken)
      
      expect(payload).toBeNull()
    })

    it('should reject malformed tokens', () => {
      const malformedToken = 'not-a-jwt-token'
      const payload = verifyToken(malformedToken)
      
      expect(payload).toBeNull()
    })
  })

  describe('Token Payload', () => {
    it('should include correct user information in token', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)
      
      expect(payload).toMatchObject({
        userId: mockUser.id,
        username: mockUser.username
      })
    })

    it('should not include sensitive information in token', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)
      
      // Ensure email and other sensitive data are not in the token
      expect(payload).not.toHaveProperty('email')
      expect(payload).not.toHaveProperty('password')
      expect(payload).not.toHaveProperty('passwordHash')
    })
  })
})