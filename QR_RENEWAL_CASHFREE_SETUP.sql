-- =========================================
-- QR Renewal Orders Table for Cashfree
-- Run this in Supabase SQL Editor
-- =========================================

-- Create the renewal orders table
CREATE TABLE IF NOT EXISTS public.qr_renewal_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    days INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'USER_DROPPED')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    cashfree_order_id TEXT,
    payment_session_id TEXT,
    new_expiry TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qr_renewal_orders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access to renewal orders"
    ON public.qr_renewal_orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow reading own renewal orders (by qr_id linked to user's qr_codes)
CREATE POLICY "Users can read their own renewal orders"
    ON public.qr_renewal_orders
    FOR SELECT
    USING (
        qr_id IN (
            SELECT id FROM public.qr_codes
            WHERE generated_by = auth.uid()
        )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_renewal_orders_order_id ON public.qr_renewal_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_renewal_orders_qr_id ON public.qr_renewal_orders(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_renewal_orders_status ON public.qr_renewal_orders(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qr_renewal_orders_updated_at
    BEFORE UPDATE ON public.qr_renewal_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- Verification query
-- =========================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'qr_renewal_orders'
ORDER BY ordinal_position;
