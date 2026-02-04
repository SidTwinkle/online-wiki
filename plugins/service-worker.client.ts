export default defineNuxtPlugin(() => {
  // Register service worker for caching and offline functionality
  // Only in production mode to avoid development issues
  if (process.client && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('New service worker available')
                
                // You could show a notification to the user here
                // asking if they want to reload to get the latest version
              }
            })
          }
        })
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from service worker:', event.data)
        })
        
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    })
    
    // Handle online/offline status
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      document.body.classList.toggle('offline', !isOnline)
      
      if (isOnline) {
        console.log('Back online')
      } else {
        console.log('Gone offline')
      }
    }
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Initial status check
    updateOnlineStatus()
  }
})