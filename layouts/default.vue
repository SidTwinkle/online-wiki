<template>
  <ErrorBoundary>
    <div class="h-screen flex overflow-hidden bg-gray-50">
      <!-- Left Sidebar -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <!-- Sidebar Header with User Info -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-lg font-semibold text-gray-900">
              Knowledge Base
            </h1>
            <button
              @click="uiStore.toggleSidebar"
              class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <Icon name="heroicons:bars-3" class="h-5 w-5" />
            </button>
          </div>

          <!-- User Info -->
          <div v-if="isAuthenticated" class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <UAvatar
                :alt="user?.username"
                size="sm"
              />
              <span class="text-sm font-medium text-gray-700">
                {{ user?.username }}
              </span>
            </div>
            <UDropdown
              :items="userMenuItems"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                :loading="authLoading"
                trailing-icon="heroicons:chevron-down-20-solid"
              />
            </UDropdown>
          </div>
          <div v-else class="flex items-center justify-center mb-4">
            <NuxtLink
              to="/login"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </NuxtLink>
          </div>

          <!-- Search Bar -->
          <div class="mb-4">
            <SearchBar
              placeholder="Search documents..."
              :loading="documentStore.searchLoading"
              @search="handleSearch"
              @clear="handleClearSearch"
            />
          </div>
        </div>

        <!-- Document Tree -->
        <div class="flex-1 overflow-y-auto">
          <Sidebar
            :collapsed="false"
            :documents="documentStore.documentTree"
            :loading="documentStore.loading"
            @select-document="handleSelectDocument"
            @create-document="handleCreateDocument"
            @create-folder="handleCreateFolder"
            @refresh-documents="handleRefreshDocuments"
            class="border-none"
          />
        </div>
      </div>

      <!-- Main content area - Editor takes full right side -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <slot />
      </div>

      <!-- Search results overlay -->
      <div
        v-if="uiStore.showSearchResults"
        class="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
        @click="handleClearSearch"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden"
          @click.stop
        >
          <SearchResults
            :results="documentStore.searchResults"
            :loading="documentStore.searchLoading"
            :query="documentStore.searchQuery"
            :total="documentStore.searchTotal"
            @select-result="handleSelectSearchResult"
          />
        </div>
      </div>

      <!-- Global notifications -->
      <div class="fixed top-4 right-4 z-50 space-y-2">
        <div
          v-for="notification in uiStore.notifications"
          :key="notification.id"
          :class="[
            'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
            {
              'border-l-4 border-green-400': notification.type === 'success',
              'border-l-4 border-red-400': notification.type === 'error',
              'border-l-4 border-yellow-400': notification.type === 'warning',
              'border-l-4 border-blue-400': notification.type === 'info'
            }
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <Icon
                  :name="getNotificationIcon(notification.type)"
                  :class="[
                    'h-5 w-5',
                    {
                      'text-green-400': notification.type === 'success',
                      'text-red-400': notification.type === 'error',
                      'text-yellow-400': notification.type === 'warning',
                      'text-blue-400': notification.type === 'info'
                    }
                  ]"
                />
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                <p v-if="notification.message" class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="uiStore.removeNotification(notification.id)"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Icon name="heroicons:x-mark" class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error debugger (development only) -->
      <ErrorDebugger v-if="isDevelopment" :enabled="isDevelopment" />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import type { DocumentTreeNode, SearchResult } from '~/types'

// Stores
const documentStore = useDocumentStore()
const uiStore = useUIStore()

// Composables
const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth()

// Development mode check
const isDevelopment = computed(() => process.dev)

// User menu items
const userMenuItems = computed(() => [
  [{
    label: 'Profile',
    icon: 'heroicons:user-20-solid',
    click: () => {
      uiStore.showInfo('Profile', 'Profile page coming soon!')
    }
  }],
  [{
    label: 'Settings',
    icon: 'heroicons:cog-6-tooth-20-solid',
    click: () => {
      uiStore.showInfo('Settings', 'Settings page coming soon!')
    }
  }],
  [{
    label: 'Sign out',
    icon: 'heroicons:arrow-right-on-rectangle-20-solid',
    click: handleLogout
  }]
])

