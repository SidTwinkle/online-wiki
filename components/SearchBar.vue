<template>
  <div class="relative w-full max-w-md">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon 
          name="heroicons:magnifying-glass" 
          class="h-5 w-5 text-gray-400" 
          aria-hidden="true" 
        />
      </div>
      <input
        v-model="localQuery"
        type="text"
        :placeholder="placeholder"
        :disabled="loading"
        class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        @keydown.enter="handleSearch"
        @keydown.escape="handleClear"
      />
      
      <!-- Clear Button -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          v-if="localQuery && !loading"
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          @click="handleClear"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" aria-hidden="true" />
        </button>
        
        <!-- Loading Spinner -->
        <div
          v-else-if="loading"
          class="animate-spin h-5 w-5 text-gray-400"
        >
          <Icon name="heroicons:arrow-path" class="h-5 w-5" />
        </div>
      </div>
    </div>

    <!-- Search Suggestions/Quick Actions -->
    <div
      v-if="showSuggestions && localQuery.length > 0"
      class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
    >
      <div class="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide">
        Press Enter to search
      </div>
      <button
        class="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
        @click="handleSearch"
      >
        <div class="flex items-center">
          <Icon name="heroicons:magnifying-glass" class="h-4 w-4 text-gray-400 mr-2" />
          <span>Search for "<span class="font-medium">{{ localQuery }}</span>"</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
  loading?: boolean
  modelValue?: string
  showSuggestions?: boolean
  realTimeSearch?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search documents...',
  loading: false,
  modelValue: '',
  showSuggestions: true,
  realTimeSearch: false
})

const emit = defineEmits<Emits>()

// Local reactive query for immediate UI updates
const localQuery = ref(props.modelValue)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  localQuery.value = newValue
})

// Watch for local changes and emit updates
watch(localQuery, (newValue) => {
  emit('update:modelValue', newValue)
  
  // If real-time search is enabled, emit search events
  if (props.realTimeSearch && newValue.trim()) {
    debouncedSearch(newValue.trim())
  } else if (!newValue.trim()) {
    emit('clear')
  }
})

// Debounced search for real-time functionality
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query)
}, 300)

// Handle search action
const handleSearch = () => {
  const query = localQuery.value.trim()
  if (query) {
    emit('search', query)
  }
}

// Handle clear action
const handleClear = () => {
  localQuery.value = ''
  emit('clear')
}

// Close suggestions when clicking outside
const showSuggestions = ref(false)

onMounted(() => {
  // Show suggestions when input is focused
  const input = document.querySelector('input[type="text"]')
  if (input) {
    input.addEventListener('focus', () => {
      showSuggestions.value = true
    })
    
    input.addEventListener('blur', () => {
      // Delay hiding to allow clicking on suggestions
      setTimeout(() => {
        showSuggestions.value = false
      }, 200)
    })
  }
})
</script>

<style scoped>
.search-highlight {
  @apply bg-yellow-200 px-1 rounded;
  background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  padding: 2px 4px;
  font-weight: 600;
  color: #854d0e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}
</style>