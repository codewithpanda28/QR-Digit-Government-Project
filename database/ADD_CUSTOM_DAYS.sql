-- Add custom_days column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_days INTEGER;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ custom_days column added to users table.';
END $$;
