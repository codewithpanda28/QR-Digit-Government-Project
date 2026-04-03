-- Create the storage bucket for Safety QR images
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-qr', 'safety-qr', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'safety-qr' );

-- Allow anyone to upload images (for the activation form)
-- Note: In a stricter prod environment, you might want to restrict this, 
-- but for the public activation form, we need to allow uploads.
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'safety-qr' );

-- Allow users to update their own images (optional, good for later)
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'safety-qr' );
