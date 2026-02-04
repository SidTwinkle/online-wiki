import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { ApiResponse } from '~/types'

const reorderDocumentsSchema = z.object({
  parentId: z.string().uuid('Invalid parent ID format').optional().nullable(),
  documentIds: z.array(z.string().uuid('Invalid document ID format')).min(1, 'At least one document ID required')
})

interface ReorderDocumentsResponse {
  success: boolean
  updatedCount: number
}

export default defineEventHandler(async (event): Promise<ApiResponse<ReorderDocumentsResponse>> => {
  try {
    // Check authentication
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    
    // Validate input
    const validationResult = reorderDocumentsSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validationResult.error.errors
      })
    }

    const { parentId, documentIds } = validationResult.data

    // Validate that all documents exist and belong to the specified parent
    const documents = await Promise.all(
      documentIds.map(id => databaseService.getDocumentById(id))
    )

    // Check if any documents don't exist
    const missingDocuments = documents
      .map((doc, index) => doc ? null : documentIds[index])
      .filter(id => id !== null)

    if (missingDocuments.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Documents not found: ${missingDocuments.join(', ')}`
      })
    }

    // Check if all documents belong to the specified parent
    const invalidParentDocuments = documents
      .map((doc, index) => (doc!.parentId === parentId) ? null : documentIds[index])
      .filter(id => id !== null)

    if (invalidParentDocuments.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Documents do not belong to specified parent: ${invalidParentDocuments.join(', ')}`
      })
    }

    // Update positions
    await databaseService.updateDocumentPositions(parentId || null, documentIds)

    return {
      success: true,
      data: {
        success: true,
        updatedCount: documentIds.length
      },
      message: 'Documents reordered successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Reorder documents error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})