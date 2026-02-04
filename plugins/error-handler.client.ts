export default defineNuxtPlugin(() => {
  // Import error handler dynamically to avoid circular dependencies
  const getErrorHandler = () => {
    try {
      // Simple fallback without circular dependency
      return {
        handleComponentError: (error: Error) => console.error('Component Error:', error),
        handleAsyncError: (error: any) => console.error('Async Error:', error),
        handleNetworkError: () => console.error('Network Error')
      }
    } catch (e) {
      return {
        handleComponentError: (error: Error) => console.error('Component Error:', error),
        handleAsyncError: (error: any) => console.error('Async Error:', error),
        handleNetworkError: () => console.error('Network Error')
      }
    }
  }

  // Global error handler for Vue errors
  const app = useNuxtApp()
  
  app.hook('vue:error', (error: unknown, instance: any, info: string) => {
    console.error('Global Vue error:', error)
    const { handleComponentError } = getErrorHandler()
    handleComponentError(error as Error)
  })

  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Handle 401 authentication errors
    if (event.reason?.statusCode === 401 || event.reason?.status === 401) {
      console.log('Authentication error detected, redirecting to login')
      // Clear auth state and redirect to login
      const { logout } = useAuth()
      logout().catch(() => {
        // If logout fails, just navigate to login
        navigateTo('/login')
      })
      event.preventDefault()
      return
    }
    
    const { handleAsyncError } = getErrorHandler()
    handleAsyncError(event.reason)
    
    // Prevent default browser behavior (console error)
    event.preventDefault()
  })

  // Global error handler for JavaScript errors
  window.addEventListener('error', (event: ErrorEvent) => {
    console.error('Global JavaScript error:', event.error)
    const { handleComponentError } = getErrorHandler()
    handleComponentError(event.error)
  })

  // Network status monitoring
  let isOnline = navigator.onLine

  window.addEventListener('online', () => {
    if (!isOnline) {
      console.log('Network connection restored')
      try {
        console.log('Connection restored')
      } catch (e) {
        console.log('Connection restored')
      }
    }
    isOnline = true
  })

  window.addEventListener('offline', () => {
    console.warn('Network connection lost')
    isOnline = false
    const { handleNetworkError } = getErrorHandler()
    handleNetworkError()
  })

  // Provide global error handler to the app
  return {
    provide: {
      errorHandler: {
        handleComponentError: (error: Error) => {
          const { handleComponentError } = getErrorHandler()
          handleComponentError(error)
        },
        handleAsyncError: (error: any) => {
          const { handleAsyncError } = getErrorHandler()
          handleAsyncError(error)
        },
        handleNetworkError: () => {
          const { handleNetworkError } = getErrorHandler()
          handleNetworkError()
        },
        isOnline: () => isOnline
      }
    }
  }
})