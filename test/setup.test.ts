import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should have basic TypeScript types available', () => {
    const testUser = {
      id: '123',
      username: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    expect(testUser.id).toBe('123')
    expect(testUser.username).toBe('test')
  })

  it('should have environment variables configured', () => {
    // These should be available in the test environment
    expect(process.env.NODE_ENV).toBeDefined()
  })
})