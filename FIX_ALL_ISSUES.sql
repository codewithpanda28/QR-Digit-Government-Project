-- 1. Create Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-qr', 'safety-qr', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'safety-qr' );
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'safety-qr' );

-- 2. Add potential missing columns to qr_details
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS school_name TEXT;

-- 3. Fix Permissions (RLS) for public access
-- Allow anyone to read QR codes
CREATE POLICY "Public Read QR" ON qr_codes FOR SELECT USING (true);
-- Allow anyone to update QR codes (to activate them)
CREATE POLICY "Public Update QR" ON qr_codes FOR UPDATE USING (true);

-- Allow anyone to read/insert QR details
CREATE POLICY "Public Read Details" ON qr_details FOR SELECT USING (true);
CREATE POLICY "Public Insert Details" ON qr_details FOR INSERT WITH CHECK (true);

-- Allow anyone to read/insert Emergency Contacts
CREATE POLICY "Public Read Contacts" ON emergency_contacts FOR SELECT USING (true);
CREATE POLICY "Public Insert Contacts" ON emergency_contacts FOR INSERT WITH CHECK (true);
