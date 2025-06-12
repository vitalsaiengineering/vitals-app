-- Add new columns to clients table
ALTER TABLE clients 
ADD COLUMN date_of_birth DATE,
ADD COLUMN referred_by INTEGER REFERENCES users(id),
ADD COLUMN inception_date DATE;

-- Add indexes for performance on the new columns
CREATE INDEX idx_clients_date_of_birth ON clients(date_of_birth);
CREATE INDEX idx_clients_referred_by ON clients(referred_by);
CREATE INDEX idx_clients_inception_date ON clients(inception_date); 