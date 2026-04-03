-- Add passcode column to users table for auto-fill in admin panel
ALTER TABLE users ADD COLUMN IF NOT EXISTS passcode TEXT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ passcode column added to users table for auto-fill support.';
END $$;
