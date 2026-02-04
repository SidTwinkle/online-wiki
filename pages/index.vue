<template>
  <div class="h-full flex items-center justify-center bg-white">
    <!-- Welcome section for authenticated users -->
    <div v-if="isAuthenticated" class="text-center max-w-2xl px-8">
      <div class="mb-8">
        <Icon name="heroicons:document-text" class="h-20 w-20 text-indigo-600 mx-auto mb-6" />
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your Knowledge Base
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          Your personal knowledge management system is ready. Use the sidebar to create documents, organize them in folders, and search through your content.
        </p>
      </div>

      <!-- Quick stats if documents exist -->
      <div v-if="documentStore.hasDocuments" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-gray-50 rounded-lg p-6">
          <div class="flex items-center justify-center">
            <div class="text-center">
              <Icon name="heroicons:document-text" class="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ documentStore.totalDocuments }}</p>
              <p class="text-sm text-gray-500">Documents</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-6">
          <div class="flex items-center justify-center">
            <div class="text-center">
              <Icon name="heroicons:folder" class="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ documentStore.totalFolders }}</p>
              <p class="text-sm text-gray-500">Folders</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-6">
          <div class="flex items-center justify-center">
            <div class="text-center">
              <Icon name="heroicons:magnifying-glass" class="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p class="text-sm font-bold text-gray-900">Full-text</p>
              <p class="text-sm text-gray-500">Search Ready</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Getting started tips -->
      <div v-else class="bg-gray-50 rounded-lg p-8 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Get Started</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div class="flex items-start space-x-3">
            <Icon name="heroicons:plus" class="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Create Documents</p>
              <p class="text-sm text-gray-600">Click "New Document" in the sidebar to start writing</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <Icon name="heroicons:folder-plus" class="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Organize with Folders</p>
              <p class="text-sm text-gray-600">Create folders to organize your documents</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <Icon name="heroicons:magnifying-glass" class="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Search Everything</p>
              <p class="text-sm text-gray-600">Use the search bar to find content across all documents</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <Icon name="heroicons:pencil" class="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Rich Markdown Editor</p>
              <p class="text-sm text-gray-600">Write with a powerful WYSIWYG markdown editor</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Keyboard shortcuts -->
      <div class="text-center">
        <p class="text-sm text-gray-500 mb-2">Keyboard Shortcuts:</p>
        <div class="flex justify-center space-x-4 text-xs">
          <span class="bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + K</span>
          <span class="text-gray-400">Search</span>
          <span class="bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + N</span>
          <span class="text-gray-400">New Document</span>
        </div>
      </div>
    </div>

    <!-- Not authenticated -->
    <div v-else class="text-center max-w-md px-8">
      <div class="mb-8">
        <Icon name="heroicons:lock-closed" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Access Your Knowledge Base
        </h2>
        <p class="text-gray-600 mb-6">
          Please log in to access your personal knowledge management system.
        </p>
      </div>
      
      <NuxtLink
        to="/login"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign In
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Stores
const documentStore = useDocumentStore()

// Composables
const { isAuthenticated } = useAuth()

// 确保数据已加载
onMounted(async () => {
  if (isAuthenticated.value && (!documentStore.documents || documentStore.documents.length === 0)) {
    await Promise.all([
      documentStore.loadDocuments(),
      documentStore.loadDocumentTree()
    ])
  }
})

// Set page title
useHead({
  title: 'Knowledge Base - Your Personal Knowledge Management System'
})
</script>