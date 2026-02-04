import { verifyToken } from '~/lib/auth'
import { databaseService } from '~/lib/database'
import type { LogoutResponse, ApiResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<LogoutResponse>> => {
  try {
    const token = getCookie(event, 'auth-token') || 
                  getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (token) {
      // Verify token is valid
      const payload = verifyToken(token)
      if (payload) {
        // Remove session from database
        const session = await databaseService.getSessionByToken(token)
        if (session) {
          await databaseService.deleteSession(session.id)
        }
      }
    }

    // Clear the auth cookie
    deleteCookie(event, 'auth-token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return {
      success: true,
      data: {
        success: true
      },
      message: 'Logout successful'
    }
  } catch (error: any) {
    console.error('Logout error:', error)
    
    // Even if there's an error, we should still clear the cookie
    deleteCookie(event, 'auth-token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return {
      success: true,
      data: {
        success: true
      },
      message: 'Logout completed'
    }
  }
})