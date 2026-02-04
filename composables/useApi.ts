import type { ApiResponse } from '~/types'

interface ApiOptions extends RequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  query?: Record<string, any>
  silent?: boolean // Don't show error notifications
  retries?: number // Number of retry attempts
}

// Extend Error type to include additional properties
interface ExtendedError extends Error {
  status?: number
  data?: any
  url?: string
  endpoint?: string
  method?: string
}

export const useApi = () => {
  const { logout } = useAuth()
  
  // Import error handler dynamically to avoid circular dependencies
  const getErrorHandler = () => {
    try {
      // Use dynamic import to avoid circular dependency
      return $fetch('/api/internal/error-handler').catch(() => ({
        handleApiError: (error: any) => console.error('API Error:', error),
        withRetry: async (fn: () => Promise<any>) => fn()
      }))
    } catch (e) {
      // Fallback if error handler is not available
      return {
        handleApiError: (error: any) => console.error('API Error:', error),
        withRetry: async (fn: () => Promise<any>) => fn()
      }
    }
  }

  const apiCall = async <T = any>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { silent = false, retries = 0, ...fetchOptions } = options
    
    const makeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await $fetch<ApiResponse<T>>(endpoint, {
          ...fetchOptions,
          onResponseError({ response, request }) {
            // Create error object with more context
            const error = new Error(response._data?.message || `HTTP ${response.status}`) as ExtendedError
            error.status = response.status
            error.data = response._data
            error.url = typeof request === 'string' ? request : request.url
            
            // Handle authentication errors immediately
            if (response.status === 401) {
              logout()
              error.message = 'Authentication required'
            }
            
            throw error
          },
          onRequestError({ error }) {
            // Network or request setup errors
            const networkError = new Error('Network request failed') as ExtendedError
            networkError.cause = error
            throw networkError
          }
        })

        return response
      } catch (error: any) {
        // Add context to the error
        const extendedError = error as ExtendedError
        extendedError.endpoint = endpoint
        extendedError.method = fetchOptions.method || 'GET'
        
        // Handle the error through our error handler
        if (!silent) {
          console.error('API Error:', extendedError)
        }
        
        throw extendedError
      }
    }

    // Use retry wrapper if retries are specified
    if (retries > 0) {
      let lastError: any
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await makeRequest()
        } catch (error) {
          lastError = error
          if (attempt === retries) {
            throw error
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
      throw lastError
    }

    return makeRequest()
  }

  const get = <T = any>(endpoint: string, query?: Record<string, any>, options?: Omit<ApiOptions, 'method' | 'query'>): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'GET', query, ...options })
  }

  const post = <T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'POST', body, ...options })
  }

  const put = <T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'PUT', body, ...options })
  }

  const del = <T = any>(endpoint: string, options?: Omit<ApiOptions, 'method'>): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'DELETE', ...options })
  }

  const patch = <T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'PATCH', body, ...options })
  }

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    patch
  }
}