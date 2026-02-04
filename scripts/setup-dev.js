#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up development environment...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from .env.example...');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env file created. Please update DATABASE_URL and JWT_SECRET\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Create uploads directory
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created\n');
} else {
  console.log('✅ Uploads directory already exists\n');
}

console.log('🎉 Development environment setup complete!');
console.log('\nNext steps:');
console.log('1. Update DATABASE_URL in .env with your PostgreSQL credentials');
console.log('2. Update JWT_SECRET in .env with a secure random string');
console.log('3. Run: npm run db:migrate');
console.log('4. Run: npm run db:seed');
console.log('5. Run: npm run dev');