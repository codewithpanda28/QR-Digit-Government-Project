-- Add EMAIL column to qr_details explicitly
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS email TEXT;
-- Add other common fields that might be missing in other forms
ALTER TABLE qr_details ADD COLUMN IF NOT EXISTS additional_contact TEXT;
