// db.ts - Database connection and migration utils
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

dotenv.config();

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('No DATABASE_URL environment variable set');
  console.error('Please set this in your .env file or Replit Secrets');
  process.exit(1);
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Useful for Replit environment
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

// Create the drizzle instance with the schema
export const db = drizzle(pool, { schema });

// Function to run migrations from SQL files
export async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Ensure the migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('Created migrations directory');
    }
    
    // Generate the migration SQL if it doesn't exist
    const migrationFile = path.join(migrationsDir, '0000_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      console.log('Generating initial migration file...');
      const sql = generateInitialMigration();
      fs.writeFileSync(migrationFile, sql);
      console.log('Created initial migration file');
    }
    
    // Run the migrations
    for (const file of fs.readdirSync(migrationsDir).sort()) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          // For SQL with complex structures like DO blocks with $$ delimiters,
          // we need to execute the entire file at once
          try {
            await pool.query(sql);
            console.log(`Migration ${file} applied as a whole script`);
            continue; // Go to the next file since we applied this one completely
          } catch (error) {
            console.log(`Failed to apply entire migration file, trying statement by statement: ${error.message}`);
          }
          
          // Fallback: Split SQL by statements to handle them individually
          // and allow some statements to fail (like CREATE INDEX if already exists)
          const statements = sql.split(';').filter(stmt => stmt.trim());
          
          for (const statement of statements) {
            if (!statement.trim()) continue;
            
            try {
              await pool.query(statement + ';');
            } catch (error) {
              const stmtError = error as { code?: string; message?: string };
              // Log the error but continue if it's just about something already existing
              if (stmtError.code === '42P07' || // relation already exists
                  stmtError.code === '42710' || // duplicate object
                  stmtError.code === '42701' || // duplicate column
                  stmtError.code === '23505') { // duplicate key value violates unique constraint
                console.log(`Notice: Item already exists, continuing... (${stmtError.message || 'Unknown error'})`);
              } else {
                throw error;
              }
            }
          }
          
          console.log(`Migration ${file} completed`);
        } catch (error) {
          console.error(`Error running migration ${file}:`, error);
          throw error;
        }
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Function to close the database connection
export async function closeConnection() {
  await pool.end();
  console.log('Database connection closed');
}

// Function to generate the initial migration SQL
function generateInitialMigration() {
  return `-- Initial schema migration
  
-- Create enums
CREATE TYPE organization_type AS ENUM ('global', 'multi_network', 'network', 'firm');
CREATE TYPE role_name AS ENUM ('global_admin', 'multi_network_admin', 'network_admin', 'firm_admin', 'advisor');
CREATE TYPE status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE access_level AS ENUM ('read', 'write', 'admin');

-- Create tables
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name role_name NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type organization_type NOT NULL,
  parent_id INTEGER REFERENCES organizations(id),
  external_id VARCHAR(100),
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  organization_id INTEGER REFERENCES organizations(id),
  external_id VARCHAR(100),
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_hierarchy (
  id SERIAL PRIMARY KEY,
  parent_org_id INTEGER NOT NULL REFERENCES organizations(id),
  child_org_id INTEGER NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  api_version VARCHAR(20) NOT NULL,
  endpoint_base_url VARCHAR(255) NOT NULL,
  required_credentials JSONB NOT NULL,
  default_field_mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firm_integration_configs (
  id SERIAL PRIMARY KEY,
  integration_type_id INTEGER NOT NULL REFERENCES integration_types(id),
  firm_id INTEGER NOT NULL REFERENCES organizations(id),
  credentials JSONB NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firm_data_mappings (
  id SERIAL PRIMARY KEY,
  firm_id INTEGER NOT NULL REFERENCES organizations(id),
  integration_type_id INTEGER NOT NULL REFERENCES integration_types(id),
  entity_type VARCHAR(50) NOT NULL,
  source_field VARCHAR(100) NOT NULL,
  target_field VARCHAR(100) NOT NULL,
  transformation_rule TEXT,
  mapping_rules JSONB DEFAULT '{}',
  matching_criteria JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advisor_integration_access (
  id SERIAL PRIMARY KEY,
  advisor_id INTEGER NOT NULL REFERENCES users(id),
  firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id),
  can_access BOOLEAN NOT NULL DEFAULT FALSE,
  access_scope JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wealthbox_users (
  id SERIAL PRIMARY KEY,
  firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id),
  external_id VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  mapped_user_id INTEGER REFERENCES users(id),
  raw_data JSONB NOT NULL,
  mapped_data JSONB NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_data_storage (
  id SERIAL PRIMARY KEY,
  firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id),
  data_type VARCHAR(50) NOT NULL,
  external_id VARCHAR(100),
  raw_data JSONB NOT NULL,
  mapped_data JSONB NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_entity_mappings (
  id SERIAL PRIMARY KEY,
  firm_id INTEGER NOT NULL REFERENCES organizations(id),
  primary_entity_type VARCHAR(50) NOT NULL,
  primary_integration_id INTEGER NOT NULL REFERENCES integration_types(id),
  primary_external_id VARCHAR(100) NOT NULL,
  secondary_entity_type VARCHAR(50) NOT NULL,
  secondary_integration_id INTEGER NOT NULL REFERENCES integration_types(id),
  secondary_external_id VARCHAR(100),
  mapping_confidence REAL DEFAULT 0,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100),
  firm_id INTEGER NOT NULL REFERENCES organizations(id),
  primary_advisor_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_info JSONB NOT NULL DEFAULT '{}',
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_advisor_relationships (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  advisor_id INTEGER NOT NULL REFERENCES users(id),
  relationship_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),
  account_type VARCHAR(50),
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
  symbol VARCHAR(20),
  asset_type VARCHAR(50) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  market_value VARCHAR(50) NOT NULL,
  valuation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  estimated_value VARCHAR(50),
  stage VARCHAR(50),
  close_date TIMESTAMP WITH TIME ZONE,
  wealthbox_user_id INTEGER NOT NULL REFERENCES wealthbox_users(id),
  client_id INTEGER REFERENCES clients(id),
  raw_data JSONB NOT NULL,
  mapped_data JSONB NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'wealthbox',
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_access_policies (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  data_type VARCHAR(50) NOT NULL,
  access_rules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_data_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  data_access_policy_id INTEGER NOT NULL REFERENCES data_access_policies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_firm_integration_configs_firm_id ON firm_integration_configs(firm_id);
CREATE INDEX idx_firm_integration_configs_integration_type_id ON firm_integration_configs(integration_type_id);
CREATE INDEX idx_firm_data_mappings_firm_id ON firm_data_mappings(firm_id);
CREATE INDEX idx_firm_data_mappings_integration_type_id ON firm_data_mappings(integration_type_id);
CREATE INDEX idx_wealthbox_users_firm_integration_config_id ON wealthbox_users(firm_integration_config_id);
CREATE INDEX idx_wealthbox_users_mapped_user_id ON wealthbox_users(mapped_user_id);
CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_primary_advisor_id ON clients(primary_advisor_id);
CREATE INDEX idx_opportunities_wealthbox_user_id ON opportunities(wealthbox_user_id);
CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_portfolios_client_id ON portfolios(client_id);
CREATE INDEX idx_assets_portfolio_id ON assets(portfolio_id);
`;
}