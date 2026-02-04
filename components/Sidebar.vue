<template>
  <div class="flex flex-col h-full">
    <!-- Sidebar header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center space-x-2">
        <Icon name="heroicons:document-text" class="h-6 w-6 text-indigo-600" />
        <span class="font-semibold text-gray-900">Documents</span>
      </div>
      
      <button
        @click="$emit('refresh-documents')"
        class="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        title="Refresh"
      >
        <Icon name="heroicons:arrow-path" class="h-4 w-4" />
      </button>
    </div>

    <!-- Action buttons -->
    <div class="p-4 border-b border-gray-200">
      <div class="space-y-2">
        <UButton
          @click="$emit('create-document')"
          color="indigo"
          variant="soft"
          size="sm"
          block
          icon="heroicons:plus"
        >
          New Document
        </UButton>
        <UButton
          @click="$emit('create-folder')"
          color="gray"
          variant="soft"
          size="sm"
          block
          icon="heroicons:folder-plus"
        >
          New Folder
        </UButton>
      </div>
    </div>

    <!-- Document tree -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4">
        <div class="space-y-2">
          <USkeleton class="h-6 w-full" />
          <USkeleton class="h-6 w-3/4" />
          <USkeleton class="h-6 w-1/2" />
        </div>
      </div>
      
      <DocumentTree
        v-else
        :nodes="documents"
        :selected-id="selectedDocumentId"
        :expanded-ids="expandedIds"
        @select="handleSelectDocument"
        @expand="handleExpandNode"
        @collapse="handleCollapseNode"
        @context-menu="handleContextMenu"
        @reorder="handleReorderDocument"
      />
    </div>

    <!-- Context menu -->
    <UContextMenu
      v-model="showContextMenu"
      :virtual-element="contextMenuTarget"
    >
      <div class="p-1">
        <UButton
          v-for="item in contextMenuItems"
          :key="item.label"
          :color="item.color || 'gray'"
          variant="ghost"
          size="sm"
          :icon="item.icon"
          block
          @click="item.click"
        >
          {{ item.label }}
        </UButton>
      </div>
    </UContextMenu>

    <!-- Rename Dialog -->
    <UModal v-model="showRenameDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Rename Item</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Name">
            <UInput
              v-model="renameValue"
              placeholder="Enter new name"
              @keyup.enter="handleRenameDocument"
              @keyup.escape="cancelRename"
            />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="cancelRename"
            >
              Cancel
            </UButton>
            <UButton
              color="indigo"
              :disabled="!renameValue.trim()"
              @click="handleRenameDocument"
            >
              Rename
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Dialog -->
    <UModal v-model="showDeleteDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Item</h3>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-600">
            Are you sure you want to delete this item? This action cannot be undone.
            {{ findNodeById(props.documents || [], deleteNodeId || '')?.type === 'folder' ? 
               'All contents of this folder will also be deleted.' : '' }}
          </p>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="cancelDelete"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              @click="handleDeleteDocument"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DocumentTreeNode } from '~/types'

interface Props {
  documents: DocumentTreeNode[]
  loading?: boolean
}

interface Emits {
  (e: 'select-document', documentId: string): void
  (e: 'create-document', parentId?: string): void
  (e: 'create-folder', parentId?: string): void
  (e: 'refresh-documents'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  documents: () => []
})

const emit = defineEmits<Emits>()

// State
const selectedDocumentId = ref<string | null>(null)
const expandedIds = ref<string[]>([])
const showContextMenu = ref(false)
const contextMenuTarget = ref<HTMLElement | null>(null)
const contextMenuNodeId = ref<string | null>(null)
const showRenameDialog = ref(false)
const renameNodeId = ref<string | null>(null)
const renameValue = ref('')
const showDeleteDialog = ref(false)
const deleteNodeId = ref<string | null>(null)

// Context menu items
const contextMenuItems = computed(() => {
  const node = contextMenuNodeId.value 
    ? findNodeById(props.documents || [], contextMenuNodeId.value)
    : null
  
  if (!node) return []
  
  const items = []
  
  if (node.type === 'folder') {
    items.push(
      {
        label: 'New Document',
        icon: 'heroicons:document-plus',
        click: () => {
          emit('create-document', node.id)
          showContextMenu.value = false
        }
      },
      {
        label: 'New Folder',
        icon: 'heroicons:folder-plus',
        click: () => {
          emit('create-folder', node.id)
          showContextMenu.value = false
        }
      }
    )
  }
  
  items.push(
    {
      label: 'Rename',
      icon: 'heroicons:pencil',
      click: () => {
        showRenameDialog.value = true
        renameNodeId.value = node.id
        renameValue.value = node.title
        showContextMenu.value = false
      }
    },
    {
      label: 'Delete',
      icon: 'heroicons:trash',
      color: 'red',
      click: () => {
        showDeleteDialog.value = true
        deleteNodeId.value = node.id
        showContextMenu.value = false
      }
    }
  )
  
  return items
})

