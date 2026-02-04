<template>
  <div class="search-container">
    <!-- Search Bar -->
    <div class="mb-6">
      <SearchBar
        v-model="searchQuery"
        :loading="isSearching"
        :placeholder="placeholder"
        :real-time-search="enableRealTimeSearch"
        @search="handleSearch"
        @clear="handleClear"
      />
    </div>

    <!-- Search Results -->
    <SearchResults
      :results="searchResults"
      :loading="isSearching"
      :query="searchQuery"
      :error="searchError"
      :total="totalResults"
      :current-page="currentPage"
      :total-pages="totalPages"
      :show-relevance-score="showRelevanceScore"
      @select-result="handleResultSelect"
      @page="handlePageChange"
      @sort="handleSort"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup lang="ts">
import type { SearchResult } from '~/types'

interface Props {
  placeholder?: string
  enableRealTimeSearch?: boolean
  showRelevanceScore?: boolean
  initialQuery?: string
}

interface Emits {
  (e: 'result-selected', result: SearchResult): void
  (e: 'search-performed', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search documents...',
  enableRealTimeSearch: false,
  showRelevanceScore: false,
  initialQuery: ''
})

const emit = defineEmits<Emits>()

// Use the search composable
const {
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  totalResults,
  currentPage,
  totalPages,
  search,
  clearSearch,
  goToPage,
  navigateToResult
} = useSearch()

// Initialize with initial query if provided
onMounted(() => {
  if (props.initialQuery) {
    searchQuery.value = props.initialQuery
    search(props.initialQuery)
  }
})

// Event handlers
const handleSearch = async (query: string) => {
  await search(query)
  emit('search-performed', query)
}

const handleClear = () => {
  clearSearch()
}

const handleResultSelect = async (result: SearchResult) => {
  emit('result-selected', result)
  
  // Navigate to the document
  try {
    await navigateToResult(result)
  } catch (error) {
    console.error('Navigation error:', error)
    try {
      const { handleApiError } = useErrorHandler()
      handleApiError(error, { component: 'Search', action: 'navigate_to_document' })
    } catch (e) {
      console.error('Error handler not available:', e)
    }
  }
}

const handlePageChange = async (page: number) => {
  await goToPage(page)
}

const handleSort = (sortBy: string) => {
  // For now, we'll just re-search with the current query
  // In a more advanced implementation, you could modify the search API
  // to support different sorting options
  if (searchQuery.value) {
    search(searchQuery.value)
  }
}

const handleRetry = () => {
  if (searchQuery.value) {
    search(searchQuery.value)
  }
}

// Expose search functionality to parent components
defineExpose({
  search: handleSearch,
  clear: handleClear,
  searchQuery: readonly(searchQuery),
  searchResults: readonly(searchResults),
  isSearching: readonly(isSearching)
})
</script>

<style scoped>
.search-container {
  @apply w-full max-w-4xl mx-auto;
}
</style>