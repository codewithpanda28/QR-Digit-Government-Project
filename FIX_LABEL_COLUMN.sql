-- The error "Could not find the 'label' column" occurs because the 'label' column is missing from your Supabase 'qr_codes' table.
-- Run the following command in your Supabase SQL Editor to fix this issue:

ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS label VARCHAR(255);

-- Optional: If you want to index it for faster searching later
CREATE INDEX IF NOT EXISTS idx_qr_codes_label ON qr_codes(label);
