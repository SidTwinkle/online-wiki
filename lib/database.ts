import { PrismaClient } from '@prisma/client'
import type { 
  User, 
  Document, 
  FileUpload, 
  Session,
  SearchResult,
  UserRaw,
  DocumentRaw,
  FileRaw,
  SessionRaw
} from '~/types'
import {
  transformUserFromRaw,
  transformDocumentFromRaw,
  transformFileFromRaw,
  transformSessionFromRaw
} from '~/types'

// Database connection singleton
let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  prisma = global.__prisma
}

export { prisma }

// Database utility functions
export class DatabaseService {
  private prisma: PrismaClient

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient
  }

  // User operations
  async createUser(userData: Omit<UserRaw, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userRaw = await this.prisma.user.create({
      data: userData
    })
    return transformUserFromRaw(userRaw)
  }

  async getUserById(id: string): Promise<User | null> {
    const userRaw = await this.prisma.user.findUnique({
      where: { id }
    })
    return userRaw ? transformUserFromRaw(userRaw) : null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const userRaw = await this.prisma.user.findUnique({
      where: { username }
    })
    return userRaw ? transformUserFromRaw(userRaw) : null
  }

  async getUserWithPasswordByUsername(username: string): Promise<UserRaw | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    })
  }

  async updateUser(id: string, userData: Partial<Omit<UserRaw, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const userRaw = await this.prisma.user.update({
      where: { id },
      data: userData
    })
    return transformUserFromRaw(userRaw)
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    })
  }

  // Document operations
  async createDocument(documentData: Omit<DocumentRaw, 'id' | 'createdAt' | 'updatedAt' | 'contentVector'>): Promise<Document> {
    const documentRaw = await this.prisma.document.create({
      data: documentData
    })
    return transformDocumentFromRaw(documentRaw)
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const documentRaw = await this.prisma.document.findUnique({
      where: { id }
    })
    return documentRaw ? transformDocumentFromRaw(documentRaw) : null
  }

  async getDocumentsByParentId(parentId: string | null): Promise<Document[]> {
    const documentsRaw = await this.prisma.document.findMany({
      where: { parentId },
      orderBy: { position: 'asc' }
    })
    return documentsRaw.map(transformDocumentFromRaw)
  }

  async getAllDocuments(): Promise<Document[]> {
    const documentsRaw = await this.prisma.document.findMany({
      orderBy: [
        { path: 'asc' },
        { position: 'asc' }
      ]
    })
    return documentsRaw.map(transformDocumentFromRaw)
  }

  async updateDocument(id: string, documentData: Partial<Omit<DocumentRaw, 'id' | 'createdAt' | 'updatedAt' | 'contentVector'>>): Promise<Document> {
    const documentRaw = await this.prisma.document.update({
      where: { id },
      data: documentData
    })
    return transformDocumentFromRaw(documentRaw)
  }

  async deleteDocument(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id }
    })
  }

  async searchDocuments(query: string, limit: number = 50, offset: number = 0): Promise<Document[]> {
    const documentsRaw = await this.prisma.$queryRaw<DocumentRaw[]>`
      SELECT *
      FROM documents
      WHERE content_vector @@ plainto_tsquery('english', ${query})
        AND type = 'document'
      ORDER BY ts_rank(content_vector, plainto_tsquery('english', ${query})) DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    return documentsRaw.map(transformDocumentFromRaw)
  }

  async searchDocumentsWithSnippets(query: string, limit: number = 50, offset: number = 0): Promise<{
    documents: Document[]
    snippets: string[]
    ranks: number[]
    total: number
  }> {
    try {
      // First, try the full-text search
      const results = await this.prisma.$queryRaw<Array<{
        id: string
        title: string
        content: string | null
        content_vector: string | null
        type: 'document' | 'folder'
        parent_id: string | null
        path: string | null
        position: number
        created_at: Date
        updated_at: Date
        created_by: string
        snippet: string
        rank: number
      }>>`
        SELECT *,
          ts_headline('english', COALESCE(content, ''), plainto_tsquery('english', ${query}), 
            'MaxWords=20, MinWords=10, ShortWord=3, HighlightAll=false, MaxFragments=1') as snippet,
          ts_rank(content_vector, plainto_tsquery('english', ${query})) as rank
        FROM documents
        WHERE content_vector @@ plainto_tsquery('english', ${query})
          AND type = 'document'
        ORDER BY ts_rank(content_vector, plainto_tsquery('english', ${query})) DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `

      // Get total count
      const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM documents
        WHERE content_vector @@ plainto_tsquery('english', ${query})
          AND type = 'document'
      `

      const total = Number(countResult[0]?.count || 0)

      const documents = results.map(result => transformDocumentFromRaw({
        id: result.id,
        title: result.title,
        content: result.content,
        contentVector: result.content_vector,
        type: result.type,
        parentId: result.parent_id,
        path: result.path,
        position: result.position,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        createdBy: result.created_by
      }))

      const snippets = results.map(result => result.snippet)
      const ranks = results.map(result => result.rank)

      return {
        documents,
        snippets,
        ranks,
        total
      }
    } catch (error) {
      console.error('Full-text search failed, falling back to simple search:', error)
      
      // Fallback to simple LIKE search
      const searchPattern = `%${query}%`
      
      const results = await this.prisma.document.findMany({
        where: {
          type: 'document',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { updatedAt: 'desc' }
        ],
        take: limit,
        skip: offset
      })

      const total = await this.prisma.document.count({
        where: {
          type: 'document',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        }
      })

      const documents = results.map(result => transformDocumentFromRaw(result))
      
      // Generate simple snippets
      const snippets = results.map(result => {
        const content = result.content || ''
        const queryIndex = content.toLowerCase().indexOf(query.toLowerCase())
        if (queryIndex === -1) return content.substring(0, 100) + '...'
        
        const start = Math.max(0, queryIndex - 50)
        const end = Math.min(content.length, queryIndex + query.length + 50)
        return '...' + content.substring(start, end) + '...'
      })
      
      const ranks = results.map(() => 1) // Simple ranking

      return {
        documents,
        snippets,
        ranks,
        total
      }
    }
  }

  async getSearchResults(query: string, limit: number = 50, offset: number = 0): Promise<{
    results: SearchResult[]
    total: number
  }> {
    const searchData = await this.searchDocumentsWithSnippets(query, limit, offset)
    
    const results: SearchResult[] = await Promise.all(
      searchData.documents.map(async (document, index) => {
        // Get document path hierarchy for display
        const hierarchy = await this.getDocumentHierarchy(document.id)
        const pathNames = hierarchy.map(doc => doc.title).join(' > ')
        
        return {
          id: document.id,
          title: document.title,
          content: document.content || '',
          snippet: searchData.snippets[index] || '',
          rank: searchData.ranks[index] || 0,
          path: pathNames
        }
      })
    )

    return {
      results,
      total: searchData.total
    }
  }

  async getDocumentHierarchy(documentId: string): Promise<Document[]> {
    const hierarchy: Document[] = []
    let currentId: string | undefined = documentId

    while (currentId) {
      const document = await this.getDocumentById(currentId)
      if (!document) break
      
      hierarchy.unshift(document) // Add to beginning
      currentId = document.parentId
    }

    return hierarchy
  }

  async getDocumentChildren(parentId: string, recursive: boolean = false): Promise<Document[]> {
    if (!recursive) {
      return this.getDocumentsByParentId(parentId)
    }

    // Get all descendants recursively
    const allDocuments = await this.getAllDocuments()
    const descendants: Document[] = []
    
    const findDescendants = (currentParentId: string) => {
      const children = allDocuments.filter(doc => doc.parentId === currentParentId)
      children.forEach(child => {
        descendants.push(child)
        findDescendants(child.id)
      })
    }

    findDescendants(parentId)
    return descendants
  }

  async updateDocumentPositions(parentId: string | null, documentIds: string[]): Promise<void> {
    await this.transaction(async (tx) => {
      for (let i = 0; i < documentIds.length; i++) {
        await tx.document.update({
          where: { id: documentIds[i] },
          data: { position: i }
        })
      }
    })
  }

  async validateDocumentHierarchy(documentId: string, newParentId: string): Promise<boolean> {
    // Check if newParentId is a descendant of documentId
    const descendants = await this.getDocumentChildren(documentId, true)
    return !descendants.some(desc => desc.id === newParentId)
  }

  // File operations
  async createFile(fileData: Omit<FileRaw, 'id' | 'createdAt'>): Promise<FileUpload> {
    const fileRaw = await this.prisma.file.create({
      data: fileData
    })
    return transformFileFromRaw(fileRaw)
  }

  async getFileById(id: string): Promise<FileUpload | null> {
    const fileRaw = await this.prisma.file.findUnique({
      where: { id }
    })
    return fileRaw ? transformFileFromRaw(fileRaw) : null
  }

  async getFilesByDocumentId(documentId: string): Promise<FileUpload[]> {
    const filesRaw = await this.prisma.file.findMany({
      where: { documentId }
    })
    return filesRaw.map(transformFileFromRaw)
  }

  async updateFile(id: string, fileData: Partial<Omit<FileRaw, 'id' | 'createdAt'>>): Promise<FileUpload> {
    const fileRaw = await this.prisma.file.update({
      where: { id },
      data: fileData
    })
    return transformFileFromRaw(fileRaw)
  }

  async deleteFile(id: string): Promise<void> {
    await this.prisma.file.delete({
      where: { id }
    })
  }

  // Session operations
  async createSession(sessionData: Omit<SessionRaw, 'id' | 'createdAt'>): Promise<Session> {
    const sessionRaw = await this.prisma.session.create({
      data: sessionData
    })
    return transformSessionFromRaw(sessionRaw)
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const sessionRaw = await this.prisma.session.findUnique({
      where: { token }
    })
    return sessionRaw ? transformSessionFromRaw(sessionRaw) : null
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    const sessionsRaw = await this.prisma.session.findMany({
      where: { userId }
    })
    return sessionsRaw.map(transformSessionFromRaw)
  }

  async deleteSession(id: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id }
    })
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }

  async countExpiredSessions(): Promise<number> {
    return await this.prisma.session.count({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }

  // Transaction support
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(callback)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()