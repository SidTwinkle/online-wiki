import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { Document } from '~/types'

describe('Documents API', async () => {
  await setup({
    // Test against the built app
    build: true,
    server: true
  })

  describe('Document CRUD Operations', () => {
    it('should require authentication for document creation', async () => {
      try {
        await $fetch('/api/documents', {
          method: 'POST',
          body: {
            title: 'Test Document',
            content: '# Test Content\n\nThis is a test document.',
            type: 'document'
          }
        })
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for getting documents', async () => {
      try {
        await $fetch('/api/documents')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for getting specific document', async () => {
      try {
        await $fetch('/api/documents/test-id')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for updating document', async () => {
      try {
        await $fetch('/api/documents/test-id', {
          method: 'PUT',
          body: { title: 'Updated Title' }
        })
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for deleting document', async () => {
      try {
        await $fetch('/api/documents/test-id', {
          method: 'DELETE'
        })
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })
  })

  describe('Document Tree Operations', () => {
    it('should require authentication for document tree', async () => {
      try {
        await $fetch('/api/documents/tree')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for document path', async () => {
      try {
        await $fetch('/api/documents/test-id/path')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for document move', async () => {
      try {
        await $fetch('/api/documents/test-id/move', {
          method: 'POST',
          body: { parentId: 'new-parent-id' }
        })
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for document reorder', async () => {
      try {
        await $fetch('/api/documents/reorder', {
          method: 'POST',
          body: {
            parentId: 'parent-id',
            documentIds: ['doc1', 'doc2']
          }
        })
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })
  })

  describe('Search API', () => {
    it('should require authentication for search', async () => {
      try {
        await $fetch('/api/search')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for search with query', async () => {
      try {
        await $fetch('/api/search?query=test')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should require authentication for search with parameters', async () => {
      try {
        await $fetch('/api/search?query=test&limit=10&offset=0')
        expect.fail('Should have thrown authentication error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })
  })
})