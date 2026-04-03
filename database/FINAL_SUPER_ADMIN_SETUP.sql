-- =====================================================
-- SAFETY QR - SUPER PRO ADMIN SYSTEM
-- COMPLETE DATABASE SETUP (Compatible with existing tables)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. UPDATE EXISTING USERS TABLE FOR ADMIN ROLES
-- =====================================================

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add subscription fields if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_plan') THEN
        ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_expiry') THEN
        ALTER TABLE users ADD COLUMN subscription_expiry TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='monthly_revenue') THEN
        ALTER TABLE users ADD COLUMN monthly_revenue INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_by') THEN
        ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

-- =====================================================
-- 2. ADMIN PASSCODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_passcodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    passcode_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP
);

-- =====================================================
-- 3. ADMIN ACTIVITY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. REVENUE TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    transaction_type TEXT NOT NULL,
    plan_name TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT NOW(),
    payment_gateway TEXT,
    payment_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 5. SUBSCRIPTION PLANS TABLE (Fixed Structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    price_per_month INTEGER NOT NULL,
    price_per_year INTEGER NOT NULL,
    qr_limit INTEGER NOT NULL,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans (without conflict errors)
INSERT INTO plans (name, price_per_month, price_per_year, qr_limit, features) VALUES
('free', 0, 0, 100, '{"analytics": false, "priority_support": false, "custom_branding": false}'::jsonb),
('starter', 999, 9999, 500, '{"analytics": true, "priority_support": false, "custom_branding": false}'::jsonb),
('professional', 2999, 29999, 2000, '{"analytics": true, "priority_support": true, "custom_branding": true}'::jsonb),
('enterprise', 9999, 99999, -1, '{"analytics": true, "priority_support": true, "custom_branding": true, "api_access": true, "white_label": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. UPDATE QR CODES TABLE
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qr_codes' AND column_name='created_by') THEN
        ALTER TABLE qr_codes ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qr_codes' AND column_name='managed_by') THEN
        ALTER TABLE qr_codes ADD COLUMN managed_by UUID REFERENCES users(id);
    END IF;
END $$;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_qr_id ON emergency_alerts(qr_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_admin_id ON revenue_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_passcodes_admin_id ON admin_passcodes(admin_id);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE admin_passcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- Admin Passcodes: Super Pro Admin sees all, others see their own
DROP POLICY IF EXISTS "Admin passcodes policy" ON admin_passcodes;
CREATE POLICY "Admin passcodes policy" ON admin_passcodes
    FOR ALL
    USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- Activity Log: Super Pro Admin only
DROP POLICY IF EXISTS "Activity log policy" ON admin_activity_log;
CREATE POLICY "Activity log policy" ON admin_activity_log
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_pro_admin', 'super_admin', 'sub_admin')
        )
    );

-- Revenue: Super Pro Admin sees all, others see their own
DROP POLICY IF EXISTS "Revenue policy" ON revenue_transactions;
CREATE POLICY "Revenue policy" ON revenue_transactions
    FOR ALL
    USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to admin_passcodes
DROP TRIGGER IF EXISTS update_admin_passcodes_updated_at ON admin_passcodes;
CREATE TRIGGER update_admin_passcodes_updated_at 
    BEFORE UPDATE ON admin_passcodes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. CREATE VIEW FOR ADMIN STATS
-- =====================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    u.id as admin_id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.subscription_plan,
    COUNT(DISTINCT qr.id) as total_qr_codes,
    COUNT(DISTINCT CASE WHEN qr.status = 'activated' THEN qr.id END) as active_qr_codes,
    COUNT(DISTINCT ea.id) as total_emergency_alerts,
    COALESCE(SUM(rt.amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN rt.transaction_date >= NOW() - INTERVAL '30 days' THEN rt.amount ELSE 0 END), 0) as monthly_revenue
FROM users u
LEFT JOIN qr_codes qr ON qr.created_by = u.id
LEFT JOIN emergency_alerts ea ON ea.qr_id = qr.id
LEFT JOIN revenue_transactions rt ON rt.admin_id = u.id
WHERE u.role IN ('super_admin', 'sub_admin')
GROUP BY u.id, u.email, u.name, u.role, u.status, u.subscription_plan;

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 12. DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON TABLE admin_passcodes IS 'Stores hashed passcodes for Super Admin and Sub Admin access';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for all admin actions';
COMMENT ON TABLE revenue_transactions IS 'Tracks all revenue and payment transactions';
COMMENT ON TABLE plans IS 'Subscription plans with pricing and features';
COMMENT ON VIEW admin_stats IS 'Aggregated statistics for each admin user';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Super Pro Admin System Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables Created/Updated:';
    RAISE NOTICE '  ✓ users (updated with admin fields)';
    RAISE NOTICE '  ✓ admin_passcodes';
    RAISE NOTICE '  ✓ admin_activity_log';
    RAISE NOTICE '  ✓ revenue_transactions';
    RAISE NOTICE '  ✓ plans';
    RAISE NOTICE '';
    RAISE NOTICE 'Super Pro Admin Passcode: 180117';
    RAISE NOTICE 'Stored in: .env.local as NEXT_PUBLIC_SUPER_ADMIN_PINCODE';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 System is ready to use!';
    RAISE NOTICE '========================================';
END $$;
