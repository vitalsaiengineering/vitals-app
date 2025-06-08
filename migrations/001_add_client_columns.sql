-- Add new columns to clients table
ALTER TABLE clients 
ADD COLUMN title VARCHAR(255),
ADD COLUMN contact_type VARCHAR(100),
ADD COLUMN segment VARCHAR(100);

-- Add indexes for performance on the new columns
CREATE INDEX idx_clients_contact_type ON clients(contact_type);
CREATE INDEX idx_clients_segment ON clients(segment); 