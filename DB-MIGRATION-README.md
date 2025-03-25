# Safe Database Migration Tools

This document explains how to use the database migration tools in this project. The system is designed to safely apply schema changes to your PostgreSQL database without risking data loss by avoiding destructive operations like dropping tables.

## Overview

The migration system consists of:

1. **Drizzle ORM** - An ORM that provides type-safe SQL queries and schema management
2. **Drizzle Kit** - A schema migration toolkit to generate SQL migrations
3. **Custom migration logic** - Scripts that apply migrations in a safe, non-destructive manner

## Migration Commands

### Option 1: Shell Script (Recommended)

Run the following command to generate and apply migrations:

```bash
./safe-db-push.sh
```

This script will:
1. Generate SQL migration files based on your schema
2. Run these migrations safely, preserving existing tables and data

### Option 2: Node.js Script

If you prefer to use a JavaScript interface, you can run:

```bash
node db-push.js
```

This performs the same operations as the shell script but from Node.js.

## How It Works

The migration process follows these steps:

1. **Schema Detection**: Drizzle analyzes your schema defined in `shared/schema.ts`
2. **Migration Generation**: SQL migration files are generated in the `migrations` directory
3. **Safe Application**: Migrations are applied with safeguards to prevent data loss

Specifically, our system:
- Creates tables only if they don't exist
- Adds new columns to existing tables
- Creates new relationships and constraints
- Avoids dropping tables or columns

## Troubleshooting

If you encounter issues:

1. Check the database connection string in your environment variables
2. Ensure your schema is correctly defined in `shared/schema.ts`
3. Review error messages for specific SQL issues
4. If needed, manually check the generated SQL in the `migrations` directory

## Advanced: Manual Migration Management

In some cases, you might want to manage migrations manually:

1. Generate migrations: `npx drizzle-kit generate:pg`
2. Review the generated SQL files in the `migrations` directory
3. Apply migrations: `npx tsx migrate.ts`

## Database Connection

The application automatically connects to the PostgreSQL database using the `DATABASE_URL` environment variable, which is already set up in the Replit environment.