// db-push.js - Safely push schema changes to the database without data loss
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import dotenv from 'dotenv';

// Get the directory name from the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically import the database module
const { db, runSafeMigrations, closeConnection } = await import('./shared/db.js');

dotenv.config();

console.log("Starting database schema push with safeguards...");

// First, generate migration files with drizzle-kit
console.log("1. Generating migration files...");
exec('npx drizzle-kit generate:pg', async (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating migrations: ${error.message}`);
    process.exit(1);
  }
  
  console.log(stdout);
  
  if (stderr && !stderr.includes('warn')) {
    console.error(`drizzle-kit stderr: ${stderr}`);
  }
  
  // Now run the migrations safely
  console.log("2. Applying migrations to database...");
  try {
    await runSafeMigrations();
    console.log("3. All database changes completed successfully!");
    await closeConnection();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    await closeConnection();
    process.exit(1);
  }
});