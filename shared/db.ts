// db.ts - Database connection and migration utils
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

dotenv.config();

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('No DATABASE_URL environment variable set');
  console.error('Please set this in your .env file or Replit Secrets');
  process.exit(1);
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Useful for Replit environment
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// Create the drizzle instance with the schema
export const db = drizzle(pool, { schema });

// Function to run migrations safely, without dropping tables
export async function runSafeMigrations() {
  console.log('Running safe migrations...');
  
  try {
    // Ensure migrations directory and journal exist
    const migrationsDir = './migrations';
    const metaDir = './migrations/meta';
    
    // Create directories if they don't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    
    // Create journal file if it doesn't exist
    const journalPath = path.join(metaDir, '_journal.json');
    if (!fs.existsSync(journalPath)) {
      fs.writeFileSync(journalPath, JSON.stringify({ entries: [] }), 'utf-8');
      console.log('Created new migration journal file');
    }
    
    // Using drizzle-kit's migrate functionality which preserves existing data
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Function to close the database connection
export async function closeConnection() {
  await pool.end();
  console.log('Database connection closed');
}
