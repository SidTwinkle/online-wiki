<template>
  <div class="py-2">
    <DocumentTreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected-id="selectedId"
      :expanded-ids="expandedIds"
      :level="0"
      @select="$emit('select', $event)"
      @expand="$emit('expand', $event)"
      @collapse="$emit('collapse', $event)"
      @context-menu="$emit('context-menu', $event.nodeId, $event.event)"
      @drag-start="handleDragStart"
      @drag-over="handleDragOver"
      @drag-enter="handleDragEnter"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
      @drag-end="handleDragEnd"
      @reorder="$emit('reorder', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { DocumentTreeNode } from '~/types'

interface Props {
  nodes: DocumentTreeNode[]
  selectedId: string | null
  expandedIds: string[]
}

interface Emits {
  (e: 'select', nodeId: string): void
  (e: 'expand', nodeId: string): void
  (e: 'collapse', nodeId: string): void
  (e: 'context-menu', nodeId: string, event: MouseEvent): void
  (e: 'reorder', payload: { nodeId: string; targetId: string; position: 'before' | 'after' | 'inside' }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Drag and drop state
const draggedNodeId = ref<string | null>(null)
const dragOverNodeId = ref<string | null>(null)
const dragPosition = ref<'before' | 'after' | 'inside' | null>(null)

// Drag and drop handlers
const handleDragStart = (payload: { nodeId: string; event: DragEvent }) => {
  draggedNodeId.value = payload.nodeId
  if (payload.event.dataTransfer) {
    payload.event.dataTransfer.effectAllowed = 'move'
    payload.event.dataTransfer.setData('text/plain', payload.nodeId)
  }
}

const handleDragOver = (payload: { nodeId: string; event: DragEvent; position: 'before' | 'after' | 'inside' }) => {
  payload.event.preventDefault()
  if (payload.event.dataTransfer) {
    payload.event.dataTransfer.dropEffect = 'move'
  }
  
  // Don't allow dropping on itself or its children
  if (draggedNodeId.value === payload.nodeId || isDescendant(payload.nodeId, draggedNodeId.value)) {
    return
  }
  
  dragOverNodeId.value = payload.nodeId
  dragPosition.value = payload.position
}

const handleDragEnter = (payload: { nodeId: string; event: DragEvent }) => {
  payload.event.preventDefault()
}

const handleDragLeave = (payload: { nodeId: string; event: DragEvent }) => {
  // Only clear if we're leaving the entire node area
  const rect = (payload.event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = payload.event.clientX
  const y = payload.event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    if (dragOverNodeId.value === payload.nodeId) {
      dragOverNodeId.value = null
      dragPosition.value = null
    }
  }
}

const handleDrop = (payload: { nodeId: string; event: DragEvent; position: 'before' | 'after' | 'inside' }) => {
  payload.event.preventDefault()
  
  if (!draggedNodeId.value || draggedNodeId.value === payload.nodeId) {
    return
  }
  
  // Don't allow dropping on descendants
  if (isDescendant(payload.nodeId, draggedNodeId.value)) {
    return
  }
  
  emit('reorder', {
    nodeId: draggedNodeId.value,
    targetId: payload.nodeId,
    position: payload.position
  })
  
  // Reset drag state
  draggedNodeId.value = null
  dragOverNodeId.value = null
  dragPosition.value = null
}

const handleDragEnd = (payload: { nodeId: string; event: DragEvent }) => {
  // Reset drag state
  draggedNodeId.value = null
  dragOverNodeId.value = null
  dragPosition.value = null
}

// Utility function to check if a node is a descendant of another
const isDescendant = (nodeId: string, ancestorId: string | null): boolean => {
  if (!ancestorId) return false
  
  const findNode = (nodes: DocumentTreeNode[], id: string): DocumentTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      const found = findNode(node.children, id)
      if (found) return found
    }
    return null
  }
  
  const checkDescendant = (node: DocumentTreeNode, targetId: string): boolean => {
    for (const child of node.children) {
      if (child.id === targetId) return true
      if (checkDescendant(child, targetId)) return true
    }
    return false
  }
  
  const ancestorNode = findNode(props.nodes, ancestorId)
  return ancestorNode ? checkDescendant(ancestorNode, nodeId) : false
}

// Provide drag state to child components
provide('dragState', {
  draggedNodeId: readonly(draggedNodeId),
  dragOverNodeId: readonly(dragOverNodeId),
  dragPosition: readonly(dragPosition)
})
</script>