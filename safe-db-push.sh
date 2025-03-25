#!/bin/bash
# Safe database schema push that preserves existing tables

echo "Starting safe database schema push that preserves existing data..."

# Generate and sanitize migrations with TypeScript
echo "1. Generating and sanitizing migration files..."
npx tsx generate-safe-migration.ts

# Run migrations
echo "2. Running sanitized migrations..."
npx tsx migrate.ts

echo "Database schema updated successfully!"