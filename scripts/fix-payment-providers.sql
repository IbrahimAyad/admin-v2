-- Fix Payment Provider Database Issues - Medusa v1.x Compatible
-- This script resolves TypeORM "Empty criteria" errors in PaymentProviderService
-- Targets the root cause: invalid data that causes PaymentProviderService.update() to fail

-- Step 1: Analyze current payment_provider table structure and data
-- Insert a row to ensure table exists and prevent empty UPDATE queries
INSERT INTO payment_provider (id, is_installed) 
SELECT 'temp_fix_row', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'temp_fix_row');

-- Step 2: Clean up all invalid payment provider records that cause empty criteria
DELETE FROM payment_provider 
WHERE id IS NULL 
   OR id = '' 
   OR LENGTH(TRIM(id)) = 0
   OR id = 'temp_fix_row';

-- Step 3: Remove duplicate payment providers (keeping the first occurrence)
DELETE FROM payment_provider p1 
USING payment_provider p2 
WHERE p1.ctid > p2.ctid 
AND p1.id = p2.id;

-- Step 4: Ensure core payment providers exist with valid data
-- Manual payment provider
INSERT INTO payment_provider (id, is_installed) 
SELECT 'manual', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'manual');

-- Stripe payment provider  
INSERT INTO payment_provider (id, is_installed) 
SELECT 'stripe', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider WHERE id = 'stripe');

-- Step 5: Fix all payment provider records to have valid is_installed values
UPDATE payment_provider 
SET is_installed = COALESCE(is_installed, true) 
WHERE id IS NOT NULL AND id != '';

-- Step 6: Critical - Fix the specific condition causing TypeORM "Empty criteria" error
-- The error occurs when PaymentProviderService tries to update with invalid WHERE conditions
-- Ensure no records exist that would cause empty criteria in the UPDATE query

-- Remove any payment providers with problematic data patterns
DELETE FROM payment_provider 
WHERE id IN (
    SELECT id FROM payment_provider 
    WHERE id IS NULL 
       OR id = '' 
       OR is_installed IS NULL
);

-- Step 7: Fix related tables that reference payment providers
-- Fix payment sessions
UPDATE payment_session 
SET payment_provider_id = 'manual' 
WHERE payment_provider_id IS NULL 
   OR payment_provider_id = '' 
   OR payment_provider_id NOT IN (SELECT id FROM payment_provider WHERE id IS NOT NULL);

-- Fix payments table
UPDATE payment 
SET provider_id = 'manual'
WHERE provider_id IS NULL 
   OR provider_id = '' 
   OR provider_id NOT IN (SELECT id FROM payment_provider WHERE id IS NOT NULL);

-- Step 8: Clean up cart references
UPDATE cart 
SET payment_id = NULL 
WHERE payment_id IS NOT NULL
AND payment_id NOT IN (
    SELECT id FROM payment_session 
    WHERE payment_provider_id IS NOT NULL 
    AND payment_provider_id != ''
);

-- Step 9: Final validation - ensure table has at least the required providers
-- This prevents the service from encountering an empty table
INSERT INTO payment_provider (id, is_installed) 
SELECT 'manual', true 
WHERE NOT EXISTS (SELECT 1 FROM payment_provider);

INSERT INTO payment_provider (id, is_installed) 
SELECT 'stripe', true 
WHERE (SELECT COUNT(*) FROM payment_provider) < 2;
