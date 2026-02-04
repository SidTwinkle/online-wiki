import { z } from 'zod'
import { databaseService } from '~/lib/database'
import type { UpdateDocumentResponse, ApiResponse } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

const moveDocumentSchema = z.object({
  parentId: z.string().uuid('Invalid parent ID format').optional().nullable(),
  position: z.number().int().min(0, 'Position must be non-negative').optional()
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
    const document = await databaseService.getDocumentById(id)
    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    const body = await readBody(event)
    
    // Validate input
    const validationResult = moveDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validationResult.error.errors
      })
    }

    const { parentId, position } = validationResult.data

    // Validate parent exists if parentId is provided
    if (parentId !== undefined && parentId !== null) {
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

    // Use transaction to ensure consistency
    const updatedDocument = await databaseService.transaction(async (tx) => {
      const finalParentId = parentId !== undefined ? parentId : document.parentId

      // Get siblings in the target location
      const siblings = await tx.document.findMany({
        where: { parentId: finalParentId },
        orderBy: { position: 'asc' }
      })

      // Calculate new position if not provided
      let newPosition = position
      if (newPosition === undefined) {
        // If moving to different parent, append to end
        if (finalParentId !== document.parentId) {
          newPosition = siblings.filter((s: { id: string }) => s.id !== id).length
        } else {
          // Same parent, keep current position
          newPosition = document.position
        }
      }

      // Validate position is within bounds
      const maxPosition = siblings.filter((s: { id: string }) => s.id !== id).length
      if (newPosition! > maxPosition) {
        newPosition = maxPosition
      }

      // Update positions of affected siblings
      if (finalParentId === document.parentId) {
        // Moving within same parent - adjust positions
        if (newPosition! !== document.position) {
          if (newPosition! < document.position) {
            // Moving up - shift others down
            await tx.document.updateMany({
              where: {
                parentId: finalParentId,
                position: {
                  gte: newPosition!,
                  lt: document.position
                }
              },
              data: {
                position: {
                  increment: 1
                }
              }
            })
          } else {
            // Moving down - shift others up
            await tx.document.updateMany({
              where: {
                parentId: finalParentId,
                position: {
                  gt: document.position,
                  lte: newPosition!
                }
              },
              data: {
                position: {
                  decrement: 1
                }
              }
            })
          }
        }
      } else {
        // Moving to different parent
        // First, close gap in old parent
        await tx.document.updateMany({
          where: {
            parentId: document.parentId,
            position: {
              gt: document.position
            }
          },
          data: {
            position: {
              decrement: 1
            }
          }
        })

        // Then, make space in new parent
        await tx.document.updateMany({
          where: {
            parentId: finalParentId,
            position: {
              gte: newPosition!
            }
          },
          data: {
            position: {
              increment: 1
            }
          }
        })
      }

      // Update the document's path
      let newPath = document.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (finalParentId) {
        const parent = await tx.document.findUnique({
          where: { id: finalParentId }
        })
        if (parent && parent.path) {
          newPath = `${parent.path}/${newPath}`
        }
      }

      // Update the document
      const updated = await tx.document.update({
        where: { id },
        data: {
          parentId: finalParentId,
          position: newPosition!,
          path: newPath
        }
      })

      return updated
    })

    // Transform to our Document type
    const transformedDocument = {
      id: updatedDocument.id,
      title: updatedDocument.title,
      content: updatedDocument.content || undefined,
      type: updatedDocument.type,
      parentId: updatedDocument.parentId || undefined,
      path: updatedDocument.path || '',
      position: updatedDocument.position,
      createdAt: updatedDocument.createdAt,
      updatedAt: updatedDocument.updatedAt,
      createdBy: updatedDocument.createdBy
    }

    return {
      success: true,
      data: {
        document: transformedDocument
      },
      message: 'Document moved successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Move document error:', error)
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