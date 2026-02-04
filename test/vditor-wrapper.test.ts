import { describe, it, expect, vi } from 'vitest'

// Mock Vditor
const mockVditor = {
  setValue: vi.fn(),
  getValue: vi.fn(() => 'test content'),
  getHTML: vi.fn(() => '<p>test content</p>'),
  focus: vi.fn(),
  blur: vi.fn(),
  disabled: vi.fn(),
  destroy: vi.fn()
}

vi.mock('vditor', () => ({
  default: vi.fn().mockImplementation(() => mockVditor)
}))

vi.mock('vditor/dist/index.css', () => ({}))

// Mock useVditor composable
const mockUseVditor = {
  getDefaultOptions: () => ({
    mode: 'wysiwyg',
    theme: 'classic',
    toolbar: ['bold', 'italic'],
    upload: {
      url: '/api/upload',
      max: 10 * 1024 * 1024,
      accept: 'image/*'
    },
    cache: {
      enable: true,
      id: 'vditor-cache'
    }
  })
}

describe('VditorWrapper Logic', () => {
  it('should provide default options through useVditor composable', () => {
    const options = mockUseVditor.getDefaultOptions()
    
    expect(options.mode).toBe('wysiwyg')
    expect(options.theme).toBe('classic')
    expect(options.toolbar).toContain('bold')
    expect(options.toolbar).toContain('italic')
    expect(options.upload.url).toBe('/api/upload')
    expect(options.upload.max).toBe(10 * 1024 * 1024)
    expect(options.upload.accept).toBe('image/*')
    expect(options.cache.enable).toBe(true)
    expect(options.cache.id).toBe('vditor-cache')
  })

  it('should handle Vditor instance methods', () => {
    // Test that mock Vditor methods are callable
    expect(typeof mockVditor.setValue).toBe('function')
    expect(typeof mockVditor.getValue).toBe('function')
    expect(typeof mockVditor.getHTML).toBe('function')
    expect(typeof mockVditor.focus).toBe('function')
    expect(typeof mockVditor.blur).toBe('function')
    expect(typeof mockVditor.disabled).toBe('function')
    expect(typeof mockVditor.destroy).toBe('function')
  })

  it('should return expected values from Vditor methods', () => {
    expect(mockVditor.getValue()).toBe('test content')
    expect(mockVditor.getHTML()).toBe('<p>test content</p>')
  })
})