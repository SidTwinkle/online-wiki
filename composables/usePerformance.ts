interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
}

export const usePerformance = () => {
  const metrics = ref<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  })

  // Measure page load time
  const measureLoadTime = () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.value.loadTime = navigation.loadEventEnd - navigation.fetchStart
      }
    }
  }

  // Measure render time
  const measureRenderTime = () => {
    if (typeof window !== 'undefined' && window.performance) {
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcp) {
        metrics.value.renderTime = fcp.startTime
      }
    }
  }

  // Measure interaction time (Time to Interactive approximation)
  const measureInteractionTime = () => {
    if (typeof window !== 'undefined') {
      const startTime = performance.now()
      
      // Wait for next tick to ensure DOM is ready
      nextTick(() => {
        const endTime = performance.now()
        metrics.value.interactionTime = endTime - startTime
      })
    }
  }

  // Preload critical resources
  const preloadResource = (href: string, as: 'script' | 'style' | 'font' | 'image' = 'script') => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (as === 'font') {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    }
  }

  // Prefetch resources for future navigation
  const prefetchResource = (href: string) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }
  }

  // Lazy load images
  const lazyLoadImages = () => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.classList.remove('lazy')
              imageObserver.unobserve(img)
            }
          }
        })
      })

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img)
      })

      return imageObserver
    }
  }

  // Optimize bundle loading
  const optimizeBundleLoading = () => {
    // Only preload resources in production mode
    if (process.env.NODE_ENV === 'production') {
      // Preload critical chunks
      preloadResource('/_nuxt/vendor-vue.js')
      preloadResource('/_nuxt/vendor-ui.js')
      
      // Prefetch non-critical chunks
      prefetchResource('/_nuxt/vendor-editor.js')
      prefetchResource('/_nuxt/vendor-utils.js')
    }
  }

  // Memory usage monitoring
  const getMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  }

  // Network information
  const getNetworkInfo = () => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  // Adaptive loading based on network conditions
  const shouldLoadHeavyResources = () => {
    const networkInfo = getNetworkInfo()
    if (!networkInfo) return true // Default to loading if no info available
    
    // Don't load heavy resources on slow connections or save-data mode
    return networkInfo.effectiveType !== 'slow-2g' && 
           networkInfo.effectiveType !== '2g' && 
           !networkInfo.saveData
  }

  // Initialize performance monitoring
  const initPerformanceMonitoring = () => {
    if (typeof window !== 'undefined') {
      // Measure initial metrics
      measureLoadTime()
      measureRenderTime()
      measureInteractionTime()
      
      // Optimize bundle loading
      optimizeBundleLoading()
      
      // Set up lazy loading
      lazyLoadImages()
      
      // Log performance metrics in development
      if (process.dev) {
        setTimeout(() => {
          console.log('Performance Metrics:', {
            ...metrics.value,
            memory: getMemoryUsage(),
            network: getNetworkInfo()
          })
        }, 2000)
      }
    }
  }

  // Resource hints for better performance
  const addResourceHints = () => {
    if (typeof document !== 'undefined') {
      // DNS prefetch for external resources
      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = '//fonts.googleapis.com'
      document.head.appendChild(dnsPrefetch)
      
      // Preconnect to critical origins
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://fonts.gstatic.com'
      preconnect.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect)
    }
  }

  return {
    metrics: readonly(metrics),
    measureLoadTime,
    measureRenderTime,
    measureInteractionTime,
    preloadResource,
    prefetchResource,
    lazyLoadImages,
    optimizeBundleLoading,
    getMemoryUsage,
    getNetworkInfo,
    shouldLoadHeavyResources,
    initPerformanceMonitoring,
    addResourceHints
  }
}