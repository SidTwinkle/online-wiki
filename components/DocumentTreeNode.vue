<template>
  <div>
    <!-- Drop indicator for before position -->
    <div
      v-if="showDropIndicator && dropPosition === 'before'"
      class="h-0.5 bg-indigo-500 mx-3 rounded"
    />
    
    <!-- Node item -->
    <div
      :class="[
        'flex items-center group cursor-pointer transition-colors duration-150 relative px-3 py-1.5',
        isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50',
        `ml-${level * 4}`,
        isDragging ? 'opacity-50' : '',
        showDropIndicator && dropPosition === 'inside' ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : ''
      ]"
      draggable="true"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
      @dragstart="handleDragStart"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @dragend="handleDragEnd"
    >
      <!-- Expand/collapse button for folders -->
      <button
        v-if="node.type === 'folder'"
        @click.stop="toggleExpanded"
        class="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 mr-1"
      >
        <Icon
          :name="isExpanded ? 'heroicons:chevron-down' : 'heroicons:chevron-right'"
          class="h-3 w-3 text-gray-400"
        />
      </button>
      
      <!-- Spacer for documents -->
      <div v-else class="w-4 flex-shrink-0" />

      <!-- Drag handle (visible on hover) -->
      <div
        class="flex-shrink-0 mr-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        @mousedown.stop
      >
        <Icon name="heroicons:bars-3" class="h-3 w-3 text-gray-400" />
      </div>

      <!-- Icon -->
      <div class="flex-shrink-0 mr-2">
        <Icon
          :name="getNodeIcon(node)"
          :class="[
            'h-4 w-4',
            isSelected ? 'text-indigo-600' : getNodeIconColor(node)
          ]"
        />
      </div>

      <!-- Title -->
      <span
        :class="[
          'flex-1 text-sm font-medium truncate',
          isSelected ? 'text-indigo-700' : 'text-gray-900'
        ]"
        :title="node.title"
      >
        {{ node.title }}
      </span>
    </div>

    <!-- Drop indicator for after position -->
    <div
      v-if="showDropIndicator && dropPosition === 'after'"
      class="h-0.5 bg-indigo-500 mx-3 rounded"
    />

    <!-- Children (only shown when expanded) -->
    <div
      v-if="node.type === 'folder' && isExpanded && node.children.length > 0"
      class="ml-4"
    >
      <DocumentTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :level="level + 1"
        @select="$emit('select', $event)"
        @expand="$emit('expand', $event)"
        @collapse="$emit('collapse', $event)"
        @context-menu="$emit('context-menu', { nodeId: $event.nodeId, event: $event.event })"
        @drag-start="$emit('drag-start', $event)"
        @drag-over="$emit('drag-over', $event)"
        @drag-enter="$emit('drag-enter', $event)"
        @drag-leave="$emit('drag-leave', $event)"
        @drop="$emit('drop', $event)"
        @drag-end="$emit('drag-end', $event)"
        @reorder="$emit('reorder', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocumentTreeNode } from '~/types'

interface Props {
  node: DocumentTreeNode
  selectedId: string | null
  expandedIds: string[]
  level: number
}

interface Emits {
  (e: 'select', nodeId: string): void
  (e: 'expand', nodeId: string): void
  (e: 'collapse', nodeId: string): void
  (e: 'context-menu', payload: { nodeId: string; event: MouseEvent }): void
  (e: 'drag-start', payload: { nodeId: string; event: DragEvent }): void
  (e: 'drag-over', payload: { nodeId: string; event: DragEvent; position: 'before' | 'after' | 'inside' }): void
  (e: 'drag-enter', payload: { nodeId: string; event: DragEvent }): void
  (e: 'drag-leave', payload: { nodeId: string; event: DragEvent }): void
  (e: 'drop', payload: { nodeId: string; event: DragEvent; position: 'before' | 'after' | 'inside' }): void
  (e: 'drag-end', payload: { nodeId: string; event: DragEvent }): void
  (e: 'reorder', payload: { nodeId: string; targetId: string; position: 'before' | 'after' | 'inside' }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Inject drag state from parent
const dragState = inject('dragState', {
  draggedNodeId: ref(null),
  dragOverNodeId: ref(null),
  dragPosition: ref(null)
})

// Computed properties
const isSelected = computed(() => props.selectedId === props.node.id)
const isExpanded = computed(() => props.expandedIds.includes(props.node.id))
const isDragging = computed(() => dragState.draggedNodeId.value === props.node.id)
const showDropIndicator = computed(() => dragState.dragOverNodeId.value === props.node.id)
const dropPosition = computed(() => dragState.dragPosition.value)

// Methods
const handleClick = () => {
  emit('select', props.node.id)
  
  // Auto-expand folders when selected
  if (props.node.type === 'folder' && !isExpanded.value) {
    emit('expand', props.node.id)
  }
}

const toggleExpanded = () => {
  if (isExpanded.value) {
    emit('collapse', props.node.id)
  } else {
    emit('expand', props.node.id)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  emit('context-menu', { nodeId: props.node.id, event })
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent) => {
  emit('drag-start', { nodeId: props.node.id, event })
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // Calculate drop position based on mouse position
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  
  let position: 'before' | 'after' | 'inside'
  
  if (props.node.type === 'folder') {
    // For folders, allow inside drop in the middle third
    if (y < height * 0.25) {
      position = 'before'
    } else if (y > height * 0.75) {
      position = 'after'
    } else {
      position = 'inside'
    }
  } else {
    // For documents, only allow before/after
    position = y < height * 0.5 ? 'before' : 'after'
  }
  
  emit('drag-over', { nodeId: props.node.id, event, position })
}

const handleDragEnter = (event: DragEvent) => {
  emit('drag-enter', { nodeId: props.node.id, event })
}

const handleDragLeave = (event: DragEvent) => {
  emit('drag-leave', { nodeId: props.node.id, event })
}

const handleDrop = (event: DragEvent) => {
  // Calculate drop position again to ensure accuracy
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  
  let position: 'before' | 'after' | 'inside'
  
  if (props.node.type === 'folder') {
    if (y < height * 0.25) {
      position = 'before'
    } else if (y > height * 0.75) {
      position = 'after'
    } else {
      position = 'inside'
    }
  } else {
    position = y < height * 0.5 ? 'before' : 'after'
  }
  
  emit('drop', { nodeId: props.node.id, event, position })
}

const handleDragEnd = (event: DragEvent) => {
  emit('drag-end', { nodeId: props.node.id, event })
}

const getNodeIcon = (node: DocumentTreeNode): string => {
  if (node.type === 'folder') {
    return isExpanded.value ? 'heroicons:folder-open' : 'heroicons:folder'
  }
  return 'heroicons:document-text'
}

const getNodeIconColor = (node: DocumentTreeNode): string => {
  if (node.type === 'folder') {
    return 'text-blue-500'
  }
  return 'text-gray-400'
}
</script>