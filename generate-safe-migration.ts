// generate-safe-migration.ts
// This script generates migration files without dropping existing tables
import { exec } from 'child_process';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * This function checks if migration files contain any DROP statements and removes them
 */
function sanitizeMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Creating one...');
    fs.mkdirSync(migrationsDir, { recursive: true });
    return;
  }
  
  console.log('Scanning migration files to ensure they are non-destructive...');
  
  // Get all SQL files
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'));
  
  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove any DROP statements which could destroy existing data
    let modified = content.replace(/DROP\s+TABLE(\s+IF\s+EXISTS)?\s+[^;]+;/gi, '-- DROP statement removed for safety\n');
    
    // Also remove ALTER TABLE statements that might contain data loss operations
    modified = modified.replace(/(ALTER\s+TABLE\s+[^\s]+\s+DROP\s+[^;]+;)/gi, '-- $1 -- Removed for safety\n');
    
    // Ensure CREATE TABLE statements use IF NOT EXISTS
    modified = modified.replace(/CREATE\s+TABLE(?!\s+IF\s+NOT\s+EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS');
    
    // Write back the modified content
    if (content !== modified) {
      console.log(`Sanitized potentially destructive statements in ${file}`);
      fs.writeFileSync(filePath, modified);
    }
  }
  
  console.log('Migration files have been checked and sanitized if needed');
}

/**
 * Generate migration files using drizzle-kit
 */
function generateMigrations() {
  console.log('Generating migration files...');
  
  // Execute the drizzle-kit generate command
  const child = exec('npx drizzle-kit generate:pg', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating migrations: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`drizzle-kit stderr: ${stderr}`);
    }
    
    console.log(stdout);
    console.log('Migrations generated successfully');
    
    // After generating, sanitize the files to ensure they don't break anything
    sanitizeMigrationFiles();
  });
  
  // Forward stdout and stderr to console
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
}

// Run the function
generateMigrations();