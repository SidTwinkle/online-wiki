import { defineStore } from 'pinia'

interface UIState {
  sidebarCollapsed: boolean
  showSearchResults: boolean
  isEditMode: boolean
  loading: {
    global: boolean
    documents: boolean
    search: boolean
    save: boolean
  }
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    timeout?: number
  }>
  modals: {
    createDocument: boolean
    createFolder: boolean
    deleteConfirm: boolean
    settings: boolean
  }
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarCollapsed: false,
    showSearchResults: false,
    isEditMode: false,
    loading: {
      global: false,
      documents: false,
      search: false,
      save: false
    },
    notifications: [],
    modals: {
      createDocument: false,
      createFolder: false,
      deleteConfirm: false,
      settings: false
    }
  }),

  getters: {
    // Check if any loading state is active
    isLoading: (state) => Object.values(state.loading).some(loading => loading),
    
    // Get notifications by type
    getNotificationsByType: (state) => (type: string) => {
      return state.notifications.filter(notification => notification.type === type)
    },

    // Check if any modal is open
    hasOpenModal: (state) => Object.values(state.modals).some(modal => modal)
  },

  actions: {
    // Sidebar actions
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },

    // Search results actions
    showSearch() {
      this.showSearchResults = true
    },

    hideSearch() {
      this.showSearchResults = false
    },

    toggleSearch() {
      this.showSearchResults = !this.showSearchResults
    },

    // Edit mode actions
    setEditMode(isEdit: boolean) {
      this.isEditMode = isEdit
    },

    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },

    // Loading state actions
    setLoading(key: keyof UIState['loading'], loading: boolean) {
      this.loading[key] = loading
    },

    setGlobalLoading(loading: boolean) {
      this.loading.global = loading
    },

    // Notification actions
    addNotification(notification: Omit<UIState['notifications'][0], 'id'>) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newNotification = {
        id,
        timeout: 5000, // Default 5 seconds
        ...notification
      }
      
      this.notifications.push(newNotification)
      
      // Auto-remove notification after timeout
      if (newNotification.timeout && newNotification.timeout > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.timeout)
      }
      
      return id
    },

    removeNotification(id: string) {
      const index = this.notifications.findIndex(notification => notification.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearNotifications() {
      this.notifications = []
    },

    // Success notification helper
    showSuccess(title: string, message?: string) {
      return this.addNotification({
        type: 'success',
        title,
        message
      })
    },

    // Error notification helper
    showError(title: string, message?: string) {
      return this.addNotification({
        type: 'error',
        title,
        message,
        timeout: 8000 // Longer timeout for errors
      })
    },

    // Warning notification helper
    showWarning(title: string, message?: string) {
      return this.addNotification({
        type: 'warning',
        title,
        message
      })
    },

    // Info notification helper
    showInfo(title: string, message?: string) {
      return this.addNotification({
        type: 'info',
        title,
        message
      })
    },

    // Modal actions
    openModal(modalName: keyof UIState['modals']) {
      this.modals[modalName] = true
    },

    closeModal(modalName: keyof UIState['modals']) {
      this.modals[modalName] = false
    },

    closeAllModals() {
      Object.keys(this.modals).forEach(key => {
        this.modals[key as keyof UIState['modals']] = false
      })
    },

    // Keyboard shortcut helpers
    handleKeyboardShortcut(event: KeyboardEvent) {
      // Only run on client side
      if (!process.client || typeof document === 'undefined') {
        return
      }
      
      const { metaKey, ctrlKey, shiftKey, key } = event
      const isModifier = metaKey || ctrlKey

      // Cmd/Ctrl + K - Focus search
      if (isModifier && key === 'k') {
        event.preventDefault()
        this.showSearch()
        // Focus search input
        nextTick(() => {
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        })
      }

      // Cmd/Ctrl + N - Create new document
      if (isModifier && key === 'n' && !shiftKey) {
        event.preventDefault()
        this.openModal('createDocument')
      }

      // Cmd/Ctrl + Shift + N - Create new folder
      if (isModifier && shiftKey && key === 'N') {
        event.preventDefault()
        this.openModal('createFolder')
      }

      // Escape - Close modals/search
      if (key === 'Escape') {
        if (this.showSearchResults) {
          this.hideSearch()
        } else if (this.hasOpenModal) {
          this.closeAllModals()
        }
      }

      // Cmd/Ctrl + E - Toggle edit mode
      if (isModifier && key === 'e') {
        event.preventDefault()
        this.toggleEditMode()
      }

      // Cmd/Ctrl + B - Toggle sidebar
      if (isModifier && key === 'b') {
        event.preventDefault()
        this.toggleSidebar()
      }
    },

    // Initialize keyboard shortcuts
    initKeyboardShortcuts() {
      // Only run on client side
      if (process.client && typeof window !== 'undefined' && window.document) {
        const handleKeydown = (event: KeyboardEvent) => {
          this.handleKeyboardShortcut(event)
        }

        window.document.addEventListener('keydown', handleKeydown)

        // Return cleanup function
        return () => {
          if (process.client && typeof window !== 'undefined' && window.document) {
            try {
              window.document.removeEventListener('keydown', handleKeydown)
            } catch (error) {
              console.warn('Failed to remove keydown listener in UI store:', error)
            }
          }
        }
      }
      
      // Return empty cleanup function for server side
      return () => {}
    }
  }
})