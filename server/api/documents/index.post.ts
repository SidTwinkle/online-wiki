import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { CreateDocumentRequest, CreateDocumentResponse, ApiResponse } from '~/types'

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().optional(),
  parentId: z.string().uuid('Invalid parent ID format').optional(),
  type: z.enum(['document', 'folder'], { required_error: 'Type is required' })
})

export default defineEventHandler(async (event): Promise<ApiResponse<CreateDocumentResponse>> => {
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
    const validationResult = createDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validationResult.error.errors
      })
    }

    const { title, content, parentId, type } = validationResult.data

    // Validate parent exists if parentId is provided
    if (parentId) {
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
    }

    // Get the next position for the document
    const siblings = await databaseService.getDocumentsByParentId(parentId || null)
    const position = siblings.length

    // Generate path based on parent
    let path = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (parentId) {
      const parent = await databaseService.getDocumentById(parentId)
      if (parent && parent.path) {
        path = `${parent.path}/${path}`
      }
    }

    // Create document in database
    const document = await databaseService.createDocument({
      title,
      content: content || null,
      type,
      parentId: parentId || null,
      path,
      position,
      createdBy: user.id
    })

    return {
      success: true,
      data: {
        document
      },
      message: 'Document created successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Create document error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})