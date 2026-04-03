-- =====================================================
-- FIX ALL ISSUES - ROBUST VERSION (TABLE CHECK INCLUDED)
-- Run this ENTIRE file in Supabase SQL Editor
-- =====================================================

-- 1. FIX CHECK CONSTRAINTS & CLEAN INVALID DATA (With Safety Checks)
-- =====================================================

-- For public.users table (This definitely exists based on your errors)
DO $$ 
BEGIN
    -- Remove constraint to allow cleanup
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Clean up invalid roles
    UPDATE public.users 
    SET role = 'user' 
    WHERE role NOT IN ('user', 'admin', 'sub_admin', 'super_admin', 'super_pro_admin') 
    OR role IS NULL;

    -- Re-apply correct constraint
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'sub_admin', 'super_admin', 'super_pro_admin'));
    
    RAISE NOTICE '✅ public.users table fixed.';
END $$;

-- For public.profiles table (Only fix if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Remove constraint
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        
        -- Clean up invalid roles
        UPDATE public.profiles 
        SET role = 'user' 
        WHERE role NOT IN ('user', 'admin', 'sub_admin', 'super_admin', 'super_pro_admin')
        OR role IS NULL;

        -- Re-apply correct constraint
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin', 'sub_admin', 'super_admin', 'super_pro_admin'));
        
        RAISE NOTICE '✅ public.profiles table fixed.';
    ELSE
        RAISE NOTICE 'ℹ️ public.profiles table does not exist, skipping...';
    END IF;
END $$;


-- 2. FIX DATABASE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try insert into public.users
    BEGIN
        INSERT INTO public.users (id, email, role, status, created_at, password_hash)
        VALUES (NEW.id, NEW.email, 'user', 'active', NOW(), 'otp_authenticated')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email; 
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Fail safe
    END;

    -- Try insert into public.profiles (Only if table exists)
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            INSERT INTO public.profiles (id, email, role, status, created_at)
            VALUES (NEW.id, NEW.email, 'user', 'active', NOW())
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. SETUP SUPER PRO ADMIN USER
-- =====================================================

DO $$
DECLARE
    super_pro_id UUID;
    super_pro_email TEXT := 'superproadmin@thinkaiq.com';
BEGIN
    -- A. Get ID from various sources
    SELECT id INTO super_pro_id FROM public.users WHERE email = super_pro_email;
    
    IF super_pro_id IS NULL THEN
        SELECT id INTO super_pro_id FROM auth.users WHERE email = super_pro_email;
    END IF;

    -- B. Ensure Auth User Exists
    IF super_pro_id IS NULL THEN
        super_pro_id := gen_random_uuid();
        
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = super_pro_email) THEN
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
            VALUES (
                super_pro_id, 
                super_pro_email, 
                '$2a$10$MockHashForSuperProAccessOnly............', 
                NOW(), 
                'authenticated',
                'authenticated'
            );
        END IF;
    END IF;

    -- C. Upsert into Public Users
    INSERT INTO public.users (id, email, role, status, name, password_hash)
    VALUES (super_pro_id, super_pro_email, 'super_pro_admin', 'active', 'Super Pro Admin', 'otp_authenticated') 
    ON CONFLICT (id) DO UPDATE SET 
        role = 'super_pro_admin', 
        password_hash = 'otp_authenticated',
        status = 'active';

    -- D. Upsert into Public Profiles (Only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO public.profiles (id, email, role, status, full_name)
        VALUES (super_pro_id, super_pro_email, 'super_pro_admin', 'active', 'Super Pro Admin')
        ON CONFLICT (id) DO UPDATE SET 
            role = 'super_pro_admin',
            status = 'active';
    END IF;

    RAISE NOTICE '✅ Super Pro Admin Setup Successful! ID: %', super_pro_id;
END $$;
