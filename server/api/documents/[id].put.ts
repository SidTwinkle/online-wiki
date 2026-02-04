import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { UpdateDocumentRequest, UpdateDocumentResponse, ApiResponse } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  content: z.string().optional(),
  parentId: z.string().uuid('Invalid parent ID format').optional().nullable()
})

export default defineEventHandler(async (event): Promise<ApiResponse<UpdateDocumentResponse>> => {
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
    const paramsValidation = paramsSchema.safeParse(params)
    if (!paramsValidation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid document ID',
        data: paramsValidation.error.errors
      })
    }

    const { id } = paramsValidation.data

    // Check if document exists
    const existingDocument = await databaseService.getDocumentById(id)
    if (!existingDocument) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    const body = await readBody(event)
    
    // Validate input
    const validationResult = updateDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validationResult.error.errors
      })
    }

    const { title, content, parentId } = validationResult.data

    // Validate parent exists if parentId is provided
    if (parentId !== undefined) {
      if (parentId !== null) {
        // Check if trying to set self as parent
        if (parentId === id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Document cannot be its own parent'
          })
        }

        const parent = await databaseService.getDocumentById(parentId)
        if (!parent) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Parent document not found'
          })
        }
        if (parent.type !== 'folder') {
          throw createError({
            statusCode: 400,
            statusMessage: 'Parent must be a folder'
          })
        }

        // Check for circular reference
        const isCircular = await checkCircularReference(id, parentId)
        if (isCircular) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Cannot create circular reference'
          })
        }
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) {
      updateData.title = title
      // Update path if title changed
      let newPath = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const finalParentId = parentId !== undefined ? parentId : existingDocument.parentId
      if (finalParentId) {
        const parent = await databaseService.getDocumentById(finalParentId)
        if (parent && parent.path) {
          newPath = `${parent.path}/${newPath}`
        }
      }
      updateData.path = newPath
    }
    if (content !== undefined) {
      updateData.content = content
    }
    if (parentId !== undefined) {
      updateData.parentId = parentId
      // Update path if parent changed
      if (!updateData.path) {
        const documentTitle = title || existingDocument.title
        let newPath = documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        if (parentId) {
          const parent = await databaseService.getDocumentById(parentId)
          if (parent && parent.path) {
            newPath = `${parent.path}/${newPath}`
          }
        }
        updateData.path = newPath
      }
    }

    // Update document in database
    const document = await databaseService.updateDocument(id, updateData)

    return {
      success: true,
      data: {
        document
      },
      message: 'Document updated successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Update document error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper function to check for circular references
async function checkCircularReference(documentId: string, newParentId: string): Promise<boolean> {
  let currentParentId = newParentId
  const visited = new Set<string>()
  
  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true // Circular reference detected
    }
    if (currentParentId === documentId) {
      return true // Would create circular reference
    }
    
    visited.add(currentParentId)
    const parent = await databaseService.getDocumentById(currentParentId)
    if (!parent) {
      break
    }
    currentParentId = parent.parentId || ''
  }
  
  return false
}