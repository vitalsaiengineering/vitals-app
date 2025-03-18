import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const db = drizzle(pool);

  console.log("Running migrations...");

  // Using the path from the root drizzle.config.ts
  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("Migrations completed");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});