// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  typescript: {
    strict: true,
    typeCheck: false // Disable type checking during build for now
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Private keys (only available on server-side)
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    // Public keys (exposed to client-side)
    public: {
      apiBase: '/api'
    }
  },
  // Nuxt 4 is now the default, no need for future.compatibilityVersion
  experimental: {
    // Enable new features
    typedPages: true
  },
  // Performance optimizations
  nitro: {
    // Enable compression
    compressPublicAssets: true
  },
  // App performance settings
  app: {
    // Enable page transitions
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  }
})