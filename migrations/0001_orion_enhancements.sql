-- Migration: Comprehensive Orion integration with enhanced clients table
-- This migration adds necessary fields, indexes, and optimized tables to support Orion data storage

-- Add Orion-specific fields to existing clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS orion_client_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS wealthbox_client_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS aum DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS representative_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS representative_id INTEGER,
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Make age, email_address, and phone_number nullable if they aren't already
ALTER TABLE clients 
ALTER COLUMN age DROP NOT NULL,
ALTER COLUMN email_address DROP NOT NULL,
ALTER COLUMN phone_number DROP NOT NULL;


-- Create indexes for better performance on existing tables
CREATE INDEX IF NOT EXISTS idx_clients_orion_client_id ON clients(orion_client_id);
CREATE INDEX IF NOT EXISTS idx_clients_wealthbox_client_id ON clients(wealthbox_client_id);
CREATE INDEX IF NOT EXISTS idx_clients_email_address ON clients(email_address);
CREATE INDEX IF NOT EXISTS idx_clients_aum ON clients(aum) WHERE aum > 0;
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_representative_name ON clients(representative_name);
CREATE INDEX IF NOT EXISTS idx_clients_representative_id ON clients(representative_id);
CREATE INDEX IF NOT EXISTS idx_clients_start_date ON clients(start_date);
CREATE INDEX IF NOT EXISTS idx_clients_active_aum ON clients(is_active, aum DESC) WHERE is_active = true AND aum > 0;

-- Create Orion account data table for storing detailed account integration data
CREATE TABLE IF NOT EXISTS orion_account_data (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  orion_account_id VARCHAR(100) NOT NULL,
  firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id) ON DELETE CASCADE,
  
  -- Core account information from Orion
  name VARCHAR(255),
  number VARCHAR(100),
  account_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  
  -- Financial data
  current_value DECIMAL(20,2),
  account_start_value DECIMAL(20,2),
  
  -- Dates
  account_start_date DATE,
  cancel_date DATE,
  
  -- Management and custodian information
  custodian VARCHAR(255),
  management_style VARCHAR(255),
  management_style_id INTEGER,
  fund_family VARCHAR(255),
  fund_family_id INTEGER,
  registration_id INTEGER,
  model_name VARCHAR(255),
  sub_advisor VARCHAR(255),
  
  -- Representative information
  representative VARCHAR(255),
  representative_id INTEGER,
  
  -- Client and household information
  client_id_orion INTEGER, -- Orion's client ID (different from our internal client_id)
  household VARCHAR(255),
  
  -- JSONB fields for additional data
  raw_data JSONB NOT NULL DEFAULT '{}',
  mapped_data JSONB NOT NULL DEFAULT '{}',
  balance_data JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  holdings_data JSONB DEFAULT '{}',
  
  -- Timestamps
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(orion_account_id, firm_integration_config_id)
);

