-- SAFE FIX SCRIPT: Run this to patch any missing parts without errors

-- 1. Create Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-qr', 'safety-qr', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policies ONLY if they don't exist
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'safety-qr' );
    END IF;

    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload' AND tablename = 'objects' ) THEN
        CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'safety-qr' );
    END IF;
    
    -- Permissions for QR Codes
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Read QR' AND tablename = 'qr_codes' ) THEN
        CREATE POLICY "Public Read QR" ON qr_codes FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Update QR' AND tablename = 'qr_codes' ) THEN
        CREATE POLICY "Public Update QR" ON qr_codes FOR UPDATE USING (true);
    END IF;

    -- Permissions for QR Details
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Details' AND tablename = 'qr_details' ) THEN
        CREATE POLICY "Public Insert Details" ON qr_details FOR INSERT WITH CHECK (true);
    END IF;

    -- Permissions for Emergency Contacts
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Contacts' AND tablename = 'emergency_contacts' ) THEN
        CREATE POLICY "Public Insert Contacts" ON emergency_contacts FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 3. Add potential missing columns (Safe to run multiple times)
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS school_name TEXT;
