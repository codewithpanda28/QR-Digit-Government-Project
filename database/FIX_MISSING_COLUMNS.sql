-- Add missing custom_price column and other potentially missing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_price INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_duration TEXT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Missing users table columns (custom_price, subscription_duration) added.';
END $$;
