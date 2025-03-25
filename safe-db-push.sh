#!/bin/bash
# Safe database schema push that preserves existing tables

echo "Starting safe database schema push that preserves existing data..."

# First generate migrations
echo "1. Generating migration files..."
npx drizzle-kit generate:pg

# Check for migration files
if [ ! -d "migrations" ]; then
  echo "No migrations directory found. Creating one..."
  mkdir -p migrations
fi

# Sanitize migration files to remove DROP statements
echo "2. Sanitizing migration files to prevent data loss..."
find ./migrations -name "*.sql" -type f | while read file; do
  echo "Checking $file for destructive operations..."
  # Remove DROP statements
  sed -i 's/DROP TABLE IF EXISTS [^;]*;//g' "$file"
  # Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
  sed -i 's/CREATE TABLE \([^(]*\)/CREATE TABLE IF NOT EXISTS \1/g' "$file"
  # Remove ALTER TABLE ... DROP statements
  sed -i 's/ALTER TABLE [^;]* DROP [^;]*;//g' "$file"
  echo "Sanitized $file"
done

# Run migrations
echo "3. Running sanitized migrations..."
npx tsx migrate.ts

echo "Database schema updated successfully!"