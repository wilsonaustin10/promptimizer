#!/usr/bin/env node

/**
 * Generate secure keys for analytics deployment
 */

const crypto = require('crypto');

console.log('🔐 Generating secure keys for analytics deployment...\n');

// Generate encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ANALYTICS_ENCRYPTION_KEY=' + encryptionKey);
console.log('✓ 32-character hex encryption key generated\n');

// Generate sample database URL format
console.log('DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require');
console.log('✓ Use this format for your PostgreSQL database connection\n');

// Instructions
console.log('📋 Instructions:');
console.log('1. Save these environment variables securely');
console.log('2. Add them to Vercel using: vercel env add');
console.log('3. Never commit these values to your repository\n');

console.log('🔒 Security Notes:');
console.log('- The encryption key is used for AES-256 encryption');
console.log('- Always use SSL/TLS for database connections');
console.log('- Rotate keys periodically for best security\n');