// Base types
export interface User {
  id: string
  username: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  title: string
  content?: string
  type: 'document' | 'folder'
  parentId?: string
  path: string
  position: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[]
  expanded?: boolean
}

export interface SearchResult {
  id: string
  title: string
  content: string
  snippet: string
  rank: number
  path: string
}

export interface FileUpload {
  id: string
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  path: string
  documentId?: string
  createdAt: Date
  createdBy: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

// Database raw types (from Prisma)
export interface UserRaw {
  id: string
  username: string
  passwordHash: string
  email?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DocumentRaw {
  id: string
  title: string
  content?: string | null
  contentVector?: string | null
  type: 'document' | 'folder'
  parentId?: string | null
  path?: string | null
  position: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface FileRaw {
  id: string
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  path: string
  documentId?: string | null
  createdAt: Date
  createdBy: string
}

export interface SessionRaw {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

// Vditor configuration types
export interface VditorOptions {
  mode?: 'wysiwyg' | 'ir' | 'sv'
  theme?: 'classic' | 'dark'
  toolbar?: (string | { name: string; toolbar: string[] })[] | boolean
  height?: number | string
  width?: number | string
  placeholder?: string
  upload?: {
    url?: string
    max?: number
    accept?: string
  }
  cache?: {
    enable?: boolean
    id?: string
  }
  counter?: {
    enable?: boolean
    type?: 'markdown' | 'text'
  }
  outline?: {
    enable?: boolean
  }
  preview?: {
    delay?: number
    mode?: 'both' | 'editor' | 'preview'
    url?: string
  }
  hint?: {
    delay?: number
  }
  tab?: string
  typewriterMode?: boolean
  debugger?: boolean
  toolbarConfig?: {
    hide?: boolean
  }
  customWysiwygToolbar?: (vditor: any) => any[]
  after?: () => void
  input?: (value: string) => void
  focus?: () => void
  blur?: () => void
  select?: (value: string) => void
  esc?: (value: string) => void
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API request/response interfaces
export interface GetDocumentsResponse {
  documents: DocumentTreeNode[]
}

export interface GetDocumentResponse {
  document: Document
}

export interface CreateDocumentRequest {
  title: string
  content?: string
  parentId?: string
  type: 'document' | 'folder'
}

export interface CreateDocumentResponse {
  document: Document
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
  parentId?: string
}

export interface UpdateDocumentResponse {
  document: Document
}

export interface DeleteDocumentResponse {
  success: boolean
}

export interface SearchRequest {
  query: string
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export interface UploadRequest {
  file: File
  documentId?: string
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface LogoutResponse {
  success: boolean
}

export interface MeResponse {
  user: User | null
}

// Validation functions
export const validateUser = (user: Partial<User>): user is User => {
  return !!(
    user.id &&
    user.username &&
    user.createdAt &&
    user.updatedAt &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    user.username.length > 0 &&
    user.username.length <= 50 &&
    user.createdAt instanceof Date &&
    user.updatedAt instanceof Date &&
    (!user.email || (typeof user.email === 'string' && user.email.length <= 255))
  )
}

export const validateDocument = (document: Partial<Document>): document is Document => {
  return !!(
    document.id &&
    document.title &&
    document.type &&
    document.path &&
    typeof document.position === 'number' &&
    document.createdAt &&
    document.updatedAt &&
    document.createdBy &&
    typeof document.id === 'string' &&
    typeof document.title === 'string' &&
    document.title.length > 0 &&
    document.title.length <= 255 &&
    (document.type === 'document' || document.type === 'folder') &&
    typeof document.path === 'string' &&
    document.position >= 0 &&
    document.createdAt instanceof Date &&
    document.updatedAt instanceof Date &&
    typeof document.createdBy === 'string' &&
    (!document.content || typeof document.content === 'string') &&
    (!document.parentId || typeof document.parentId === 'string')
  )
}

export const validateFileUpload = (file: Partial<FileUpload>): file is FileUpload => {
  return !!(
    file.id &&
    file.filename &&
    file.originalFilename &&
    file.mimeType &&
    typeof file.size === 'number' &&
    file.path &&
    file.createdAt &&
    file.createdBy &&
    typeof file.id === 'string' &&
    typeof file.filename === 'string' &&
    file.filename.length > 0 &&
    file.filename.length <= 255 &&
    typeof file.originalFilename === 'string' &&
    file.originalFilename.length > 0 &&
    file.originalFilename.length <= 255 &&
    typeof file.mimeType === 'string' &&
    file.mimeType.length > 0 &&
    file.mimeType.length <= 100 &&
    file.size > 0 &&
    typeof file.path === 'string' &&
    file.path.length > 0 &&
    file.path.length <= 500 &&
    file.createdAt instanceof Date &&
    typeof file.createdBy === 'string' &&
    (!file.documentId || typeof file.documentId === 'string')
  )
}

export const validateSession = (session: Partial<Session>): session is Session => {
  return !!(
    session.id &&
    session.userId &&
    session.token &&
    session.expiresAt &&
    session.createdAt &&
    typeof session.id === 'string' &&
    typeof session.userId === 'string' &&
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    session.token.length <= 255 &&
    session.expiresAt instanceof Date &&
    session.createdAt instanceof Date &&
    session.expiresAt > new Date()
  )
}

// Transformation functions
export const transformUserFromRaw = (userRaw: UserRaw): User => {
  return {
    id: userRaw.id,
    username: userRaw.username,
    email: userRaw.email || undefined,
    createdAt: userRaw.createdAt,
    updatedAt: userRaw.updatedAt
  }
}

export const transformDocumentFromRaw = (documentRaw: DocumentRaw): Document => {
  return {
    id: documentRaw.id,
    title: documentRaw.title,
    content: documentRaw.content || undefined,
    type: documentRaw.type,
    parentId: documentRaw.parentId || undefined,
    path: documentRaw.path || '',
    position: documentRaw.position,
    createdAt: documentRaw.createdAt,
    updatedAt: documentRaw.updatedAt,
    createdBy: documentRaw.createdBy
  }
}

export const transformFileFromRaw = (fileRaw: FileRaw): FileUpload => {
  return {
    id: fileRaw.id,
    filename: fileRaw.filename,
    originalFilename: fileRaw.originalFilename,
    mimeType: fileRaw.mimeType,
    size: fileRaw.size,
    path: fileRaw.path,
    documentId: fileRaw.documentId || undefined,
    createdAt: fileRaw.createdAt,
    createdBy: fileRaw.createdBy
  }
}

export const transformSessionFromRaw = (sessionRaw: SessionRaw): Session => {
  return {
    id: sessionRaw.id,
    userId: sessionRaw.userId,
    token: sessionRaw.token,
    expiresAt: sessionRaw.expiresAt,
    createdAt: sessionRaw.createdAt
  }
}

// Utility functions for document tree operations
export const buildDocumentTree = (documents: Document[]): DocumentTreeNode[] => {
  const documentMap = new Map<string, DocumentTreeNode>()
  const rootNodes: DocumentTreeNode[] = []

  // First pass: create all nodes
  documents.forEach(doc => {
    documentMap.set(doc.id, {
      ...doc,
      children: [],
      expanded: false
    })
  })

  // Second pass: build tree structure
  documents.forEach(doc => {
    const node = documentMap.get(doc.id)!
    
    if (doc.parentId) {
      const parent = documentMap.get(doc.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        rootNodes.push(node)
      }
    } else {
      rootNodes.push(node)
    }
  })

  // Sort children by position
  const sortChildren = (nodes: DocumentTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position)
    nodes.forEach(node => sortChildren(node.children))
  }

  sortChildren(rootNodes)
  return rootNodes
}

export const flattenDocumentTree = (nodes: DocumentTreeNode[]): Document[] => {
  const result: Document[] = []
  
  const traverse = (nodes: DocumentTreeNode[]) => {
    nodes.forEach(node => {
      const { children, expanded, ...document } = node
      result.push(document)
      if (children.length > 0) {
        traverse(children)
      }
    })
  }
  
  traverse(nodes)
  return result
}

export const findDocumentInTree = (nodes: DocumentTreeNode[], id: string): DocumentTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const found = findDocumentInTree(node.children, id)
    if (found) {
      return found
    }
  }
  return null
}

// Type guards for runtime type checking
export const isDocument = (obj: any): obj is Document => {
  return obj && typeof obj === 'object' && validateDocument(obj)
}

export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && validateUser(obj)
}

export const isFileUpload = (obj: any): obj is FileUpload => {
  return obj && typeof obj === 'object' && validateFileUpload(obj)
}

export const isSession = (obj: any): obj is Session => {
  return obj && typeof obj === 'object' && validateSession(obj)
}