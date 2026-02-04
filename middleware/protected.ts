// Middleware for routes that require authentication
export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, checkAuth, isLoading } = useAuth()

  // Check authentication status if not already checked
  if (!isAuthenticated.value && !isLoading.value) {
    await checkAuth()
  }

  // Wait for auth check to complete
  if (isLoading.value) {
    // Show loading state while checking authentication
    return
  }

  // If user is not authenticated, redirect to login page with return URL
  if (!isAuthenticated.value) {
    const returnUrl = to.fullPath !== '/login' ? to.fullPath : '/'
    return navigateTo(`/login?redirect=${encodeURIComponent(returnUrl)}`)
  }
})