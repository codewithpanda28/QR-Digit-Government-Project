-- TABLE HI EXIST NAHI KARTI THI, ISLIYE YE PURI NAYI TABLE BANANE KA SCRIPT HAI.
-- Bas ise copy karein aur Supabase SQL Editor mein run karein!

CREATE TABLE IF NOT EXISTS qr_purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    cashfree_order_id TEXT,
    payment_session_id TEXT,
    category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING', -- PENDING, PAID, PROCESSING, SHIPPED, DELIVERED
    
    -- Customer Details
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Delivery Details
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    delivery_pincode TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Enable RLS (Row Level Security)
ALTER TABLE qr_purchase_orders ENABLE ROW LEVEL SECURITY;

-- Note: Aapka create-order API route "service_role" key use karta hai, 
-- isliye API RLS ko bypass karke easily data daal payegi. Ye safe hai.
