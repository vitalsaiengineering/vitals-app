# Safe Database Schema Management

This project includes tools for safely managing database schema changes while preserving existing tables and data.

## Database Migration Workflow

### 1. Update Schema Definitions

First, update your database schema definitions in `shared/schema.ts`. This is where you define your tables, relationships, and other database structures.

### 2. Generate and Apply Migrations Safely

Run the safe database push script to apply your schema changes:

```bash
./safe-db-push.sh
```

This script:
1. Generates migration files based on the differences between your schema and the database
2. Sanitizes the migration files to remove potentially destructive operations (DROP TABLE, etc.)
3. Applies the sanitized migrations to your database

### 3. How It Works

The migration process is designed to be non-destructive. It:

- Converts `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS` to preserve existing tables
- Removes `DROP TABLE` statements to prevent accidental data loss
- Removes `ALTER TABLE ... DROP` statements that would delete columns or constraints

### 4. Manual Steps (if needed)

In some cases, you might need to migrate data between tables or handle complex schema changes. Our tools won't automatically handle:

- Data migration between tables
- Renaming tables or columns (these appear as drops and creates)
- Complex constraint changes

For these cases, you'll need to write custom migration SQL scripts in the `migrations` directory.

### 5. Utility Scripts

- `generate-safe-migration.ts`: Generates and sanitizes migration files
- `migrate.ts`: Applies migrations to the database
- `safe-db-push.sh`: Combines both steps into a single convenient command

## Best Practices

1. **Never delete existing tables** - Instead, create new tables and migrate data if needed
2. **Use additive changes** - Add new columns/tables rather than modifying existing ones
3. **Backup first** - Always back up your database before applying schema changes
4. **Test migrations** - Test schema changes on a development database before production
5. **Review migration files** - Check the generated SQL files in the `migrations` directory before applying them

## Troubleshooting

If you encounter errors:

1. Check the migration files in the `migrations` directory
2. Look for any destructive operations that may have been missed by the sanitizer
3. If specific tables need to be modified in ways our tools don't support, consider writing custom SQL