interface ImageOptions {
  lazy?: boolean
  placeholder?: string
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  sizes?: string
}

export const useOptimizedImage = () => {
  // Generate optimized image URL
  const getOptimizedImageUrl = (src: string, options: ImageOptions = {}) => {
    const {
      quality = 80,
      format = 'webp'
    } = options

    // Only run on client side
    if (typeof window === 'undefined') {
      return src // Return original URL on server side
    }

    // In a real implementation, you might use a service like Cloudinary or ImageKit
    // For now, we'll return the original URL with some query parameters
    const url = new URL(src, window.location.origin)
    url.searchParams.set('q', quality.toString())
    url.searchParams.set('f', format)
    
    return url.toString()
  }

  // Create responsive image srcset
  const createSrcSet = (src: string, widths: number[] = [320, 640, 768, 1024, 1280]) => {
    return widths
      .map(width => `${getOptimizedImageUrl(src)} ${width}w`)
      .join(', ')
  }

  // Lazy load image with intersection observer
  const lazyLoadImage = (img: HTMLImageElement, src: string, options: ImageOptions = {}) => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      img.src = src // Fallback to immediate loading on server side
      return null
    }

    const { placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==' } = options

    // Set placeholder
    img.src = placeholder
    img.classList.add('lazy')

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement
            
            // Create a new image to preload
            const newImg = new Image()
            
            newImg.onload = () => {
              target.src = getOptimizedImageUrl(src, options)
              target.classList.remove('lazy')
              target.classList.add('loaded')
              observer.unobserve(target)
            }
            
            newImg.onerror = () => {
              target.src = src // Fallback to original
              target.classList.remove('lazy')
              observer.unobserve(target)
            }
            
            newImg.src = getOptimizedImageUrl(src, options)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )

    observer.observe(img)
    return observer
  }

  // Preload critical images
  const preloadImage = (src: string, options: ImageOptions = {}) => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getOptimizedImageUrl(src, options)
    
    if (options.sizes) {
      link.setAttribute('imagesizes', options.sizes)
    }
    
    document.head.appendChild(link)
  }

  // Check if WebP is supported
  const supportsWebP = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  // Check if AVIF is supported
  const supportsAVIF = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  }

  // Get best supported format
  const getBestFormat = (): 'avif' | 'webp' | 'jpg' => {
    if (supportsAVIF()) return 'avif'
    if (supportsWebP()) return 'webp'
    return 'jpg'
  }

  // Create picture element with multiple sources
  const createPictureElement = (src: string, alt: string, options: ImageOptions = {}) => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Return a simple img element for server side
      const img = document?.createElement ? document.createElement('img') : null
      if (img) {
        img.src = src
        img.alt = alt
      }
      return img
    }

    const picture = document.createElement('picture')
    
    // Add AVIF source if supported
    if (supportsAVIF()) {
      const avifSource = document.createElement('source')
      avifSource.srcset = getOptimizedImageUrl(src, { ...options, format: 'avif' })
      avifSource.type = 'image/avif'
      picture.appendChild(avifSource)
    }
    
    // Add WebP source if supported
    if (supportsWebP()) {
      const webpSource = document.createElement('source')
      webpSource.srcset = getOptimizedImageUrl(src, { ...options, format: 'webp' })
      webpSource.type = 'image/webp'
      picture.appendChild(webpSource)
    }
    
    // Add fallback img
    const img = document.createElement('img')
    img.src = getOptimizedImageUrl(src, { ...options, format: 'jpg' })
    img.alt = alt
    img.loading = options.lazy ? 'lazy' : 'eager'
    
    if (options.sizes) {
      img.sizes = options.sizes
    }
    
    picture.appendChild(img)
    
    return picture
  }

  return {
    getOptimizedImageUrl,
    createSrcSet,
    lazyLoadImage,
    preloadImage,
    supportsWebP,
    supportsAVIF,
    getBestFormat,
    createPictureElement
  }
}