import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { DeleteDocumentResponse, ApiResponse } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

export default defineEventHandler(async (event): Promise<ApiResponse<DeleteDocumentResponse>> => {
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

    // Check if document exists
    const document = await databaseService.getDocumentById(id)
    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    // Check if document has children (for folders)
    if (document.type === 'folder') {
      const children = await databaseService.getDocumentsByParentId(id)
      if (children.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete folder with children. Please delete or move children first.'
        })
      }
    }

    // Delete document from database (cascade will handle related files)
    await databaseService.deleteDocument(id)

    return {
      success: true,
      data: {
        success: true
      },
      message: 'Document deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Delete document error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})