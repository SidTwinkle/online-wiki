import type { User, LoginRequest, ApiResponse, LoginResponse, LogoutResponse, MeResponse } from '~/types'

interface AuthState {
  user: Ref<User | null>
  isAuthenticated: ComputedRef<boolean>
  isLoading: Ref<boolean>
}

export const useAuth = (): AuthState & {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshAuth: () => Promise<void>
} => {
  const user = useState<User | null>('auth.user', () => null)
  const isLoading = useState<boolean>('auth.loading', () => false)
  
  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials: LoginRequest): Promise<void> => {
    isLoading.value = true
    
    try {
      const response = await $fetch<ApiResponse<LoginResponse>>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed')
      }

      user.value = response.data.user
      
      // Force refresh auth state after successful login
      await nextTick()
      
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.data?.message || error.message || 'Login failed')
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    
    try {
      await $fetch<ApiResponse<LogoutResponse>>('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with logout even if API call fails
    } finally {
      user.value = null
      isLoading.value = false
      
      // Navigate to login page
      await navigateTo('/login')
    }
  }

  const checkAuth = async (): Promise<void> => {
    if (isLoading.value) return
    
    isLoading.value = true
    
    try {
      const response = await $fetch<ApiResponse<MeResponse>>('/api/auth/me')
      
      if (response.success && response.data?.user) {
        user.value = response.data.user
      } else {
        // Session expired or invalid
        if (user.value) {
          // User was previously authenticated but session is now invalid
          console.log('Session expired, redirecting to login')
        }
        user.value = null
      }
    } catch (error) {
      console.error('Auth check error:', error)
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  const refreshAuth = async (): Promise<void> => {
    await checkAuth()
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    login,
    logout,
    checkAuth,
    refreshAuth
  }
}