// Methods
const handleSelectDocument = (documentId: string) => {
  selectedDocumentId.value = documentId
  emit('select-document', documentId)
}

const handleExpandNode = (nodeId: string) => {
  if (!expandedIds.value.includes(nodeId)) {
    expandedIds.value.push(nodeId)
  }
}

const handleCollapseNode = (nodeId: string) => {
  const index = expandedIds.value.indexOf(nodeId)
  if (index > -1) {
    expandedIds.value.splice(index, 1)
  }
}

const handleContextMenu = (nodeId: string, event: MouseEvent) => {
  contextMenuNodeId.value = nodeId
  contextMenuTarget.value = event.target as HTMLElement
  showContextMenu.value = true
}

const handleReorderDocument = async (payload: { nodeId: string; targetId: string; position: 'before' | 'after' | 'inside' }) => {
  try {
    const { nodeId, targetId, position } = payload
    
    // Find the target node to determine the new parent and position
    const targetNode = findNodeById(props.documents || [], targetId)
    if (!targetNode) {
      console.error('Target node not found:', targetId)
      return
    }
    
    let newParentId: string | null = null
    let newPosition: number = 0
    
    if (position === 'inside') {
      // Moving inside a folder
      if (targetNode.type !== 'folder') {
        console.error('Cannot move inside a document')
        return
      }
      newParentId = targetId
      newPosition = targetNode.children.length
    } else {
      // Moving before or after
      newParentId = targetNode.parentId || null
      
      // Find siblings to calculate position
      const siblings = newParentId 
        ? findNodeById(props.documents || [], newParentId)?.children || []
        : (props.documents || []).filter(node => !node.parentId)
      
      const targetIndex = siblings.findIndex(node => node.id === targetId)
      newPosition = position === 'before' ? targetIndex : targetIndex + 1
    }
    
    // Call the move API
    await $fetch(`/api/documents/${nodeId}/move`, {
      method: 'POST',
      body: {
        parentId: newParentId,
        position: newPosition
      }
    })
    
    // Refresh the document tree
    emit('refresh-documents')
    
  } catch (error) {
    console.error('Failed to reorder document:', error)
    try {
      const { handleApiError } = useErrorHandler()
      handleApiError(error, { component: 'Sidebar', action: 'reorder_document' })
    } catch (e) {
      console.error('Error handler not available:', e)
    }
  }
}

const handleRenameDocument = async () => {
  if (!renameNodeId.value || !renameValue.value.trim()) {
    return
  }
  
  try {
    await $fetch(`/api/documents/${renameNodeId.value}`, {
      method: 'PUT',
      body: {
        title: renameValue.value.trim()
      }
    })
    
    // Refresh the document tree
    emit('refresh-documents')
    
    // Reset state
    showRenameDialog.value = false
    renameNodeId.value = null
    renameValue.value = ''
    
  } catch (error) {
    console.error('Failed to rename document:', error)
    try {
      const { handleApiError } = useErrorHandler()
      handleApiError(error, { component: 'Sidebar', action: 'rename_document' })
    } catch (e) {
      console.error('Error handler not available:', e)
    }
  }
}

const handleDeleteDocument = async () => {
  if (!deleteNodeId.value) {
    return
  }
  
  try {
    await $fetch(`/api/documents/${deleteNodeId.value}`, {
      method: 'DELETE'
    })
    
    // If the deleted document was selected, clear selection
    if (selectedDocumentId.value === deleteNodeId.value) {
      selectedDocumentId.value = null
    }
    
    // Refresh the document tree
    emit('refresh-documents')
    
    // Reset state
    showDeleteDialog.value = false
    deleteNodeId.value = null
    
  } catch (error) {
    console.error('Failed to delete document:', error)
    try {
      const { handleApiError } = useErrorHandler()
      handleApiError(error, { component: 'Sidebar', action: 'delete_document' })
    } catch (e) {
      console.error('Error handler not available:', e)
    }
  }
}

const cancelRename = () => {
  showRenameDialog.value = false
  renameNodeId.value = null
  renameValue.value = ''
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  deleteNodeId.value = null
}

// Utility function to find node by ID
const findNodeById = (nodes: DocumentTreeNode[], id: string): DocumentTreeNode | null => {
  if (!nodes || !Array.isArray(nodes)) {
    return null
  }
  
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children && Array.isArray(node.children)) {
      const found = findNodeById(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

// Auto-expand folders with children on mount
onMounted(() => {
  const autoExpandFolders = (nodes: DocumentTreeNode[]) => {
    if (!nodes || !Array.isArray(nodes)) {
      return
    }
    
    nodes.forEach(node => {
      if (node.type === 'folder' && node.children && node.children.length > 0) {
        expandedIds.value.push(node.id)
        autoExpandFolders(node.children)
      }
    })
  }
  
  autoExpandFolders(props.documents || [])
})
</script>