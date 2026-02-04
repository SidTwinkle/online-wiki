import type { VditorOptions } from '~/types'

export const useVditor = () => {
  const getDefaultOptions = (): Partial<VditorOptions> => ({
    mode: 'wysiwyg',
    theme: 'classic',
    height: '100%',
    width: '100%',
    placeholder: '开始编写您的文档...',
    toolbar: [], // 使用空数组而不是false
    cache: {
      enable: false // Disable cache to avoid conflicts
    },
    counter: {
      enable: false // 去掉字数统计
    },
    outline: {
      enable: false
    },
    preview: {
      delay: 500,
      mode: 'editor' // 只显示编辑器，不显示预览
    },
    // 禁用所有可能导致错误的功能
    upload: {
      url: '',
      max: 0
    },
    hint: {
      delay: 0
    },
    tab: '\t',
    typewriterMode: false,
    debugger: false,
    // 提供空的自定义工具栏函数以避免错误
    customWysiwygToolbar: (vditor: any) => {
      // 返回空数组，不添加任何工具栏项
      return []
    }
  })

  return {
    getDefaultOptions
  }
}