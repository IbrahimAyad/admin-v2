-- Database cleanup script for payment provider TypeORM error
-- This fixes the "Empty criteria(s) are not allowed for the update method" error

-- Clean up any corrupted payment provider records
DELETE FROM payment_provider WHERE id IS NULL OR id = '';

-- Ensure payment providers have proper default configurations
INSERT INTO payment_provider (id, is_installed) 
SELECT 'manual', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'manual');

INSERT INTO payment_provider (id, is_installed) 
SELECT 'stripe', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'stripe');

-- Update any records with null or empty configurations
UPDATE payment_provider 
SET is_installed = true 
WHERE is_installed IS NULL;

-- Clean up any duplicate or invalid payment provider records
DELETE FROM payment_provider 
WHERE ctid NOT IN (
    SELECT MIN(ctid) 
    FROM payment_provider 
    GROUP BY id
);
