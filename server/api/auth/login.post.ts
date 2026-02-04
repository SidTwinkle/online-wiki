import { z } from 'zod'
import { hashPassword, verifyPassword, generateToken } from '~/lib/auth'
import { databaseService } from '~/lib/database'
import type { LoginRequest, LoginResponse, ApiResponse } from '~/types'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(1, 'Password is required')
})

export default defineEventHandler(async (event): Promise<ApiResponse<LoginResponse>> => {
  try {
    const body = await readBody(event)
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validationResult.error.errors
      })
    }

    const { username, password } = validationResult.data

    // Find user by username
    const user = await databaseService.getUserByUsername(username)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Get user with password hash for verification
    const userWithPassword = await databaseService.getUserWithPasswordByUsername(username)

    if (!userWithPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Generate JWT token
    const token = generateToken(user)

    // Create session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await databaseService.createSession({
      userId: user.id,
      token,
      expiresAt
    })

    // Set HTTP-only cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return {
      success: true,
      data: {
        token,
        user
      },
      message: 'Login successful'
    }
  } catch (error: any) {
    // Clean up any potential session if token was created but cookie failed
    if (error.statusCode !== 400 && error.statusCode !== 401) {
      console.error('Login error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error'
      })
    }
    throw error
  }
})