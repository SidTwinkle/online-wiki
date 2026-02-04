<template>
  <div ref="vditorRef" class="vditor-wrapper"></div>
</template>

<script setup lang="ts">
import type { VditorOptions } from '~/types'

interface Props {
  value?: string
  options?: Partial<VditorOptions>
  disabled?: boolean
}

interface Emits {
  (e: 'input', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  disabled: false,
  options: () => ({})
})

const emit = defineEmits<Emits>()

const vditorRef = ref<HTMLElement>()
const { getDefaultOptions } = useVditor()

let vditorInstance: any = null

const initVditor = async () => {
  if (!vditorRef.value) return

  try {
    // Dynamic import to avoid SSR issues
    const { default: Vditor } = await import('vditor')
    
    // Import Vditor CSS
    await import('vditor/dist/index.css')

    const defaultOptions = getDefaultOptions()
    const mergedOptions = {
      ...defaultOptions,
      ...props.options,
      after: () => {
        if (props.value) {
          vditorInstance?.setValue(props.value)
        }
        emit('ready')
        // Call original after callbacks if they exist
        if (defaultOptions.after) {
          defaultOptions.after()
        }
        if (props.options?.after) {
          props.options.after()
        }
      },
      input: (value: string) => {
        emit('input', value)
        // Call original input callbacks if they exist
        if (defaultOptions.input) {
          defaultOptions.input(value)
        }
        if (props.options?.input) {
          props.options.input(value)
        }
      },
      focus: () => {
        emit('focus')
        // Call original focus callbacks if they exist
        if (defaultOptions.focus) {
          defaultOptions.focus()
        }
        if (props.options?.focus) {
          props.options.focus()
        }
      },
      blur: () => {
        emit('blur')
        // Call original blur callbacks if they exist
        if (defaultOptions.blur) {
          defaultOptions.blur()
        }
        if (props.options?.blur) {
          props.options.blur()
        }
      }
    }

    // Remove any undefined or problematic options
    Object.keys(mergedOptions).forEach(key => {
      if (mergedOptions[key] === undefined) {
        delete mergedOptions[key]
      }
    })

    vditorInstance = new Vditor(vditorRef.value, mergedOptions)
  } catch (error) {
    console.error('Failed to initialize Vditor:', error)
    // Emit an error event so parent can handle it
    emit('ready') // Still emit ready to prevent hanging
  }
}

const setValue = (value: string) => {
  if (vditorInstance) {
    vditorInstance.setValue(value)
  }
}

const getValue = (): string => {
  return vditorInstance ? vditorInstance.getValue() : ''
}

const getHTML = (): string => {
  return vditorInstance ? vditorInstance.getHTML() : ''
}

const focus = () => {
  if (vditorInstance) {
    vditorInstance.focus()
  }
}

const blur = () => {
  if (vditorInstance) {
    vditorInstance.blur()
  }
}

const disabled = (isDisabled: boolean) => {
  if (vditorInstance) {
    vditorInstance.disabled(isDisabled)
  }
}

// Watch for value changes from parent
watch(() => props.value, (newValue) => {
  if (vditorInstance) {
    const currentValue = getValue()
    // 只有当值真正不同时才设置新值，避免不必要的光标重置
    if (newValue !== currentValue) {
      setValue(newValue)
    }
  }
})

// Watch for disabled state changes
watch(() => props.disabled, (newDisabled) => {
  disabled(newDisabled)
})

// Expose methods to parent component
defineExpose({
  setValue,
  getValue,
  getHTML,
  focus,
  blur,
  disabled
})

onMounted(() => {
  nextTick(() => {
    initVditor()
  })
})

onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
})
</script>

<style scoped>
.vditor-wrapper {
  width: 100%;
  min-height: 400px;
  height: 100%;
  overflow: hidden;
}

:deep(.vditor) {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
}

:deep(.vditor-content) {
  background-color: white;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.vditor-wysiwyg) {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

:deep(.vditor-ir) {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

:deep(.vditor-sv) {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

:deep(.vditor-preview) {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

/* 强制覆盖 vditor-reset 的行内样式 */
:deep(.vditor-reset) {
  padding: 1rem !important;
  margin: 0 !important;
  max-width: none !important;
  width: 100% !important;
}

/* Ensure the editor content area is scrollable */
:deep(.vditor-wysiwyg .vditor-reset) {
  min-height: 300px;
  max-height: none;
  overflow-y: auto;
  padding: 1rem !important; /* 覆盖行内样式，使用合理的内边距 */
}

:deep(.vditor-ir .vditor-reset) {
  min-height: 300px;
  max-height: none;
  overflow-y: auto;
  padding: 1rem !important; /* 覆盖行内样式，使用合理的内边距 */
}

:deep(.vditor-sv .vditor-reset) {
  min-height: 300px;
  max-height: none;
  overflow-y: auto;
  padding: 1rem !important; /* 覆盖行内样式，使用合理的内边距 */
}
</style>