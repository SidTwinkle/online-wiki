import { databaseService } from '~/lib/database'
import type { ApiResponse } from '~/types'

interface CleanupResponse {
  deletedSessions: number
}

export default defineEventHandler(async (event): Promise<ApiResponse<CleanupResponse>> => {
  try {
    // This endpoint should only be called by system/admin
    // For now, we'll allow it but in production you might want to add admin auth
    
    // Get count of expired sessions before deletion
    const expiredSessions = await databaseService.countExpiredSessions()

    // Delete expired sessions
    await databaseService.deleteExpiredSessions()

    return {
      success: true,
      data: {
        deletedSessions: expiredSessions
      },
      message: `Cleaned up ${expiredSessions} expired sessions`
    }
  } catch (error: any) {
    console.error('Session cleanup error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to cleanup sessions'
    })
  }
})