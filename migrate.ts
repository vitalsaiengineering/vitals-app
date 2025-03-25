// Enhanced migration script that preserves existing tables
import { runSafeMigrations, closeConnection } from './shared/db';
import dotenv from 'dotenv';

dotenv.config();

console.log("Starting safe migrations that won't drop existing tables...");

// Run the safer migrations function from db.ts
runSafeMigrations()
  .then(() => {
    console.log("Migrations completed successfully");
    closeConnection().then(() => process.exit(0));
  })
  .catch((err) => {
    console.error("Migration failed", err);
    closeConnection().then(() => process.exit(1));
  });