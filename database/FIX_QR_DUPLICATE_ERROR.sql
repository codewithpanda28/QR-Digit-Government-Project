-- Fix for duplicate sequence numbers across different users
-- This allows every user to have their own "01", "02" sequence.

-- 1. Drop the composite unique constraint on category and sequence_number
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_category_sequence_number_key;

-- 2. Drop the unique constraint on qr_number (if it exists)
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_qr_number_key;

-- 3. Fix Deletion Constraint (Foreign Key)
-- This ensures when a user/admin is deleted, their QR codes don't block the deletion.
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_generated_by_fkey;
ALTER TABLE qr_codes 
    ADD CONSTRAINT qr_codes_generated_by_fkey 
    FOREIGN KEY (generated_by) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Also fix created_by and managed_by just in case
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_created_by_fkey;
ALTER TABLE qr_codes 
    ADD CONSTRAINT qr_codes_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database constraints fixed: Isolated sequences enabled and Cascade Delete added.';
END $$;
