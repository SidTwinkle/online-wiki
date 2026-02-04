import { databaseService } from '~/lib/database'
import type { GetDocumentsResponse, ApiResponse } from '~/types'
import { buildDocumentTree } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<GetDocumentsResponse>> => {
  try {
    // Check authentication
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Get all documents from database
    const documents = await databaseService.getAllDocuments()
    
    // Build tree structure
    const documentTree = buildDocumentTree(documents)

    return {
      success: true,
      data: {
        documents: documentTree
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Get documents error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})