<template>
  <div class="search-results bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-3">
          <Icon name="heroicons:arrow-path" class="h-8 w-8" />
        </div>
        <span class="text-gray-600 font-medium">Searching...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
        <Icon name="heroicons:exclamation-triangle" class="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-red-900 mb-2">Search Error</h3>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <button
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          @click="$emit('retry')"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="!loading && results.length === 0 && query" class="text-center py-12">
      <div class="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
        <Icon name="heroicons:document-magnifying-glass" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-medium text-gray-900 mb-3">No results found</h3>
        <p class="text-gray-600 mb-4">
          No documents found for "<span class="font-semibold text-gray-900">{{ query }}</span>".
        </p>
        <p class="text-sm text-gray-500">
          Try different keywords, check your spelling, or create a new document with this content.
        </p>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="results.length > 0" class="divide-y divide-gray-100">
      <!-- Results Header -->
      <div class="flex items-center p-6 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <Icon name="heroicons:magnifying-glass" class="h-5 w-5 text-indigo-600" />
          <div class="text-sm text-gray-700">
            <span class="font-semibold text-indigo-600">{{ total.toLocaleString() }}</span>
            {{ total === 1 ? 'result' : 'results' }}
            for "<span class="font-semibold text-gray-900">{{ query }}</span>"
          </div>
        </div>
      </div>

      <!-- Result Items -->
      <div class="divide-y divide-gray-100 overflow-y-auto" style="max-height: calc(24rem - 4rem);">
        <div
          v-for="result in results"
          :key="result.id"
          class="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
          @click="handleResultClick(result)"
        >
          <!-- Result Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 
                class="text-lg font-semibold text-indigo-600 hover:text-indigo-800 line-clamp-2 group-hover:underline transition-colors"
                v-html="highlightText(result.title, query)"
              ></h3>
              <div class="flex items-center text-sm text-gray-500 mt-1 space-x-2">
                <Icon name="heroicons:folder" class="h-4 w-4" />
                <span class="truncate">{{ result.path || 'Root' }}</span>
                <span class="text-gray-300">•</span>
                <Icon name="heroicons:document-text" class="h-4 w-4" />
                <span>Document</span>
              </div>
            </div>
          </div>

          <!-- Result Snippet -->
          <div 
            class="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3"
            v-html="getOptimalSnippet(result, query)"
          ></div>

          <!-- Result Actions -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span class="flex items-center space-x-1">
                <Icon name="heroicons:clock" class="h-3 w-3" />
                <span>{{ formatDate(result.id) }}</span>
              </span>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                @click.stop="handleResultClick(result)"
              >
                <span>Open</span>
                <Icon name="heroicons:arrow-right" class="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchResult } from '~/types'

interface Props {
  results: SearchResult[]
  loading?: boolean
  query?: string
  error?: string | null
  total?: number
  currentPage?: number
  totalPages?: number
  showRelevanceScore?: boolean
}

interface Emits {
  (e: 'select-result', result: SearchResult): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  results: () => [],
  loading: false,
  query: '',
  error: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  showRelevanceScore: false
})

const emit = defineEmits<Emits>()

// Use search highlighting composable
const { getOptimalSnippet, highlightText } = useSearchHighlight()

// Methods
const handleResultClick = (result: SearchResult) => {
  emit('select-result', result)
}

const formatDate = (id: string): string => {
  // This is a placeholder - in a real app, you'd format the actual date
  // For now, just return a generic "Recently modified"
  return 'Recently modified'
}
</script>

<style scoped>
.search-highlight {
  @apply bg-yellow-200 px-1 rounded font-semibold;
  background: linear-gradient(120deg, #fef3c7 0%, #fde047 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  font-weight: 700;
  color: #92400e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Smooth transitions for interactive elements */
.search-results button,
.search-results select {
  transition: all 0.2s ease-in-out;
}

/* Enhanced hover effects */
.group:hover .group-hover\:underline {
  text-decoration: underline;
}

/* Custom scrollbar for better aesthetics */
.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>