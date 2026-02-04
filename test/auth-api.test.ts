import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Authentication API', async () => {
  await setup({
    // Test against the built app
    build: true,
    server: true
  })

  describe('Auth Endpoints', () => {
    it('should return user as null when not authenticated', async () => {
      const response = await $fetch('/api/auth/me')
      
      expect(response).toMatchObject({
        success: true,
        data: {
          user: null
        }
      })
    })

    it('should verify token as invalid when no token provided', async () => {
      const response = await $fetch('/api/auth/verify', {
        method: 'POST'
      })
      
      expect(response).toMatchObject({
        success: true,
        data: {
          valid: false
        }
      })
    })

    it('should handle logout gracefully when not logged in', async () => {
      const response = await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      expect(response).toMatchObject({
        success: true,
        data: {
          success: true
        }
      })
    })

    it('should clean up expired sessions', async () => {
      const response = await $fetch('/api/auth/cleanup', {
        method: 'POST'
      })
      
      expect(response).toMatchObject({
        success: true,
        data: {
          deletedSessions: expect.any(Number)
        }
      })
    })
  })

  describe('Login Validation', () => {
    it('should reject login with missing username', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            password: 'testpassword'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.status).toBe(400)
      }
    })

    it('should reject login with missing password', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            username: 'testuser'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.status).toBe(400)
      }
    })

    it('should reject login with invalid credentials', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            username: 'nonexistentuser',
            password: 'wrongpassword'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })
  })
})