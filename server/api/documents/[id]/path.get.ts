import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { ApiResponse, Document } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

interface DocumentPathResponse {
  path: Document[]
  fullPath: string
}

export default defineEventHandler(async (event): Promise<ApiResponse<DocumentPathResponse>> => {
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

    // Build path by traversing up the hierarchy
    const pathDocuments: Document[] = []
    let currentDocument: Document | null = document

    while (currentDocument) {
      pathDocuments.unshift(currentDocument) // Add to beginning
      
      if (currentDocument.parentId) {
        currentDocument = await databaseService.getDocumentById(currentDocument.parentId)
      } else {
        currentDocument = null
      }
    }

    // Build full path string
    const fullPath = pathDocuments.map(doc => doc.title).join(' / ')

    return {
      success: true,
      data: {
        path: pathDocuments,
        fullPath
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Get document path error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})