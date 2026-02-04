import { verifyToken } from '~/lib/auth'
import { databaseService } from '~/lib/database'
import type { MeResponse, ApiResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<MeResponse>> => {
  try {
    const token = getCookie(event, 'auth-token') || 
                  getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      return {
        success: true,
        data: {
          user: null
        }
      }
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      // Invalid token, clear cookie
      deleteCookie(event, 'auth-token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      return {
        success: true,
        data: {
          user: null
        }
      }
    }

    // Check if session exists and is not expired
    const session = await databaseService.getSessionByToken(token)
    if (!session || session.expiresAt < new Date()) {
      // Session expired or doesn't exist, clear cookie
      if (session) {
        await databaseService.deleteSession(session.id)
      }
      
      deleteCookie(event, 'auth-token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      return {
        success: true,
        data: {
          user: null
        }
      }
    }

    // Get user data
    const user = await databaseService.getUserById(payload.userId)
    if (!user) {
      // User doesn't exist anymore, clean up session
      await databaseService.deleteSession(session.id)
      deleteCookie(event, 'auth-token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      return {
        success: true,
        data: {
          user: null
        }
      }
    }

    return {
      success: true,
      data: {
        user
      }
    }
  } catch (error: any) {
    console.error('Me endpoint error:', error)
    
    // On error, return null user (not authenticated)
    return {
      success: true,
      data: {
        user: null
      }
    }
  }
})