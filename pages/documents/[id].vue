<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Simple document header -->
    <div v-if="document" class="border-b border-gray-200 px-6 py-3 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-900 truncate">
          {{ document.title }}
        </h1>
        
        <!-- Save Status Indicator -->
        <div class="flex items-center space-x-2">
          <div v-if="saving" class="flex items-center space-x-2 text-blue-600">
            <div class="animate-spin h-4 w-4">
              <Icon name="heroicons:arrow-path" class="h-4 w-4" />
            </div>
            <span class="text-sm font-medium">保存中...</span>
          </div>
          <div v-else-if="saveSuccess" class="flex items-center space-x-2 text-green-600">
            <Icon name="heroicons:check-circle" class="h-4 w-4" />
            <span class="text-sm font-medium">已保存</span>
          </div>
          <div v-else-if="hasUnsavedChanges" class="flex items-center space-x-2 text-orange-600">
            <Icon name="heroicons:clock" class="h-4 w-4" />
            <span class="text-sm font-medium">未保存</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Document content - Full height editor -->
    <div class="flex-1 overflow-hidden">
      <div v-if="loading" class="h-full flex items-center justify-center">
        <div class="text-center">
          <LoadingSpinner />
          <p class="mt-2 text-sm text-gray-500">Loading document...</p>
        </div>
      </div>

      <div v-else-if="error" class="h-full flex items-center justify-center">
        <div class="text-center">
          <Icon name="heroicons:exclamation-triangle" class="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Failed to load document
          </h3>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <UButton @click="loadDocument" color="indigo">
            Try Again
          </UButton>
        </div>
      </div>

      <div v-else-if="document" class="h-full">
        <!-- Document content -->
        <div v-if="document.type === 'document'" class="h-full">
          <DocumentEditor
            ref="editorRef"
            :document="document"
            :readonly="false"
            @save="handleSave"
            @auto-save="handleAutoSave"
            @content-change="handleContentChange"
            class="h-full"
          />
        </div>

        <!-- Folder content -->
        <div v-else-if="document.type === 'folder'" class="h-full flex items-center justify-center">
          <div class="text-center">
            <Icon name="heroicons:folder-open" class="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              This is a folder
            </h3>
            <p class="text-gray-600">
              Use the sidebar to navigate to documents within this folder.
            </p>
          </div>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center">
          <Icon name="heroicons:document-text" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Document not found
          </h3>
          <p class="text-gray-600">
            The document you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Document } from '~/types'

// Stores
const documentStore = useDocumentStore()
const uiStore = useUIStore()

// Route
const route = useRoute()
const documentId = computed(() => route.params.id as string)

// Refs
const editorRef = ref()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const hasUnsavedChanges = ref(false)
const saveSuccess = ref(false)

// Computed
const document = computed(() => documentStore.selectedDocument)

// Methods
const loadDocument = async () => {
  if (!documentId.value) return
  
  loading.value = true
  error.value = null
  
  try {
    await documentStore.loadDocument(documentId.value)
    // 重置状态
    hasUnsavedChanges.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load document'
    console.error('Failed to load document:', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async (content?: string) => {
  if (!document.value || saving.value) return
  
  saving.value = true
  saveSuccess.value = false
  
  try {
    await documentStore.updateDocument(document.value.id, { 
      content: content || document.value.content 
    })
    hasUnsavedChanges.value = false
    saveSuccess.value = true
    
    // 3秒后隐藏保存成功状态
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err: any) {
    console.error('Failed to save document:', err)
    saveSuccess.value = false
  } finally {
    saving.value = false
  }
}

const handleAutoSave = async (content: string) => {
  if (!document.value || saving.value) return
  
  saving.value = true
  saveSuccess.value = false
  
  try {
    await documentStore.updateDocument(document.value.id, { content })
    hasUnsavedChanges.value = false
    saveSuccess.value = true
    
    // 2秒后隐藏保存成功状态
    setTimeout(() => {
      saveSuccess.value = false
    }, 2000)
  } catch (err: any) {
    console.error('Failed to auto-save document:', err)
    saveSuccess.value = false
  } finally {
    saving.value = false
  }
}

const handleContentChange = (content: string) => {
  hasUnsavedChanges.value = true
}

// Watch for route changes
watch(documentId, async (newId, oldId) => {
  loadDocument()
}, { immediate: true })

// Watch for document changes to update selected document
watch(() => documentStore.selectedDocumentId, (newId) => {
  if (newId !== documentId.value) {
    documentStore.selectDocument(documentId.value)
  }
}, { immediate: true })

// Set page title
watchEffect(() => {
  if (document.value) {
    useHead({
      title: `${document.value.title} - Knowledge Base`
    })
  }
})
</script>