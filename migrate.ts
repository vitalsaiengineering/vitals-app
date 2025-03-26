
import { runMigrations, closeConnection } from './shared/db';

async function migrate() {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

migrate();
