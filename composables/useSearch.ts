import type { SearchRequest, SearchResponse, SearchResult } from '~/types'

export const useSearch = () => {
  const { get } = useApi()
  
  // Reactive state
  const searchQuery = ref('')
  const searchResults = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)
  const totalResults = ref(0)
  const currentPage = ref(1)
  const resultsPerPage = ref(20)

  // Computed properties
  const hasResults = computed(() => searchResults.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalResults.value / resultsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  // Search function
  const search = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      clearSearch()
      return
    }

    isSearching.value = true
    searchError.value = null
    currentPage.value = page

    try {
      const offset = (page - 1) * resultsPerPage.value
      const response = await get<SearchResponse>('/api/search', {
        query: query.trim(),
        limit: resultsPerPage.value,
        offset
      })

      if (response.success && response.data) {
        searchResults.value = response.data.results
        totalResults.value = response.data.total
        searchQuery.value = query
      } else {
        throw new Error(response.error || 'Search failed')
      }
    } catch (error: any) {
      console.error('Search error:', error)
      searchError.value = error.message || 'Search failed'
      searchResults.value = []
      totalResults.value = 0
    } finally {
      isSearching.value = false
    }
  }

  // Clear search results
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchError.value = null
    totalResults.value = 0
    currentPage.value = 1
  }

  // Navigate to next page
  const nextPage = async () => {
    if (hasNextPage.value && searchQuery.value) {
      await search(searchQuery.value, currentPage.value + 1)
    }
  }

  // Navigate to previous page
  const prevPage = async () => {
    if (hasPrevPage.value && searchQuery.value) {
      await search(searchQuery.value, currentPage.value - 1)
    }
  }

  // Navigate to specific page
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value && searchQuery.value) {
      await search(searchQuery.value, page)
    }
  }

  // Highlight search terms in text
  const highlightText = (text: string, query: string): string => {
    if (!text || !query) return text

    // Split query into individual terms
    const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
    
    if (terms.length === 0) return text

    // Create regex pattern for all terms
    const pattern = terms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
    ).join('|')
    
    const regex = new RegExp(`(${pattern})`, 'gi')
    
    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }

  // Get highlighted snippet for a search result
  const getHighlightedSnippet = (result: SearchResult, query: string): string => {
    // If the result already has a snippet from PostgreSQL ts_headline, use it
    if (result.snippet && result.snippet !== result.content) {
      return result.snippet
    }

    // Otherwise, create our own snippet with highlighting
    const content = result.content || result.title
    const maxLength = 200
    
    if (content.length <= maxLength) {
      return highlightText(content, query)
    }

    // Find the first occurrence of any search term
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
      // No terms found, return beginning of content
      const snippet = content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
      return highlightText(snippet, query)
    }

    // Create snippet around the first occurrence
    const start = Math.max(0, firstIndex - 50)
    const end = Math.min(content.length, start + maxLength)
    const snippet = (start > 0 ? '...' : '') + 
                   content.substring(start, end) + 
                   (end < content.length ? '...' : '')

    return highlightText(snippet, query)
  }

  // Navigate to a search result document
  const navigateToResult = (result: SearchResult) => {
    // Use Nuxt's navigation
    return navigateTo(`/documents/${result.id}`)
  }

  // Debounced search for real-time search
  const debouncedSearch = useDebounceFn(search, 300)

  // Watch for search query changes for real-time search
  const enableRealTimeSearch = ref(false)
  
  watch(searchQuery, (newQuery) => {
    if (enableRealTimeSearch.value && newQuery.trim()) {
      debouncedSearch(newQuery)
    } else if (!newQuery.trim()) {
      clearSearch()
    }
  })

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    totalResults,
    currentPage,
    resultsPerPage,
    enableRealTimeSearch,

    // Computed
    hasResults,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // Methods
    search,
    clearSearch,
    nextPage,
    prevPage,
    goToPage,
    highlightText,
    getHighlightedSnippet,
    navigateToResult,
    debouncedSearch
  }
}