// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    // Use environment variables for credentials
    connectionString: process.env.DATABASE_URL || "",
  },
} satisfies Config;

// Setup instructions:
/*
To set up and use this schema in a Replit:

1. Create a new Node.js or TypeScript Replit
2. Install the required dependencies:

npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg ts-node typescript

3. Create the files:
   - schema.ts (from the first artifact)
   - db.ts (from the second artifact)
   - drizzle.config.ts (from this artifact)

4. Set up your DATABASE_URL in the Replit environment variables
   - Go to Tools -> Secrets
   - Add a new secret with key DATABASE_URL and your PostgreSQL connection string

5. Generate migrations:

npx drizzle-kit generate:pg

6. Create a migrate.ts file to run the migrations:
*/

// migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed");

  await pool.end();
}

runMigrations().catch(console.error);

/*
7. Run the migrations:

npx ts-node migrate.ts

8. Now you can use your schema as shown in the example.ts file!
*/
