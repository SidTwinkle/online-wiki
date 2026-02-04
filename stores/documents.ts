import { defineStore } from 'pinia'
import type { Document, DocumentTreeNode } from '~/types'

interface DocumentState {
  documents: Document[]
  documentTree: DocumentTreeNode[]
  selectedDocumentId: string | null
  selectedDocument: Document | null
  loading: boolean
  error: string | null
  searchResults: any[]
  searchQuery: string
  searchLoading: boolean
  searchTotal: number
}

export const useDocumentStore = defineStore('documents', {
  state: (): DocumentState => ({
    documents: [],
    documentTree: [],
    selectedDocumentId: null,
    selectedDocument: null,
    loading: false,
    error: null,
    searchResults: [],
    searchQuery: '',
    searchLoading: false,
    searchTotal: 0
  }),

  getters: {
    // Get documents by type
    documentsByType: (state) => (type: 'document' | 'folder') => {
      return state.documents?.filter(doc => doc && doc.type === type) || []
    },

    // Get total counts
    totalDocuments: (state) => state.documents?.filter(doc => doc && doc.type === 'document').length || 0,
    totalFolders: (state) => state.documents?.filter(doc => doc && doc.type === 'folder').length || 0,

    // Get recent documents (sorted by updatedAt)
    recentDocuments: (state) => {
      return state.documents
        ?.filter(doc => doc && doc.type === 'document')
        ?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        ?.slice(0, 10) || []
    },

    // Check if we have any documents
    hasDocuments: (state) => state.documents?.length > 0,

    // Get document by ID
    getDocumentById: (state) => (id: string) => {
      return state.documents?.find(doc => doc.id === id)
    },

    // Get children of a document/folder
    getChildren: (state) => (parentId: string | null) => {
      return state.documents?.filter(doc => doc && doc.parentId === parentId) || []
    }
  },

  actions: {
    // Load all documents
    async loadDocuments() {
      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch<{ success: boolean; data: { documents: Document[] } }>('/api/documents')
        this.documents = response.data.documents
      } catch (error: any) {
        this.error = error.message || 'Failed to load documents'
        console.error('Failed to load documents:', error)
        
        // Use error handler for user notification
        try {
          console.error('Failed to load documents:', error)
        } catch (e) {
          console.error('Error handler not available:', e)
        }
      } finally {
        this.loading = false
      }
    },

    // Load document tree
    async loadDocumentTree() {
      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch<{ success: boolean; data: { documents: DocumentTreeNode[] } }>('/api/documents/tree')
        this.documentTree = response.data.documents
      } catch (error: any) {
        this.error = error.message || 'Failed to load document tree'
        console.error('Failed to load document tree:', error)
        
        // Use error handler for user notification
        try {
          console.error('Failed to load document tree:', error)
        } catch (e) {
          console.error('Error handler not available:', e)
        }
      } finally {
        this.loading = false
      }
    },

    // Load a specific document
    async loadDocument(id: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch<{ success: boolean; data: { document: Document } }>(`/api/documents/${id}`)
        const document = response.data.document
        this.selectedDocument = document
        this.selectedDocumentId = id
        
        // Update the document in the documents array if it exists
        if (!this.documents) {
          this.documents = []
        }
        const index = this.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          this.documents[index] = document
        } else {
          this.documents.push(document)
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to load document'
        console.error('Failed to load document:', error)
      } finally {
        this.loading = false
      }
    },

    // Create a new document
    async createDocument(data: { title: string; content?: string; type: 'document' | 'folder'; parentId?: string }) {
      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch<{ success: boolean; data: { document: Document } }>('/api/documents', {
          method: 'POST',
          body: data
        })
        
        const document = response.data.document
        
        // Ensure documents array exists
        if (!this.documents) {
          this.documents = []
        }
        this.documents.push(document)
        
        // Reload both documents and tree to update structure
        await Promise.all([
          this.loadDocuments(),
          this.loadDocumentTree()
        ])
        
        return document
      } catch (error: any) {
        this.error = error.message || 'Failed to create document'
        console.error('Failed to create document:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update a document
    async updateDocument(id: string, data: Partial<Document>) {
      try {
        const response = await $fetch<{ success: boolean; data: { document: Document } }>(`/api/documents/${id}`, {
          method: 'PUT',
          body: data
        })
        
        const updatedDocument = response.data.document
        
        // Update the document in the local state without refreshing the entire tree
        const updateInArray = (docs: Document[]): Document[] => {
          return docs.map(doc => 
            doc.id === id ? { ...doc, ...updatedDocument } : doc
          )
        }
        
        const updateInTree = (nodes: DocumentTreeNode[]): DocumentTreeNode[] => {
          return nodes.map(node => {
            if (node.id === id) {
              return { ...node, ...updatedDocument }
            }
            if (node.children.length > 0) {
              return { ...node, children: updateInTree(node.children) }
            }
            return node
          })
        }
        
        // Update documents array
        if (this.documents) {
          this.documents = updateInArray(this.documents)
        }
        
        // Update document tree
        if (this.documentTree) {
          this.documentTree = updateInTree(this.documentTree)
        }
        
        // Update selected document if it's the one being updated
        if (this.selectedDocument?.id === id) {
          this.selectedDocument = { ...this.selectedDocument, ...updatedDocument }
        }
        
        return updatedDocument
      } catch (error: any) {
        console.error('Failed to update document:', error)
        throw error
      }
    },

    // Delete a document
    async deleteDocument(id: string) {
      this.loading = true
      this.error = null
      
      try {
        await $fetch(`/api/documents/${id}`, {
          method: 'DELETE'
        })
        
        // Remove from documents array
        if (this.documents) {
          this.documents = this.documents.filter(doc => doc.id !== id)
        }
        
        // Clear selected document if it was deleted
        if (this.selectedDocumentId === id) {
          this.selectedDocument = null
          this.selectedDocumentId = null
        }
        
        // Reload tree to update structure
        await this.loadDocumentTree()
      } catch (error: any) {
        this.error = error.message || 'Failed to delete document'
        console.error('Failed to delete document:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Search documents
    async searchDocuments(query: string) {
      if (!query.trim()) {
        this.searchResults = []
        this.searchQuery = ''
        this.searchTotal = 0
        return
      }
      
      this.searchLoading = true
      this.searchQuery = query
      
      try {
        const response = await $fetch<{ success: boolean; data: { results: any[]; total: number; query: string } }>('/api/search', {
          query: { query }
        })
        
        if (response.success && response.data) {
          this.searchResults = response.data.results || []
          this.searchTotal = response.data.total || 0
        } else {
          this.searchResults = []
          this.searchTotal = 0
        }
      } catch (error: any) {
        console.error('Search failed:', error)
        this.searchResults = []
        this.searchTotal = 0
      } finally {
        this.searchLoading = false
      }
    },

    // Clear search
    clearSearch() {
      this.searchResults = []
      this.searchQuery = ''
      this.searchLoading = false
      this.searchTotal = 0
    },

    // Select a document
    selectDocument(id: string | null) {
      this.selectedDocumentId = id
      if (id) {
        this.selectedDocument = this.getDocumentById(id) || null
      } else {
        this.selectedDocument = null
      }
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})