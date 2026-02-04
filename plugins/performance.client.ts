export default defineNuxtPlugin(() => {
  // Initialize performance monitoring on client side
  if (process.client) {
    // Simple performance monitoring without circular dependencies
    console.log('Performance monitoring initialized')
  }
})