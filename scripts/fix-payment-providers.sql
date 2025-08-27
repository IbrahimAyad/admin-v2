-- Fix Payment Provider Database Issues
-- This script resolves TypeORM "Empty criteria" errors in PaymentProviderService

-- Clean up any malformed payment provider records
DELETE FROM payment_provider WHERE id IS NULL OR id = '';

-- Fix any payment providers with missing required fields
UPDATE payment_provider 
SET is_installed = true 
WHERE is_installed IS NULL;

-- Ensure payment provider records have proper structure
-- Remove any duplicate manual payment providers
DELETE FROM payment_provider p1 
USING payment_provider p2 
WHERE p1.ctid < p2.ctid 
AND p1.id = p2.id 
AND p1.id LIKE '%manual%';

-- Fix Stripe payment provider if malformed
UPDATE payment_provider 
SET is_installed = true 
WHERE id LIKE '%stripe%' AND is_installed IS NULL;

-- Insert manual payment provider if it doesn't exist
INSERT INTO payment_provider (id, is_installed)
SELECT 'manual', true
WHERE NOT EXISTS (
    SELECT 1 FROM payment_provider WHERE id = 'manual'
);

-- Insert Stripe payment provider if it doesn't exist  
INSERT INTO payment_provider (id, is_installed)
SELECT 'stripe', true
WHERE NOT EXISTS (
    SELECT 1 FROM payment_provider WHERE id = 'stripe'
);

-- Clean up any payment sessions with null payment_provider_id
UPDATE payment_session 
SET payment_provider_id = 'manual' 
WHERE payment_provider_id IS NULL OR payment_provider_id = '';

-- Fix cart payment sessions
UPDATE cart 
SET payment_id = NULL 
WHERE payment_id IN (
    SELECT id FROM payment_session 
    WHERE payment_provider_id IS NULL OR payment_provider_id = ''
);

-- Ensure all required tables exist and have proper constraints
-- This is a safety check - tables should already exist
CREATE TABLE IF NOT EXISTS payment_provider (
    id VARCHAR NOT NULL PRIMARY KEY,
    is_installed BOOLEAN DEFAULT true
);

-- Fix any orphaned payment collections
DELETE FROM payment_collection_payments pcp
WHERE NOT EXISTS (
    SELECT 1 FROM payment p WHERE p.id = pcp.payment_id
);

DELETE FROM payment_collection_payments pcp  
WHERE NOT EXISTS (
    SELECT 1 FROM payment_collection pc WHERE pc.id = pcp.payment_collection_id
);
