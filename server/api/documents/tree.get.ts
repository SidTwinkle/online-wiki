import { databaseService } from '~/lib/database'
import type { GetDocumentsResponse, ApiResponse, DocumentTreeNode } from '~/types'
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

    // Get query parameters
    const query = getQuery(event)
    const expandAll = query.expand === 'true'
    const rootOnly = query.rootOnly === 'true'

    // Get documents from database
    let documents
    if (rootOnly) {
      // Get only root level documents (no parent)
      documents = await databaseService.getDocumentsByParentId(null)
    } else {
      // Get all documents
      documents = await databaseService.getAllDocuments()
    }
    
    // Build tree structure
    const documentTree = buildDocumentTree(documents)

    // Set expansion state if requested
    if (expandAll) {
      setTreeExpansion(documentTree, true)
    }

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
    
    console.error('Get document tree error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper function to set expansion state recursively
function setTreeExpansion(nodes: DocumentTreeNode[], expanded: boolean): void {
  nodes.forEach(node => {
    node.expanded = expanded
    if (node.children.length > 0) {
      setTreeExpansion(node.children, expanded)
    }
  })
}