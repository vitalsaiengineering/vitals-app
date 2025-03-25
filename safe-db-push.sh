#!/bin/bash
# Safe database schema push that preserves existing tables

echo "Starting safe database schema push that preserves existing data..."

# Step 1: Generate migrations with drizzle-kit
echo "1. Generating migration files with drizzle-kit..."
npx drizzle-kit generate:pg

# Step 2: Run migrations script which uses the safer version
echo "2. Running migrations..."
npx tsx migrate.ts

echo "Database schema updated successfully!"