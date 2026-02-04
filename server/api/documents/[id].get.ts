import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { GetDocumentResponse, ApiResponse } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

export default defineEventHandler(async (event): Promise<ApiResponse<GetDocumentResponse>> => {
  try {
    // Check authentication
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Validate parameters
    const params = getRouterParams(event)
    const validationResult = paramsSchema.safeParse(params)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid document ID',
        data: validationResult.error.errors
      })
    }

    const { id } = validationResult.data

    // Get document from database
    const document = await databaseService.getDocumentById(id)
    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    return {
      success: true,
      data: {
        document
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Get document error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})