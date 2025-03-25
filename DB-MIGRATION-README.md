# Database Migration System

This project includes a carefully designed database migration system that supports safe schema changes without destroying existing data or tables. The system is built on Drizzle ORM and supports PostgreSQL.

## Overview

The database migration system includes the following components:

1. **Schema Definition** - Located in `shared/schema.ts`, this file defines your database schema using Drizzle ORM.
2. **Migration Engine** - Located in `shared/drizzle-migrate.ts`, this file handles the actual migration process.
3. **Migration Runner** - The `migrate.ts` script applies schema migrations to the database.
4. **Safe DB Push** - The `safe-db-push.sh` script provides a safe wrapper to push schema changes without data loss.
5. **Node.js Wrapper** - The `db-push.js` file provides a Node.js interface to the safe DB push process.

## How It Works

When you run `npm run db:push`, the system:

1. Generates SQL migration files from your `schema.ts` file 
2. Processes those migrations with extra safety measures:
   - Using `IF NOT EXISTS` for table creation
   - Handling PL/pgSQL dollar-quoted blocks correctly
   - Gracefully handling cases where objects already exist
   - Running complex SQL blocks separately when needed

## Commands

### Push Database Schema Changes

To safely push schema changes to the database without data loss:

```bash
npm run db:push
```

This is the safest way to update your database schema as it:
- Won't drop existing tables 
- Uses `IF NOT EXISTS` clauses for objects
- Handles errors gracefully without stopping the entire migration

### Running Migrations Directly

To execute migrations directly:

```bash
npm run db:migrate
```

This runs the SQL migration files in the `/migrations` folder directly.

## Technical Details

### Error Handling

The migration system handles the following SQL error codes in a special way:

- `42P07` - Relation already exists
- `42710` - Duplicate object
- `42701` - Duplicate column
- `23505` - Duplicate key value

When these errors occur, the system logs them but continues with the migration process.

### SQL Block Processing

For complex SQL blocks like DO blocks with $$ delimiters, the system:

1. First tries to execute them as separate queries
2. Removes them from the SQL file after success  
3. Falls back to statement-by-statement processing for the rest of the file

### Schema Safety

The generated migration SQL includes several safety features:

- DO blocks for enum creation with exception handling
- `IF NOT EXISTS` clauses for table creation
- PL/pgSQL blocks for safe index creation

## Best Practices

1. **Keep Schema Files Updated**: Always keep your `schema.ts` file up to date with your database schema.
2. **Review Migrations**: Before running `npm run db:push` in production, review the generated SQL.
3. **Back Up First**: Always back up your database before significant schema changes.
4. **Test Migrations**: Test migrations in development before applying to production.

## Troubleshooting

- If you see errors about relations already existing, this is normal and expected
- If a migration fails completely, check the error message for details
- If you need to modify a table in a way that might cause data loss, you may need to manually manage that specific migration