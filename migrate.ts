// migrate.ts - Run database migrations
import { runMigrations, closeConnection } from './shared/drizzle-migrate';

async function migrate() {
  try {
    console.log('Starting database migration...');
    await runMigrations();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the migration
migrate();