export default defineNuxtPlugin(async () => {
  const { checkAuth, isAuthenticated } = useAuth()
  
  // Check authentication status on app initialization
  await checkAuth()
  
  // Set up periodic session validation (every 5 minutes)
  if (process.client) {
    setInterval(async () => {
      if (isAuthenticated.value) {
        try {
          await checkAuth()
        } catch (error) {
          console.error('Session validation failed:', error)
          // Session validation failed, user will be redirected by middleware
        }
      }
    }, 5 * 60 * 1000) // 5 minutes
  }
})