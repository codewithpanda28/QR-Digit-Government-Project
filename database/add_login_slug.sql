-- Add login_slug column to users table for unique admin login URLs
-- Run this in Supabase SQL Editor

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='login_slug'
    ) THEN
        ALTER TABLE users ADD COLUMN login_slug TEXT UNIQUE;
        
        -- Create index for faster lookups
        CREATE INDEX idx_users_login_slug ON users(login_slug);
        
        RAISE NOTICE 'Column login_slug added successfully';
    ELSE
        RAISE NOTICE 'Column login_slug already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'login_slug';
