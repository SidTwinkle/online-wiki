import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin user
  const hashedPassword = await hashPassword('admin123')
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      email: 'admin@example.com'
    }
  })

  console.log('✅ Created admin user:', admin.username)

  // Create a sample document structure
  const rootFolder = await prisma.document.create({
    data: {
      title: 'Welcome',
      type: 'folder',
      path: 'welcome',
      position: 0,
      createdBy: admin.id
    }
  })

  const welcomeDoc = await prisma.document.create({
    data: {
      title: 'Getting Started',
      content: `# Welcome to Your Knowledge Base

This is your personal knowledge management system. Here you can:

- 📝 Create and edit documents using Markdown
- 🗂️ Organize content in folders
- 🔍 Search across all your documents
- 🖼️ Upload and manage images

## Quick Start

1. Click the "+" button to create a new document or folder
2. Use the editor to write in Markdown format
3. Your changes are automatically saved
4. Use the search bar to find content quickly

Happy writing! 🚀`,
      type: 'document',
      parentId: rootFolder.id,
      path: 'welcome/getting-started',
      position: 0,
      createdBy: admin.id
    }
  })

  console.log('✅ Created sample documents')
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })