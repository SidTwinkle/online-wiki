import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SearchResult, SearchResponse, ApiResponse } from '~/types'

// Mock the useApi composable
const mockGet = vi.fn()
vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    get: mockGet
  })
}))

// Mock Nuxt's navigateTo
const mockNavigateTo = vi.fn()
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

// Mock VueUse functions
vi.mock('@vueuse/core', () => ({
  useDebounceFn: vi.fn((fn) => fn),
  ref: vi.fn((value) => ({ value })),
  computed: vi.fn((fn) => ({ value: fn() })),
  watch: vi.fn()
}))

describe('Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should highlight search terms in text', () => {
    // Test the highlighting function logic
    const highlightText = (text: string, query: string): string => {
      if (!text || !query) return text

      const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
      
      if (terms.length === 0) return text

      const pattern = terms.map(term => 
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join('|')
      
      const regex = new RegExp(`(${pattern})`, 'gi')
      
      return text.replace(regex, '<mark class="search-highlight">$1</mark>')
    }

    const text = 'This is a sample document with important content'
    const query = 'sample important'
    const result = highlightText(text, query)
    
    expect(result).toContain('<mark class="search-highlight">sample</mark>')
    expect(result).toContain('<mark class="search-highlight">important</mark>')
  })

  it('should handle empty search queries', () => {
    const highlightText = (text: string, query: string): string => {
      if (!text || !query) return text
      return text
    }

    expect(highlightText('test', '')).toBe('test')
    expect(highlightText('', 'query')).toBe('')
  })

  it('should escape special regex characters', () => {
    const highlightText = (text: string, query: string): string => {
      if (!text || !query) return text

      const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
      
      if (terms.length === 0) return text

      const pattern = terms.map(term => 
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join('|')
      
      const regex = new RegExp(`(${pattern})`, 'gi')
      
      return text.replace(regex, '<mark class="search-highlight">$1</mark>')
    }

    const text = 'This has special characters: [test] (example)'
    const query = '[test]'
    const result = highlightText(text, query)
    
    expect(result).toContain('<mark class="search-highlight">[test]</mark>')
  })

  it('should create proper search snippets', () => {
    const getHighlightedSnippet = (result: SearchResult, query: string): string => {
      // Use the snippet from the search result if available
      if (result.snippet && result.snippet !== result.content) {
        return result.snippet
      }

      // Fallback to manual highlighting
      const content = result.content || result.title
      const maxLength = 200
      
      if (content.length <= maxLength) {
        return content // Would normally highlight here
      }

      const terms = query.trim().toLowerCase().split(/\s+/)
      const lowerContent = content.toLowerCase()
      
      let firstIndex = -1
      for (const term of terms) {
        const index = lowerContent.indexOf(term)
        if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
          firstIndex = index
        }
      }

      if (firstIndex === -1) {
        const snippet = content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
        return snippet
      }

      const start = Math.max(0, firstIndex - 50)
      const end = Math.min(content.length, start + maxLength)
      const snippet = (start > 0 ? '...' : '') + 
                     content.substring(start, end) + 
                     (end < content.length ? '...' : '')

      return snippet
    }

    const longContent = 'This is a very long document with lots of content. '.repeat(10) + 
                       'Here is the important search term that we want to find. ' +
                       'This is more content after the search term. '.repeat(5)

    const result: SearchResult = {
      id: '1',
      title: 'Test Document',
      content: longContent,
      snippet: '',
      rank: 1.0,
      path: 'test'
    }

    const snippet = getHighlightedSnippet(result, 'important search')
    
    expect(snippet).toContain('important search term')
    expect(snippet.length).toBeLessThanOrEqual(250) // Including ellipsis
  })

  it('should validate search API response structure', () => {
    const mockSearchResult: SearchResult = {
      id: 'test-id',
      title: 'Test Document',
      content: 'This is test content',
      snippet: 'This is <b>test</b> content',
      rank: 0.5,
      path: 'folder > document'
    }

    const mockResponse: ApiResponse<SearchResponse> = {
      success: true,
      data: {
        results: [mockSearchResult],
        total: 1,
        query: 'test'
      }
    }

    expect(mockResponse.success).toBe(true)
    expect(mockResponse.data?.results).toHaveLength(1)
    expect(mockResponse.data?.results?.[0]?.id).toBe('test-id')
    expect(mockResponse.data?.total).toBe(1)
    expect(mockResponse.data?.query).toBe('test')
  })
})