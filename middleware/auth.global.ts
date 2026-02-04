export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server-side rendering for initial page load
  if (process.server) return

  const { isAuthenticated, checkAuth, isLoading } = useAuth()

  // Always check authentication status on route changes
  // This ensures we catch session expiration
  if (!isLoading.value) {
    await checkAuth()
  }

  // Define public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // If trying to access login page while authenticated, redirect to home
  if (to.path === '/login' && isAuthenticated.value) {
    return navigateTo('/')
  }

  // If trying to access protected route while not authenticated, redirect to login
  if (!publicRoutes.includes(to.path) && !isAuthenticated.value) {
    // Store the intended destination for redirect after login
    const intendedPath = to.fullPath !== '/login' ? to.fullPath : '/'
    return navigateTo(`/login?redirect=${encodeURIComponent(intendedPath)}`)
  }
})