// Methods
const handleSelectDocument = (documentId: string) => {
  documentStore.selectDocument(documentId)
  navigateTo(`/documents/${documentId}`)
}

const handleCreateDocument = async (parentId?: string) => {
  try {
    uiStore.setLoading('documents', true)
    const document = await documentStore.createDocument({
      title: 'Untitled Document',
      content: '# Untitled Document\n\nStart writing your content here...',
      type: 'document',
      parentId
    })
    
    uiStore.showSuccess('Document created', `"${document.title}" has been created successfully.`)
    await navigateTo(`/documents/${document.id}`)
  } catch (error: any) {
    uiStore.showError('Failed to create document', error.message)
  } finally {
    uiStore.setLoading('documents', false)
  }
}

const handleCreateFolder = async (parentId?: string) => {
  try {
    uiStore.setLoading('documents', true)
    const folder = await documentStore.createDocument({
      title: 'New Folder',
      type: 'folder',
      parentId
    })
    
    uiStore.showSuccess('Folder created', `"${folder.title}" has been created successfully.`)
  } catch (error: any) {
    uiStore.showError('Failed to create folder', error.message)
  } finally {
    uiStore.setLoading('documents', false)
  }
}

const handleRefreshDocuments = async () => {
  try {
    await Promise.all([
      documentStore.loadDocuments(),
      documentStore.loadDocumentTree()
    ])
  } catch (error: any) {
    console.error('Failed to refresh documents:', error)
  }
}

const handleSearch = async (query: string) => {
  if (!query.trim()) {
    uiStore.hideSearch()
    return
  }
  
  await documentStore.searchDocuments(query)
  uiStore.showSearch()
}

const handleClearSearch = () => {
  documentStore.clearSearch()
  uiStore.hideSearch()
}

const handleSelectSearchResult = (result: SearchResult) => {
  handleClearSearch()
  handleSelectDocument(result.id)
}

const handleLogout = async () => {
  try {
    await logout()
    uiStore.showSuccess('Logged out', 'You have been logged out successfully.')
    await navigateTo('/login')
  } catch (error: any) {
    uiStore.showError('Logout failed', error.message)
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return 'heroicons:check-circle'
    case 'error': return 'heroicons:x-circle'
    case 'warning': return 'heroicons:exclamation-triangle'
    case 'info': return 'heroicons:information-circle'
    default: return 'heroicons:information-circle'
  }
}

// Initialize performance monitoring and keyboard shortcuts
let cleanupKeyboardShortcuts: (() => void) | null = null
const { initPerformanceMonitoring, shouldLoadHeavyResources } = usePerformance()

onMounted(async () => {
  // Initialize performance monitoring
  initPerformanceMonitoring()
  
  // Initialize keyboard shortcuts
  cleanupKeyboardShortcuts = uiStore.initKeyboardShortcuts()
  
  // Conditionally load heavy resources based on network conditions
  if (shouldLoadHeavyResources() && process.env.NODE_ENV === 'production') {
    // Preload editor resources if network conditions are good
    const { preloadResource } = usePerformance()
    preloadResource('/_nuxt/vendor-editor.js')
  }
})

onUnmounted(() => {
  if (cleanupKeyboardShortcuts && process.client && typeof window !== 'undefined') {
    try {
      cleanupKeyboardShortcuts()
    } catch (error) {
      console.warn('Failed to cleanup keyboard shortcuts:', error)
    }
  }
})

// Watch for authentication changes and load data
watch(isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await Promise.all([
      documentStore.loadDocuments(),
      documentStore.loadDocumentTree()
    ])
  } else {
    // Clear stores when logged out
    documentStore.$reset()
  }
}, { immediate: true })
</script>