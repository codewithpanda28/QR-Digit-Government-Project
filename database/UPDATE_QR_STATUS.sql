-- Add 'generated' to the QR Code status check constraint
-- This allows newly purchased QR codes to show the setup form

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_status_check;
    
    -- Add the new constraint with 'generated' included
    ALTER TABLE public.qr_codes ADD CONSTRAINT qr_codes_status_check 
    CHECK (status IN ('pending', 'generated', 'activated', 'expired', 'suspended'));
    
    RAISE NOTICE '✅ QR Codes status constraint updated to include "generated".';
END $$;
