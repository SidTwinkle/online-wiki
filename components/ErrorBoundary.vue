<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary">
      <div class="error-boundary-content">
        <div class="error-icon">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500" />
        </div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <UButton @click="retry" variant="solid" color="primary">
            Try Again
          </UButton>
          <UButton @click="reload" variant="outline" color="gray">
            Reload Page
          </UButton>
        </div>
        <details v-if="showDetails" class="error-details">
          <summary>Technical Details</summary>
          <pre class="error-stack">{{ errorDetails }}</pre>
        </details>
        <UButton 
          v-if="!showDetails" 
          @click="showDetails = true" 
          variant="ghost" 
          size="sm"
          class="mt-4"
        >
          Show Details
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fallback?: string
  showReload?: boolean
  onError?: (error: Error, errorInfo: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'An unexpected error occurred',
  showReload: true
})

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showDetails = ref(false)

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showDetails.value = false
}

const reload = () => {
  if (process.client && typeof window !== 'undefined') {
    window.location.reload()
  }
}

// Vue error handler
onErrorCaptured((error: Error, instance: any, errorInfo: string) => {
  console.error('ErrorBoundary caught error:', error)
  
  hasError.value = true
  errorMessage.value = error.message || props.fallback
  errorDetails.value = `${error.stack}\n\nComponent: ${instance?.$options.name || 'Unknown'}\nError Info: ${errorInfo}`
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(error, errorInfo)
  }
  
  // Prevent the error from propagating further
  return false
})

// Handle unhandled promise rejections
onMounted(() => {
  // Only run on client side
  if (process.client && typeof window !== 'undefined') {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      hasError.value = true
      errorMessage.value = event.reason?.message || 'An async operation failed'
      errorDetails.value = event.reason?.stack || String(event.reason)
      
      // Prevent default browser behavior
      event.preventDefault()
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    onUnmounted(() => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    })
  }
})
</script>

<style scoped>
.error-boundary {
  @apply min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900;
}

.error-boundary-content {
  @apply max-w-md w-full text-center space-y-4 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg;
}

.error-icon {
  @apply flex justify-center;
}

.error-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.error-message {
  @apply text-gray-600 dark:text-gray-300;
}

.error-actions {
  @apply flex gap-3 justify-center;
}

.error-details {
  @apply text-left mt-6;
}

.error-details summary {
  @apply cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white;
}

.error-stack {
  @apply mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40;
}
</style>