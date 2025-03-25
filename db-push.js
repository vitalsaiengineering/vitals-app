/**
 * This is a Node.js wrapper for running the safe database push
 * It's useful for scenarios where you don't want to execute the shell script directly
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting safe database push via Node.js...');

try {
  // Get script directory
  const scriptDir = __dirname;
  
  // Execute the TypeScript version directly using tsx
  console.log('Running safe database migrations...');
  
  // First generate migrations with drizzle-kit
  console.log('1. Generating migration files with drizzle-kit...');
  execSync('npx drizzle-kit generate:pg', { 
    stdio: 'inherit',
    cwd: scriptDir 
  });
  
  // Then apply them using the migrate script (which uses drizzle-migrate)
  console.log('2. Running migrations...');
  execSync('npx tsx migrate.ts', { 
    stdio: 'inherit',
    cwd: scriptDir 
  });
  
  console.log('Database schema updated successfully!');
} catch (error) {
  console.error('Database push failed:', error.message);
  process.exit(1);
}