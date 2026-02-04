import { verifyToken } from '~/lib/auth'
import { databaseService } from '~/lib/database'
import type { ApiResponse } from '~/types'

interface VerifyResponse {
  valid: boolean
  user?: {
    id: string
    username: string
    email?: string
  }
}

export default defineEventHandler(async (event): Promise<ApiResponse<VerifyResponse>> => {
  try {
    const token = getCookie(event, 'auth-token') || 
                  getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      return {
        success: true,
        data: {
          valid: false
        }
      }
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return {
        success: true,
        data: {
          valid: false
        }
      }
    }

    // Check if session exists and is not expired
    const session = await databaseService.getSessionByToken(token)
    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await databaseService.deleteSession(session.id)
      }
      
      return {
        success: true,
        data: {
          valid: false
        }
      }
    }

    // Get user data
    const user = await databaseService.getUserById(payload.userId)
    if (!user) {
      // User doesn't exist, clean up session
      await databaseService.deleteSession(session.id)
      
      return {
        success: true,
        data: {
          valid: false
        }
      }
    }

    return {
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    }
  } catch (error: any) {
    console.error('Token verification error:', error)
    
    return {
      success: true,
      data: {
        valid: false
      }
    }
  }
})