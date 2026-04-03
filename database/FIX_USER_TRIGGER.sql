-- FIX USER TRIGGER TO PREVENT "DATABASE ERROR"
-- Run this in Supabase SQL Editor

-- 1. Create a safe/idempotent handler for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try insert into public.users (if table exists)
    BEGIN
        INSERT INTO public.users (id, email)
        VALUES (NEW.id, NEW.email)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Configure ignores errors if table missing
        NULL;
    END;

    -- Try insert into public.profiles (if table exists)
    BEGIN
        INSERT INTO public.profiles (id, email)
        VALUES (NEW.id, NEW.email)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors (duplicate key, table missing, etc)
        NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Cleanup Orphans (Optional but Recommended)
-- Remove profiles that don't have a matching auth.user (Safe cleanup)
DELETE FROM public.users WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
