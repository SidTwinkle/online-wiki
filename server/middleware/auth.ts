import { verifyToken } from '~/lib/auth'
import { databaseService } from '~/lib/database'

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/me',
  '/api/auth/verify',
  '/api/auth/cleanup'
]

// Routes that require authentication
const protectedRoutes = [
  '/api/documents',
  '/api/search',
  '/api/upload'
]

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  
  // Skip non-API routes
  if (!url.startsWith('/api/')) {
    return
  }

  // Skip public routes
  if (publicRoutes.some(route => url.startsWith(route))) {
    return
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => url.startsWith(route))
  
  if (!isProtectedRoute) {
    return
  }

  try {
    // Get token from cookie or Authorization header
    const authHeader = getHeader(event, 'authorization')
    const token = getCookie(event, 'auth-token') || 
                  (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader)

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    // Check session in database
    const session = await databaseService.getSessionByToken(token)
    if (!session) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session not found'
      })
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await databaseService.deleteSession(session.id)
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired'
      })
    }

    // Verify user still exists
    const user = await databaseService.getUserById(payload.userId)
    if (!user) {
      // Clean up session for non-existent user
      await databaseService.deleteSession(session.id)
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }

    // Add user to event context for use in API handlers
    event.context.user = user
    event.context.session = session

  } catch (error: any) {
    // If it's already a createError, just throw it
    if (error.statusCode) {
      throw error
    }
    
    // Log unexpected errors
    console.error('Authentication middleware error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication error'
    })
  }
})