// db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment for Replit - use the DATABASE_URL environment variable
  // connectionString: process.env.DATABASE_URL,
});

// Create the drizzle instance with the schema
export const db = drizzle(pool, { schema });