-- Create indexes for the Orion account data table
CREATE INDEX IF NOT EXISTS idx_orion_account_data_portfolio_id ON orion_account_data(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_orion_account_id ON orion_account_data(orion_account_id);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_firm_config ON orion_account_data(firm_integration_config_id);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_last_synced ON orion_account_data(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_is_active ON orion_account_data(is_active);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_account_type ON orion_account_data(account_type);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_custodian ON orion_account_data(custodian);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_representative_id ON orion_account_data(representative_id);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_client_id_orion ON orion_account_data(client_id_orion);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_current_value ON orion_account_data(current_value) WHERE current_value > 0;
CREATE INDEX IF NOT EXISTS idx_orion_account_data_account_start_date ON orion_account_data(account_start_date);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_management_style_id ON orion_account_data(management_style_id);
CREATE INDEX IF NOT EXISTS idx_orion_account_data_fund_family_id ON orion_account_data(fund_family_id);

-- Drop the existing orion_aum_history table if it exists (we'll recreate it optimized)
DROP TABLE IF EXISTS orion_aum_history CASCADE;

-- Create optimized orion_aum_history table for performance and new data format
CREATE TABLE orion_aum_history (
    -- Primary key for internal use
    internal_id BIGSERIAL PRIMARY KEY,
    
    -- Orion entity ID (the "id" field from Orion API)
    orion_entity_id INTEGER NOT NULL,
    

    
    -- Date field (using DATE type for better performance on date queries)
    as_of_date DATE NOT NULL,
    
    -- AUM value (using DECIMAL for precise financial calculations)
    value DECIMAL(20,2) NOT NULL DEFAULT 0,
    
    -- Currency (defaulting to USD)
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    
    -- Reference to firm integration config
    firm_integration_config_id INTEGER NOT NULL REFERENCES firm_integration_configs(id) ON DELETE CASCADE,
    
    -- Raw data from Orion API (for debugging/audit purposes)
    raw_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE(orion_entity_id, as_of_date, firm_integration_config_id)
);

-- Create optimized indexes for fast retrieval of AUM history data
-- Primary lookup index: entity + date range queries
CREATE INDEX idx_orion_aum_entity_date ON orion_aum_history(orion_entity_id, as_of_date DESC);



-- Date range queries (most common for time series data)
CREATE INDEX idx_orion_aum_date_only ON orion_aum_history(as_of_date DESC);

-- Firm-specific queries
CREATE INDEX idx_orion_aum_firm_config ON orion_aum_history(firm_integration_config_id);



-- Value-based queries (for finding records above/below certain thresholds)
CREATE INDEX idx_orion_aum_value ON orion_aum_history(value) WHERE value > 0;

-- Partial index for recent data (last 2 years) - most frequently accessed
-- Note: Using a fixed date instead of CURRENT_DATE to avoid IMMUTABLE function requirement
CREATE INDEX idx_orion_aum_recent ON orion_aum_history(orion_entity_id, as_of_date DESC) 
WHERE as_of_date >= '2022-01-01';

-- Comprehensive index for time series function optimization
CREATE INDEX idx_orion_aum_time_series ON orion_aum_history(orion_entity_id, as_of_date DESC, firm_integration_config_id);


-- Create a function for efficient bulk inserts of AUM history data
CREATE OR REPLACE FUNCTION insert_orion_aum_batch(
    p_data JSONB,
    p_firm_integration_config_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
    aum_record JSONB;
BEGIN
    -- Loop through the JSON array and insert each record
    FOR aum_record IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        INSERT INTO orion_aum_history (
            orion_entity_id,
            as_of_date,
            value,
            firm_integration_config_id,
            raw_data
        ) VALUES (
            (aum_record->>'id')::INTEGER,
            (aum_record->>'asOfDate')::DATE,
            (aum_record->>'value')::DECIMAL(20,2),
            p_firm_integration_config_id,
            aum_record
        )
        ON CONFLICT (orion_entity_id, as_of_date, firm_integration_config_id) 
        DO UPDATE SET 
            value = EXCLUDED.value,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW();
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function for efficient time series queries
CREATE OR REPLACE FUNCTION get_orion_aum_time_series(
    p_orion_entity_id INTEGER,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_firm_integration_config_id INTEGER DEFAULT NULL
) RETURNS TABLE (
    as_of_date DATE,
    value DECIMAL(20,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.as_of_date,
        h.value
    FROM orion_aum_history h
    WHERE h.orion_entity_id = p_orion_entity_id
        AND (p_start_date IS NULL OR h.as_of_date >= p_start_date)
        AND (p_end_date IS NULL OR h.as_of_date <= p_end_date)
        AND (p_firm_integration_config_id IS NULL OR h.firm_integration_config_id = p_firm_integration_config_id)
    ORDER BY h.as_of_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function for efficient upsert of Orion client data into the clients table
CREATE OR REPLACE FUNCTION upsert_orion_client_data(
    p_data JSONB,
    p_firm_id INTEGER,
    p_advisor_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    client_record JSONB;
    client_name VARCHAR(500);
    existing_client_id INTEGER;
    new_client_id INTEGER;
BEGIN
    -- Loop through the JSON array and insert/update each client record
    FOR client_record IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        -- Extract the client name
        client_name := client_record->>'name';
        
        -- Check if client already exists by name and firm
        SELECT id INTO existing_client_id 
        FROM clients 
        WHERE (first_name || ' ' || last_name) = client_name 
           OR (last_name || ', ' || first_name) = client_name
           OR CONCAT(first_name, ' ', last_name) = client_name
           AND firm_id = p_firm_id
        LIMIT 1;
        
        IF existing_client_id IS NOT NULL THEN
            -- Update existing client
            UPDATE clients SET
                orion_client_id = (client_record->>'id')::VARCHAR(100),
                aum = COALESCE((client_record->>'aum')::DECIMAL(20,2), 0),
                is_active = COALESCE((client_record->>'isActive')::BOOLEAN, true),
                representative_name = client_record->>'representativeName',
                representative_id = (client_record->>'representativeId')::INTEGER,
                start_date = (client_record->>'startDate')::DATE,
                updated_at = NOW()
            WHERE id = existing_client_id;
        ELSE
            -- Create new client
            INSERT INTO clients (
                orion_client_id,
                firm_id,
                primary_advisor_id,
                first_name,
                last_name,
                aum,
                is_active,
                representative_name,
                representative_id,
                start_date,
                source,
                status,
                created_at,
                updated_at
            ) VALUES (
                (client_record->>'id')::VARCHAR(100),
                p_firm_id,
                p_advisor_id,
                COALESCE(client_record->>'firstName', SPLIT_PART(client_name, ' ', 1)),
                COALESCE(client_record->>'lastName', SPLIT_PART(client_name, ' ', 2)),
                COALESCE((client_record->>'aum')::DECIMAL(20,2), 0),
                COALESCE((client_record->>'isActive')::BOOLEAN, true),
                client_record->>'representativeName',
                (client_record->>'representativeId')::INTEGER,
                (client_record->>'startDate')::DATE,
                'orion',
                'active',
                NOW(),
                NOW()
            ) RETURNING id INTO new_client_id;
        END IF;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql; 


-- Add comments for documentation
COMMENT ON TABLE orion_account_data IS 'Stores Orion-specific account/portfolio data that extends the main portfolios table';
COMMENT ON TABLE orion_aum_history IS 'Optimized storage for Orion AUM historical data with performance indexes for large datasets';

COMMENT ON COLUMN clients.orion_client_id IS 'Orion client ID for integration';
COMMENT ON COLUMN clients.aum IS 'Assets Under Management from Orion';
COMMENT ON COLUMN clients.is_active IS 'Whether the client is active in Orion';
COMMENT ON COLUMN clients.representative_name IS 'Representative name from Orion';
COMMENT ON COLUMN clients.representative_id IS 'Representative ID from Orion';
COMMENT ON COLUMN clients.start_date IS 'Client start date from Orion';

COMMENT ON COLUMN orion_account_data.name IS 'Account name from Orion';
COMMENT ON COLUMN orion_account_data.number IS 'Account number from Orion';
COMMENT ON COLUMN orion_account_data.account_type IS 'Account type (e.g., Joint, Individual) from Orion';
COMMENT ON COLUMN orion_account_data.is_active IS 'Whether the account is active in Orion';
COMMENT ON COLUMN orion_account_data.current_value IS 'Current account value from Orion';
COMMENT ON COLUMN orion_account_data.account_start_value IS 'Initial account value when opened';
COMMENT ON COLUMN orion_account_data.account_start_date IS 'Date when account was opened';
COMMENT ON COLUMN orion_account_data.cancel_date IS 'Date when account was cancelled (if applicable)';
COMMENT ON COLUMN orion_account_data.custodian IS 'Custodian name (e.g., Schwab) from Orion';
COMMENT ON COLUMN orion_account_data.management_style IS 'Management style description from Orion';
COMMENT ON COLUMN orion_account_data.management_style_id IS 'Management style ID from Orion';
COMMENT ON COLUMN orion_account_data.fund_family IS 'Fund family name from Orion';
COMMENT ON COLUMN orion_account_data.fund_family_id IS 'Fund family ID from Orion';
COMMENT ON COLUMN orion_account_data.registration_id IS 'Registration ID from Orion';
COMMENT ON COLUMN orion_account_data.model_name IS 'Model name from Orion';
COMMENT ON COLUMN orion_account_data.sub_advisor IS 'Sub-advisor name from Orion';
COMMENT ON COLUMN orion_account_data.representative IS 'Representative name from Orion';
COMMENT ON COLUMN orion_account_data.representative_id IS 'Representative ID from Orion';
COMMENT ON COLUMN orion_account_data.client_id_orion IS 'Orion client ID (different from our internal client_id)';
COMMENT ON COLUMN orion_account_data.household IS 'Household name from Orion';
COMMENT ON COLUMN orion_account_data.raw_data IS 'Raw JSON data from Orion API /Portfolio/Accounts endpoint';
COMMENT ON COLUMN orion_account_data.mapped_data IS 'Processed and mapped data for application use';
COMMENT ON COLUMN orion_account_data.balance_data IS 'Account balance and valuation data';
COMMENT ON COLUMN orion_account_data.performance_data IS 'Performance metrics and returns data';
COMMENT ON COLUMN orion_account_data.holdings_data IS 'Portfolio holdings and asset allocation data';

COMMENT ON COLUMN orion_aum_history.orion_entity_id IS 'Orion entity ID from the API response';

COMMENT ON COLUMN orion_aum_history.as_of_date IS 'Date of the AUM value';
COMMENT ON COLUMN orion_aum_history.value IS 'AUM value in the specified currency';
COMMENT ON COLUMN orion_aum_history.raw_data IS 'Complete raw JSON data from Orion API for audit purposes';