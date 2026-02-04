<template>
  <div v-if="showDebugger" class="fixed bottom-4 left-4 z-50">
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md">
      <div class="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 class="text-sm font-medium text-gray-900">Error Debugger</h3>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-500">{{ errors.length }} errors</span>
          <button
            @click="clearErrors"
            class="text-xs text-red-600 hover:text-red-800"
          >
            Clear
          </button>
          <button
            @click="showDebugger = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div class="max-h-64 overflow-y-auto">
        <div v-if="errors.length === 0" class="p-4 text-sm text-gray-500 text-center">
          No errors recorded
        </div>
        <div v-else>
          <div
            v-for="error in errors.slice(0, 10)"
            :key="error.id"
            class="p-3 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSeverityClass(error.severity)"
                  >
                    {{ error.severity }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(error.context.timestamp) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-900 truncate">
                  {{ error.message }}
                </p>
                <div v-if="error.context.component" class="mt-1 text-xs text-gray-500">
                  {{ error.context.component }}
                  <span v-if="error.context.action"> - {{ error.context.action }}</span>
                </div>
              </div>
              <button
                @click="toggleErrorDetails(error.id)"
                class="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                {{ expandedErrors.has(error.id) ? 'Hide' : 'Details' }}
              </button>
            </div>
            
            <div v-if="expandedErrors.has(error.id)" class="mt-2">
              <details class="text-xs">
                <summary class="cursor-pointer text-gray-600 hover:text-gray-800">
                  Stack Trace
                </summary>
                <pre class="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">{{ error.stack }}</pre>
              </details>
              <details class="text-xs mt-1">
                <summary class="cursor-pointer text-gray-600 hover:text-gray-800">
                  Context
                </summary>
                <pre class="mt-1 p-2 bg-gray-50 rounded text-xs">{{ JSON.stringify(error.context, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Toggle button -->
  <button
    v-if="!showDebugger && errors.length > 0"
    @click="showDebugger = true"
    class="fixed bottom-4 left-4 z-50 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
    :title="`${errors.length} errors recorded`"
  >
    <Icon name="heroicons:exclamation-triangle" class="h-4 w-4" />
    <span class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      {{ errors.length > 99 ? '99+' : errors.length }}
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true
})

const { getStoredErrors, clearStoredErrors } = useErrorHandler()

const showDebugger = ref(false)
const errors = ref<any[]>([])
const expandedErrors = ref(new Set<string>())

const loadErrors = () => {
  if (props.enabled) {
    errors.value = getStoredErrors()
  }
}

const clearErrors = () => {
  clearStoredErrors()
  errors.value = []
  expandedErrors.value.clear()
}

const toggleErrorDetails = (errorId: string) => {
  if (expandedErrors.value.has(errorId)) {
    expandedErrors.value.delete(errorId)
  } else {
    expandedErrors.value.add(errorId)
  }
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Load errors on mount and refresh periodically
onMounted(() => {
  loadErrors()
  
  // Refresh errors every 5 seconds
  const interval = setInterval(loadErrors, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// Watch for prop changes
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    loadErrors()
  } else {
    errors.value = []
    showDebugger.value = false
  }
})
</script>