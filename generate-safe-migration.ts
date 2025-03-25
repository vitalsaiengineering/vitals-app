/**
 * This script safely generates migrations that won't drop existing tables
 * It's designed to respect existing database structures while applying new schema changes
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * This function checks if migration files contain any DROP statements and removes them
 */
function sanitizeMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Creating it...');
    fs.mkdirSync(migrationsDir, { recursive: true });
    return;
  }
  
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(migrationsDir, file));
  
  for (const file of sqlFiles) {
    console.log(`Sanitizing migration file: ${file}`);
    let content = fs.readFileSync(file, 'utf-8');
    
    // Remove DROP TABLE statements
    content = content.replace(/DROP TABLE IF EXISTS [^;]*;/g, '');
    
    // Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
    content = content.replace(/CREATE TABLE ([^(]*)/g, 'CREATE TABLE IF NOT EXISTS $1');
    
    // Remove ALTER TABLE ... DROP statements
    content = content.replace(/ALTER TABLE [^;]* DROP [^;]*;/g, '');
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`File sanitized: ${file}`);
  }
}

/**
 * Generate migration files using drizzle-kit
 */
async function generateMigrations() {
  console.log('Generating migration files...');
  
  try {
    const { stdout, stderr } = await execAsync('npx drizzle-kit generate:pg');
    
    console.log(stdout);
    
    if (stderr && !stderr.includes('warn')) {
      console.error(`drizzle-kit stderr: ${stderr}`);
    }
  } catch (error) {
    console.error(`Error generating migrations: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to run the safe migration process
 */
async function main() {
  try {
    console.log('Starting safe migration generation process...');
    
    // First generate the migrations
    await generateMigrations();
    
    // Then sanitize them to make them safe
    sanitizeMigrationFiles();
    
    console.log('Safe migrations generated successfully!');
    console.log('You can now apply them with: npx tsx migrate.ts');
    
  } catch (error) {
    console.error('Migration generation failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();