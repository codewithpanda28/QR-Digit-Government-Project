-- Add fixed_category column to qr_codes table
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS fixed_category TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_fixed_category ON qr_codes(fixed_category);

-- Comment for documentation
COMMENT ON COLUMN qr_codes.fixed_category IS 'If set, scanning this QR will redirect directly to this category form.';
