# Online Knowledge Base

A modern, secure knowledge management system built with Nuxt.js, TypeScript, and PostgreSQL. This system provides a comprehensive solution for creating, organizing, and searching through documentation with a rich Markdown editor and hierarchical document structure.

## ✨ Features

- 📝 **Rich Markdown Editing**: Powered by Vditor with WYSIWYG support
- 🗂️ **Hierarchical Organization**: Tree-structured document and folder management
- 🔍 **Full-Text Search**: PostgreSQL-powered search with highlighting and snippets
- 🔐 **Secure Authentication**: JWT-based authentication with session management
- 📱 **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- 🖼️ **Image Management**: Upload and optimize images with automatic compression
- ⚡ **High Performance**: Optimized loading with caching and lazy loading
- 🧪 **Comprehensive Testing**: Unit tests and property-based testing with Vitest

## 🛠️ Tech Stack

### Frontend
- **Framework**: Nuxt.js 4 with Vue 3 and TypeScript
- **UI Library**: Nuxt UI with Tailwind CSS
- **Editor**: Vditor (Markdown WYSIWYG editor)
- **State Management**: Pinia
- **Icons**: Nuxt Icon

### Backend
- **Runtime**: Nuxt Server API (Nitro)
- **Database**: PostgreSQL 14+ with full-text search
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Local filesystem with configurable upload directory

### Development & Testing
- **Testing**: Vitest with fast-check for property-based testing
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint and TypeScript strict mode
- **Development**: Hot module replacement and auto-restart

## 📋 Prerequisites

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Operating System**: Windows, macOS, or Linux

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd online-knowledge-base

# Install dependencies
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb online_knowledge_base

# Or using psql
psql -U postgres -c "CREATE DATABASE online_knowledge_base;"
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL="postgresql://username:password@localhost:5432/online_knowledge_base"
# JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# (Optional) Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
online-knowledge-base/
├── assets/css/              # Global styles and Tailwind configuration
├── components/              # Vue components
│   ├── DocumentEditor.vue  # Main document editor with Vditor
│   ├── DocumentTree.vue    # Hierarchical document tree
│   ├── Search*.vue         # Search components
│   └── ...
├── composables/             # Vue composables for shared logic
│   ├── useApi.ts           # API client with error handling
│   ├── useAuth.ts          # Authentication management
│   ├── useSearch.ts        # Search functionality
│   └── ...
├── lib/                     # Core business logic
│   ├── database.ts         # Database service layer
│   ├── auth.ts             # Authentication utilities
│   └── ...
├── pages/                   # Application routes
│   ├── index.vue           # Main application page
│   ├── login.vue           # Authentication page
│   └── documents/[id].vue  # Document detail page
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # Database schema definition
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # SQL migration files
├── server/                  # Server-side API and middleware
│   ├── api/                # API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   ├── documents/      # Document management endpoints
│   │   └── search.get.ts   # Search endpoint
│   └── middleware/         # Server middleware
├── stores/                  # Pinia state management
├── test/                    # Test files
├── types/                   # TypeScript type definitions
└── uploads/                 # File upload directory
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | - | ✅ |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` | ❌ |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |

### Database Configuration

The application uses PostgreSQL with the following features:
- **Full-text search** with tsvector and tsquery
- **Hierarchical data** using ltree for document paths
- **ACID transactions** for data consistency
- **Automatic indexing** for performance optimization

## 🧪 Testing

The project includes comprehensive testing with multiple strategies:

### Test Types

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test API endpoints and database operations
3. **Property-Based Tests**: Verify system properties across all inputs (optional)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- test/auth.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

Current test coverage includes:
- ✅ Authentication system (9/9 tests passing)
- ✅ Document management APIs (12/12 tests passing)
- ✅ Search functionality (5/5 tests passing)
- ✅ Editor components (9/9 tests passing)
- ✅ Document tree components (3/3 tests passing)
- ⚠️ Database-dependent integration tests (requires PostgreSQL)

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio for database management |
| `npm run setup:dev` | Setup development environment |

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

### Environment Setup

1. **Database**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Set production values in `.env`
3. **File Permissions**: Ensure upload directory is writable
4. **SSL**: Configure HTTPS in production

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Performance Considerations

- **Database Connection Pooling**: Configured automatically by Prisma
- **Static Asset Caching**: Handled by Nuxt.js build process
- **Image Optimization**: Automatic compression for uploaded images
- **Code Splitting**: Automatic route-based code splitting

## 🔒 Security

### Authentication
- JWT tokens with configurable expiration
- Secure HTTP-only cookies
- Password hashing with bcrypt
- Session management with database storage

### Data Protection
- SQL injection prevention via Prisma ORM
- XSS protection through Vue.js templating
- CSRF protection via SameSite cookies
- Input validation with Zod schemas

### File Upload Security
- File type validation
- Size limits enforcement
- Secure file storage outside web root
- Automatic file scanning (configurable)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify connection string
psql "postgresql://username:password@localhost:5432/online_knowledge_base"
```

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .nuxt
npm install
```

**Test Failures**
```bash
# Ensure database is running for integration tests
npm run db:migrate
npm test
```

### Performance Issues

1. **Slow Search**: Ensure database indexes are created
2. **Large File Uploads**: Check `MAX_FILE_SIZE` configuration
3. **Memory Usage**: Monitor Node.js heap size in production

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for new functionality
4. **Ensure** all tests pass (`npm test`)
5. **Commit** changes (`git commit -m 'Add amazing feature'`)
6. **Push** to branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure code passes linting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vditor** - Excellent Markdown editor
- **Nuxt.js** - Amazing Vue.js framework
- **Prisma** - Type-safe database toolkit
- **PostgreSQL** - Powerful open-source database
- **Tailwind CSS** - Utility-first CSS framework

---

**Built with ❤️ using modern web technologies**