-- CRITICAL FIX FOR ACTIVATION ERROR
-- We must ensure the 'anon' role (public users) can INSERT into qr_details and emergency_contacts
-- The error "new row violates row-level security policy" means the previous policies failed or were too restrictive.

-- 1. DROP old restrictive policies if they exist (to be clean)
DROP POLICY IF EXISTS "Public Insert Details" ON qr_details;
DROP POLICY IF EXISTS "Public Insert Contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Public Update QR" ON qr_codes;

-- 2. CREATE WIDE OPEN policies for these tables specifically for activation flow
-- This allows ANYONE to insert rows. In a stricter app, we would use a token or auth, 
-- but for open activation, this is required.

-- Allow inserts to qr_details
CREATE POLICY "Enable Insert for All" ON qr_details FOR INSERT WITH CHECK (true);

-- Allow inserts to emergency_contacts
CREATE POLICY "Enable Insert for All" ON emergency_contacts FOR INSERT WITH CHECK (true);

-- Allow updates to qr_codes (to change status to 'activated')
CREATE POLICY "Enable Update for All" ON qr_codes FOR UPDATE USING (true);


-- 3. Number Masking Helper (Optional - logic usually handled in Frontend, but good to know)
-- We don't store masked numbers in DB, we store real numbers.
-- The Frontend (React) will display a masked version (e.g. +91 XXXXX 12345)
-- But the 'tel:' link uses the real number.

-- 4. Subscription Fields
-- Ensure qr_codes has subscription tracking columns
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic'; -- 'basic', 'premium'
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;

-- 5. Helper function to check subscription status (for later use)
CREATE OR REPLACE FUNCTION is_subscription_active(qr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM qr_codes 
    WHERE id = qr_id 
    AND status = 'activated'
    AND (subscription_end IS NULL OR subscription_end > NOW())
  );
END;
$$ LANGUAGE plpgsql;
