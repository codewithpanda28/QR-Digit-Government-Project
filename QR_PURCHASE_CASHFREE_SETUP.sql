-- =========================================
-- QR Purchase Orders Table for Cashfree
-- Run this in Supabase SQL Editor
-- =========================================

-- Create the purchase orders table
CREATE TABLE IF NOT EXISTS public.qr_purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'USER_DROPPED')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    cashfree_order_id TEXT,
    payment_session_id TEXT,
    qr_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL, -- Will be filled after success
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qr_purchase_orders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access to purchase orders"
    ON public.qr_purchase_orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_purchase_orders_order_id ON public.qr_purchase_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_purchase_orders_status ON public.qr_purchase_orders(status);

-- Updated_at trigger (using existing function if possible, but defining again for safety)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qr_purchase_orders_updated_at
    BEFORE UPDATE ON public.qr_purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
