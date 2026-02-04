<template>
  <div class="document-editor h-full" @keydown="handleKeydown">
    <!-- Editor Content - Full height -->
    <div class="editor-content h-full">
      <VditorWrapper
        v-if="document"
        ref="vditorRef"
        :value="currentContent"
        :options="editorOptions"
        :disabled="saving"
        @input="handleContentChange"
        @ready="handleEditorReady"
        @focus="handleEditorFocus"
        @blur="handleEditorBlur"
        class="h-full"
      />
      
      <!-- Empty state -->
      <div 
        v-else
        class="empty-state flex items-center justify-center h-full text-gray-500"
      >
        <div class="text-center">
          <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-4" />
          <p class="text-lg">选择一个文档开始编辑</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Document, VditorOptions } from '~/types'

interface Props {
  document: Document | null
  readonly?: boolean
}

interface Emits {
  (e: 'save', content: string): void
  (e: 'auto-save', content: string): void
  (e: 'content-change', content: string): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// Refs
const vditorRef = ref()

// State
const currentContent = ref('')
const originalContent = ref('')
const hasUnsavedChanges = ref(false)
const editorReady = ref(false)
const saving = ref(false) // 重新添加 saving 状态

// Auto-save configuration
const AUTO_SAVE_DELAY = 1000 // 1秒自动保存
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)
const lastSavedContent = ref('')

// Editor options
const { getDefaultOptions } = useVditor()
const editorOptions = computed<Partial<VditorOptions>>(() => ({
  ...getDefaultOptions(),
  cache: {
    enable: false // 禁用缓存以避免文档间内容混乱
  }
}))

// Define functions first
const loadDocument = (document: Document) => {
  const content = document.content || ''
  
  // 清除自动保存定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  
  // 重置所有状态
  currentContent.value = content
  originalContent.value = content
  lastSavedContent.value = content
  hasUnsavedChanges.value = false
  
  // 确保编辑器内容也被更新
  nextTick(() => {
    if (vditorRef.value) {
      vditorRef.value.setValue(content)
    }
  })
}

const resetEditor = () => {
  currentContent.value = ''
  originalContent.value = ''
  lastSavedContent.value = ''
  hasUnsavedChanges.value = false
  
  // Clear auto-save timer
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
}

// Watch for document changes
watch(() => props.document, (newDoc, oldDoc) => {
  // 清除自动保存定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  
  // 如果是同一个文档的更新（比如保存后的更新），检查内容是否真的需要更新
  if (oldDoc && newDoc && oldDoc.id === newDoc.id) {
    const newContent = newDoc.content || ''
    // 如果新内容和当前编辑器内容相同，只更新状态，不重新设置编辑器
    if (newContent === currentContent.value) {
      originalContent.value = newContent
      lastSavedContent.value = newContent
      hasUnsavedChanges.value = false
      return
    }
  }
  
  // 加载新文档或重置编辑器
  if (newDoc) {
    loadDocument(newDoc)
  } else {
    resetEditor()
  }
}, { immediate: true })

const handleContentChange = (content: string) => {
  // 确保内容变化时文档仍然存在
  if (!props.document) {
    return
  }
  
  currentContent.value = content
  hasUnsavedChanges.value = content !== lastSavedContent.value
  
  if (hasUnsavedChanges.value) {
    scheduleAutoSave()
  }
  
  emit('content-change', content)
}

const scheduleAutoSave = () => {
  // 清除现有的定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  
  // 只有在有文档且有未保存更改时才安排自动保存
  if (!props.document || !hasUnsavedChanges.value) {
    return
  }
  
  // 安排新的自动保存
  autoSaveTimer.value = setTimeout(() => {
    if (props.document && hasUnsavedChanges.value && !saving.value) {
      autoSave()
    }
  }, AUTO_SAVE_DELAY)
}

const autoSave = async () => {
  if (!props.document || !hasUnsavedChanges.value || saving.value) {
    return
  }
  
  try {
    saving.value = true
    emit('auto-save', currentContent.value)
    
    // 更新本地状态
    lastSavedContent.value = currentContent.value
    originalContent.value = currentContent.value
    hasUnsavedChanges.value = false
  } catch (error) {
    console.error('Auto-save failed:', error)
  } finally {
    saving.value = false
  }
}

const saveDocument = async () => {
  if (!props.document || !hasUnsavedChanges.value || saving.value) {
    return
  }
  
  try {
    saving.value = true
    emit('save', currentContent.value)
    
    // 更新本地状态
    lastSavedContent.value = currentContent.value
    originalContent.value = currentContent.value
    hasUnsavedChanges.value = false
    
    // Clear auto-save timer since we just saved
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    saving.value = false
  }
}

const handleEditorReady = () => {
  editorReady.value = true
}

const handleEditorFocus = () => {
  // Editor focused
}

const handleEditorBlur = () => {
  // Editor blurred
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+S or Cmd+S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveDocument()
  }
}

// Expose methods to parent
defineExpose({
  save: saveDocument,
  getValue: () => currentContent.value,
  setValue: (content: string) => {
    currentContent.value = content
    if (vditorRef.value) {
      vditorRef.value.setValue(content)
    }
  },
  focus: () => {
    if (vditorRef.value) {
      vditorRef.value.focus()
    }
  }
})

// 简化的生命周期管理
onBeforeUnmount(() => {
  // 清除自动保存定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  
  // 组件卸载时不再自动保存
})
</script>

<style scoped>
.document-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  background: #f9fafb;
}
</style>