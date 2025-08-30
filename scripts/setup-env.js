#!/usr/bin/env node

/**
 * Environment Setup Script for AgriConnect
 * This script helps developers set up their environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AgriConnect Environment Setup');
console.log('================================\n');

// Check if .env files exist
const envFiles = [
  '.env',
  'web/.env',
  'mobile/.env',
  'supabase/.env.local',
  'tests/.env'
];

console.log('📋 Checking environment files...\n');

envFiles.forEach(envFile => {
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${envFile} exists`);
  } else {
    console.log(`❌ ${envFile} missing`);
  }
});

console.log('\n📝 Required Environment Variables:');
console.log('==================================');

const requiredVars = {
  'SUPABASE_URL': 'Your Supabase project URL (e.g., https://xxx.supabase.co)',
  'SUPABASE_ANON_KEY': 'Your Supabase anonymous key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Your Supabase service role key (for admin operations)',
  'API_BASE_URL': 'Your Supabase Edge Functions URL (e.g., https://xxx.supabase.co/functions/v1)',
  'TEST_EMAIL': 'Test email for development (e.g., test@agriconnect.sn)',
  'TEST_PASSWORD': 'Test password for development (e.g., test123)',
  'TEST_PHONE': 'Test phone number for development (e.g., +221701234567)'
};

Object.entries(requiredVars).forEach(([varName, description]) => {
  console.log(`${varName}: ${description}`);
});

console.log('\n🚀 Setup Instructions:');
console.log('=====================');
console.log('1. Copy env.example files to .env files');
console.log('2. Fill in your actual values');
console.log('3. Never commit .env files to git');
console.log('4. Use environment variables in your code');

console.log('\n🔒 Security Notes:');
console.log('==================');
console.log('- Keep your service role key secret');
console.log('- Use environment variables instead of hardcoding values');
console.log('- The pre-commit hook will prevent sensitive data leaks');
console.log('- Test with dummy data in development');

console.log('\n📚 Documentation:');
console.log('=================');
console.log('- See tests/env.example for test configuration');
console.log('- See web/env.example for web app configuration');
console.log('- See mobile/env.example for mobile app configuration');
console.log('- See supabase/env.local.example for Supabase configuration');

console.log('\n✨ Happy coding!');
