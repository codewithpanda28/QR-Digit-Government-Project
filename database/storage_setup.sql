-- =====================================================
-- BUCKET AND STORAGE POLICIES FOR QR DIGIT
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create the safety-assets bucket (if it wasn't already created)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('safety-assets', 'safety-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'safety-assets');

-- 3. Allow authenticated users OR anonymous users to upload files
-- If your QR creators are not strictly authenticated via Supabase Auth when generating QR,
-- you might need to allow INSERT for everyone on this bucket.
CREATE POLICY "Allow Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'safety-assets');

-- 4. Allow users to update/delete their own uploads (optional based on your need)
CREATE POLICY "Allow Updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'safety-assets');

CREATE POLICY "Allow Deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'safety-assets');
