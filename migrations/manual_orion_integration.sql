-- Add integrationType column to advisor_auth_tokens table
ALTER TABLE IF EXISTS "advisor_auth_tokens" 
  ADD COLUMN IF NOT EXISTS "integration_type" integer DEFAULT 1 NOT NULL;

-- Rename user_id to advisor_id in advisor_auth_tokens table
ALTER TABLE IF EXISTS "advisor_auth_tokens" 
  RENAME COLUMN "user_id" TO "advisor_id";

-- Make firm_integration_config_id optional
ALTER TABLE IF EXISTS "advisor_auth_tokens" 
  ALTER COLUMN "firm_integration_config_id" DROP NOT NULL;