import type { ApiResponse } from '~/types'

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: Date
  url?: string
  userAgent?: string
}

interface ErrorReport {
  message: string
  stack?: string
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export const useErrorHandler = () => {
  // Import UI store dynamically to avoid circular dependencies
  const getUIStore = () => {
    try {
      // Simple fallback without circular dependency
      return {
        showError: (message: string) => {
          console.error(`Error: ${message}`)
          // In a real app, this would show a toast notification
        },
        showWarning: (message: string) => {
          console.warn(`Warning: ${message}`)
          // In a real app, this would show a toast notification
        }
      }
    } catch (e) {
      // Fallback if UI store is not available
      return {
        showError: (message: string) => console.error(`Error: ${message}`),
        showWarning: (message: string) => console.warn(`Warning: ${message}`)
      }
    }
  }
  
  const { user } = useAuth()

  // Error severity classification
  const classifyError = (error: Error | string): 'low' | 'medium' | 'high' | 'critical' => {
    const message = typeof error === 'string' ? error : error.message
    const lowerMessage = message.toLowerCase()

    // Critical errors
    if (lowerMessage.includes('database') || 
        lowerMessage.includes('server error') ||
        lowerMessage.includes('internal error')) {
      return 'critical'
    }

    // High severity errors
    if (lowerMessage.includes('authentication') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('network')) {
      return 'high'
    }

    // Medium severity errors
    if (lowerMessage.includes('validation') ||
        lowerMessage.includes('not found') ||
        lowerMessage.includes('timeout')) {
      return 'medium'
    }

    // Default to low severity
    return 'low'
  }

  // Create error context
  const createErrorContext = (additionalContext?: Partial<ErrorContext>): ErrorContext => {
    return {
      userId: user.value?.id,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      ...additionalContext
    }
  }

  // Handle API errors
  const handleApiError = (
    error: any, 
    context?: Partial<ErrorContext>,
    showNotification = true
  ): void => {
    console.error('API Error:', error)

    const errorMessage = error.data?.message || error.message || 'An unexpected error occurred'
    const severity = classifyError(errorMessage)
    
    const errorReport: ErrorReport = {
      message: errorMessage,
      stack: error.stack,
      context: createErrorContext(context),
      severity
    }

    // Log error for debugging
    logError(errorReport)

    // Show user notification based on severity
    if (showNotification) {
      const { showError, showWarning } = getUIStore()
      if (severity === 'critical' || severity === 'high') {
        showError(errorMessage)
      } else if (severity === 'medium') {
        showWarning(errorMessage)
      }
      // Don't show notifications for low severity errors
    }

    // Handle specific error types
    if (error.status === 401 || errorMessage.includes('authentication')) {
      // Authentication error - handled by useApi
      return
    }

    if (error.status === 403) {
      const { showError } = getUIStore()
      showError('You do not have permission to perform this action')
      return
    }

    if (error.status === 404) {
      const { showError } = getUIStore()
      showError('The requested resource was not found')
      return
    }

    if (error.status >= 500) {
      const { showError } = getUIStore()
      showError('A server error occurred. Please try again later.')
      return
    }
  }

  // Handle component errors
  const handleComponentError = (
    error: Error,
    component?: string,
    showNotification = true
  ): void => {
    console.error('Component Error:', error)

    const severity = classifyError(error)
    
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context: createErrorContext({ component }),
      severity
    }

    logError(errorReport)

    if (showNotification && (severity === 'critical' || severity === 'high')) {
      const { showError } = getUIStore()
      showError('A component error occurred. Please refresh the page.')
    }
  }

  // Handle async errors (promise rejections)
  const handleAsyncError = (
    error: any,
    context?: Partial<ErrorContext>,
    showNotification = true
  ): void => {
    console.error('Async Error:', error)

    const errorMessage = error.message || 'An async operation failed'
    const severity = classifyError(errorMessage)
    
    const errorReport: ErrorReport = {
      message: errorMessage,
      stack: error.stack,
      context: createErrorContext(context),
      severity
    }

    logError(errorReport)

    if (showNotification && (severity === 'critical' || severity === 'high')) {
      const { showError } = getUIStore()
      showError(errorMessage)
    }
  }

  // Handle network errors
  const handleNetworkError = (showNotification = true): void => {
    const errorReport: ErrorReport = {
      message: 'Network connection lost',
      context: createErrorContext({ action: 'network_check' }),
      severity: 'high'
    }

    logError(errorReport)

    if (showNotification) {
      const { showError } = getUIStore()
      showError('Please check your internet connection and try again.')
    }
  }

  // Log error (could be extended to send to external service)
  const logError = (errorReport: ErrorReport): void => {
    // For now, just log to console
    // In production, this could send to an error tracking service like Sentry
    console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`)
    console.error('Message:', errorReport.message)
    console.error('Context:', errorReport.context)
    if (errorReport.stack) {
      console.error('Stack:', errorReport.stack)
    }
    console.groupEnd()

    // Store in localStorage for debugging (limit to last 50 errors)
    if (typeof localStorage !== 'undefined') {
      try {
        const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
        storedErrors.unshift({
          ...errorReport,
          id: Date.now().toString()
        })
        
        // Keep only last 50 errors
        if (storedErrors.length > 50) {
          storedErrors.splice(50)
        }
        
        localStorage.setItem('app_errors', JSON.stringify(storedErrors))
      } catch (e) {
        console.warn('Failed to store error in localStorage:', e)
      }
    }
  }

  // Get stored errors for debugging
  const getStoredErrors = (): ErrorReport[] => {
    if (typeof localStorage === 'undefined') {
      return []
    }
    
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]')
    } catch (e) {
      console.warn('Failed to retrieve stored errors:', e)
      return []
    }
  }

  // Clear stored errors
  const clearStoredErrors = (): void => {
    if (typeof localStorage === 'undefined') {
      return
    }
    
    try {
      localStorage.removeItem('app_errors')
    } catch (e) {
      console.warn('Failed to clear stored errors:', e)
    }
  }

  // Retry wrapper for async operations
  const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context?: Partial<ErrorContext>
  ): Promise<T> => {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          handleApiError(error, { ...context, action: `retry_failed_${maxRetries}` })
          throw error
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError
  }

  return {
    handleApiError,
    handleComponentError,
    handleAsyncError,
    handleNetworkError,
    logError,
    getStoredErrors,
    clearStoredErrors,
    withRetry,
    classifyError
  }
}