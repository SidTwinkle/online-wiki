import { databaseService } from '~/lib/database'
import type { SearchRequest, SearchResponse, ApiResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<SearchResponse>> => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const searchQuery = query.query as string
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    // Validate required parameters
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Search query is required and must be a non-empty string'
      })
    }

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Limit must be between 1 and 100'
      })
    }

    if (offset < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Offset must be non-negative'
      })
    }

    // Sanitize search query to prevent injection
    const sanitizedQuery = searchQuery.trim().replace(/[^\w\s\-_]/g, ' ')

    if (sanitizedQuery.length === 0) {
      return {
        success: true,
        data: {
          results: [],
          total: 0,
          query: searchQuery
        }
      }
    }

    // Perform search
    const searchResults = await databaseService.getSearchResults(sanitizedQuery, limit, offset)

    return {
      success: true,
      data: {
        results: searchResults.results,
        total: searchResults.total,
        query: searchQuery
      }
    }

  } catch (error: any) {
    console.error('Search API error:', error)

    // Handle known errors
    if (error.statusCode) {
      throw error
    }

    // Handle database errors
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database constraint violation'
      })
    }

    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Resource not found'
      })
    }

    // Handle PostgreSQL full-text search errors
    if (error.message?.includes('syntax error in tsquery')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid search query syntax'
      })
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during search'
    })
  }
})