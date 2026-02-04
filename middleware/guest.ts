// Middleware for routes that should only be accessible to guests (non-authenticated users)
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, checkAuth, isLoading } = useAuth()

  // Check authentication status if not already checked
  if (!isAuthenticated.value && !isLoading.value) {
    await checkAuth()
  }

  // If user is authenticated, redirect to home page
  if (isAuthenticated.value) {
    return navigateTo('/')
  }
})