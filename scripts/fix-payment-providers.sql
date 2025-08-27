-- Fix Payment Provider Database Issues
-- This script resolves TypeORM "Empty criteria" errors in PaymentProviderService
-- Enhanced version to handle edge cases causing UPDATE queries without criteria

-- Step 1: Clean up completely invalid payment provider records
DELETE FROM payment_provider 
WHERE id IS NULL OR id = '' OR LENGTH(TRIM(id)) = 0;

-- Step 2: Remove all duplicate payment provider records first
DELETE FROM payment_provider p1 
USING payment_provider p2 
WHERE p1.ctid < p2.ctid 
AND p1.id = p2.id;

-- Step 3: Clean up payment_provider table completely and rebuild
-- Save existing valid providers first
CREATE TEMP TABLE temp_valid_providers AS
SELECT DISTINCT id, COALESCE(is_installed, true) as is_installed
FROM payment_provider 
WHERE id IS NOT NULL 
AND id != '' 
AND LENGTH(TRIM(id)) > 0;

-- Clear payment_provider table completely
TRUNCATE TABLE payment_provider RESTART IDENTITY CASCADE;

-- Rebuild with clean data
INSERT INTO payment_provider (id, is_installed)
SELECT id, is_installed FROM temp_valid_providers;

-- Ensure essential payment providers exist
INSERT INTO payment_provider (id, is_installed)
SELECT 'manual', true
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'manual');

INSERT INTO payment_provider (id, is_installed)
SELECT 'stripe', true
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'stripe');

-- Step 4: Fix payment sessions with invalid provider references
UPDATE payment_session 
SET payment_provider_id = 'manual' 
WHERE payment_provider_id IS NULL 
   OR payment_provider_id = '' 
   OR LENGTH(TRIM(payment_provider_id)) = 0
   OR payment_provider_id NOT IN (SELECT id FROM payment_provider);

-- Step 5: Fix payments with invalid provider references  
UPDATE payment 
SET provider_id = 'manual'
WHERE provider_id IS NULL 
   OR provider_id = '' 
   OR LENGTH(TRIM(provider_id)) = 0
   OR provider_id NOT IN (SELECT id FROM payment_provider);

-- Step 6: Clean up cart associations
UPDATE cart 
SET payment_id = NULL 
WHERE payment_id IS NOT NULL
AND payment_id NOT IN (
    SELECT id FROM payment_session 
    WHERE payment_provider_id IS NOT NULL 
    AND payment_provider_id IN (SELECT id FROM payment_provider)
);

-- Step 7: Fix payment collections and their relationships
-- Clean up orphaned payment collection payments
DELETE FROM payment_collection_payments pcp
WHERE NOT EXISTS (SELECT 1 FROM payment p WHERE p.id = pcp.payment_id)
   OR NOT EXISTS (SELECT 1 FROM payment_collection pc WHERE pc.id = pcp.payment_collection_id);

-- Step 8: Ensure payment_provider has all required fields and constraints
-- Add any missing columns that might be expected
ALTER TABLE payment_provider 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 9: Update all payment provider timestamps to prevent null issues
UPDATE payment_provider 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE payment_provider 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Step 10: Final validation - ensure no payment provider has empty criteria fields
UPDATE payment_provider 
SET is_installed = COALESCE(is_installed, true)
WHERE id IS NOT NULL AND id != '';

-- Clean up temporary table
DROP TABLE IF EXISTS temp_valid_providers;
