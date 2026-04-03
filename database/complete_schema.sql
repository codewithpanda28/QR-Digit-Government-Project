-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR SAFETY QR
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (Core User/Admin Management)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'sub_admin', 'super_admin', 'super_pro_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    
    -- Subscription fields
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    subscription_expiry TIMESTAMP,
    monthly_revenue INTEGER DEFAULT 0,
    
    -- Admin passcode (hashed)
    admin_passcode TEXT,
    passcode_set_at TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Profile data
    profile_image_url TEXT,
    family_profiles JSONB DEFAULT '[]'::jsonb
);

-- =====================================================
-- 2. QR CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'activated', 'expired', 'suspended')),
    
    -- Subscription
    subscription_start TIMESTAMP,
    subscription_end TIMESTAMP,
    
    -- Ownership
    linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    managed_by UUID REFERENCES auth.users(id),
    
    -- Tracking
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP,
    last_scanned_location TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- QR Code Image URL
    qr_image_url TEXT
);

-- =====================================================
-- 3. QR DETAILS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.qr_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    
    category TEXT,
    
    -- Common fields
    full_name TEXT,
    age INTEGER,
    blood_group TEXT,
    medical_conditions TEXT,
    
    -- Parent/Guardian info
    father_name TEXT,
    mother_name TEXT,
    
    -- Address
    home_address TEXT,
    
    -- Student specific
    student_name TEXT,
    school_name TEXT,
    class_section TEXT,
    
    -- Senior citizen
    owner_name TEXT,
    caretaker_name TEXT,
    caretaker_phone TEXT,
    
    -- Vehicle
    vehicle_type TEXT,
    vehicle_number TEXT,
    vehicle_model TEXT,
    
    -- Custom profile image
    profile_image_url TEXT,
    
    -- Additional data (flexible JSON)
    additional_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. EMERGENCY CONTACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    priority INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. EMERGENCY ALERTS TABLE (SOS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_id UUID REFERENCES public.qr_codes(id),
    user_id UUID REFERENCES auth.users(id),
    
    alert_type TEXT DEFAULT 'sos',
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_address TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
    
    -- Evidence
    evidence_photos_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 6. SCAN LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    qr_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    
    scanned_at TIMESTAMP DEFAULT NOW(),
    scanned_by TEXT,
    scan_location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    user_agent TEXT,
    ip_address TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 7. SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_name TEXT UNIQUE NOT NULL,
    
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    
    qr_code_limit INTEGER NOT NULL, -- -1 for unlimited
    
    features JSONB DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, price_monthly, price_yearly, qr_code_limit, features) VALUES
('free', 0, 0, 100, '{"analytics": false, "priority_support": false, "custom_branding": false, "api_access": false}'::jsonb),
('starter', 999, 9999, 500, '{"analytics": true, "priority_support": false, "custom_branding": false, "api_access": false}'::jsonb),
('professional', 2999, 29999, 2000, '{"analytics": true, "priority_support": true, "custom_branding": true, "api_access": false}'::jsonb),
('enterprise', 9999, 99999, -1, '{"analytics": true, "priority_support": true, "custom_branding": true, "api_access": true, "white_label": true, "dedicated_support": true}'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;

-- =====================================================
-- 8. REVENUE TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.revenue_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'qr_purchase', 'renewal', 'upgrade', 'refund')),
    
    plan_name TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    transaction_date TIMESTAMP DEFAULT NOW(),
    
    -- Payment gateway details
    payment_gateway TEXT, -- razorpay, stripe, etc
    payment_id TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 9. ADMIN ACTIVITY LOG TABLE (Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    target_type TEXT, -- 'qr_code', 'user', 'admin', 'subscription'
    target_id UUID,
    
    details JSONB DEFAULT '{}'::jsonb,
    
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. ADMIN PERMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    permission_name TEXT NOT NULL,
    -- Permissions: 'qr_create', 'qr_delete', 'user_manage', 'subscription_manage', 'revenue_view', etc.
    
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 11. ADMIN PASSCODES TABLE (For Super/Sub Admin Access)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_passcodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    passcode_hash TEXT NOT NULL, -- Hashed passcode
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id), -- Super Pro Admin who created this
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_qr_codes_number ON public.qr_codes(qr_number);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON public.qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON public.qr_codes(status);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_qr_id ON public.emergency_alerts(qr_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);

CREATE INDEX IF NOT EXISTS idx_scan_logs_qr_id ON public.scan_logs(qr_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON public.scan_logs(scanned_at);

CREATE INDEX IF NOT EXISTS idx_revenue_admin_id ON public.revenue_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_status ON public.revenue_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.admin_activity_log(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_passcodes ENABLE ROW LEVEL SECURITY;

-- Profiles: Super Pro Admin sees all, others see their own
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
CREATE POLICY "Profiles access policy" ON public.profiles
    FOR ALL
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- QR Codes: Admins see their created codes, Super Pro Admin sees all
DROP POLICY IF EXISTS "QR codes access policy" ON public.qr_codes;
CREATE POLICY "QR codes access policy" ON public.qr_codes
    FOR ALL
    USING (
        created_by = auth.uid() OR
        linked_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_pro_admin', 'super_admin', 'sub_admin')
        )
    );

-- Emergency Alerts: Admins whose QR codes are involved can see, Super Pro Admin sees all
DROP POLICY IF EXISTS "Emergency alerts access policy" ON public.emergency_alerts;
CREATE POLICY "Emergency alerts access policy" ON public.emergency_alerts
    FOR ALL
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.qr_codes 
            WHERE qr_codes.id = emergency_alerts.qr_id 
            AND (qr_codes.created_by = auth.uid() OR qr_codes.linked_user_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_pro_admin')
        )
    );

-- Revenue: Super Pro Admin sees all, others see their own
DROP POLICY IF EXISTS "Revenue access policy" ON public.revenue_transactions;
CREATE POLICY "Revenue access policy" ON public.revenue_transactions
    FOR ALL
    USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- Activity Log: Super Pro Admin sees all
DROP POLICY IF EXISTS "Activity log access policy" ON public.admin_activity_log;
CREATE POLICY "Activity log access policy" ON public.admin_activity_log
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- Admin Passcodes: Super Pro Admin manages all, admins see their own
DROP POLICY IF EXISTS "Admin passcodes policy" ON public.admin_passcodes;
CREATE POLICY "Admin passcodes policy" ON public.admin_passcodes
    FOR ALL
    USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'super_pro_admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_details_updated_at ON public.qr_details;
CREATE TRIGGER update_qr_details_updated_at BEFORE UPDATE ON public.qr_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Admin Dashboard Stats View
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT 
    p.id as admin_id,
    p.email,
    p.role,
    p.subscription_plan,
    p.status,
    COUNT(DISTINCT qr.id) as total_qr_codes,
    COUNT(DISTINCT CASE WHEN qr.status = 'activated' THEN qr.id END) as active_qr_codes,
    COUNT(DISTINCT ea.id) as total_emergency_alerts,
    COUNT(DISTINCT CASE WHEN ea.status = 'active' THEN ea.id END) as active_emergency_alerts,
    COALESCE(SUM(rt.amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN rt.transaction_date >= NOW() - INTERVAL '30 days' THEN rt.amount ELSE 0 END), 0) as monthly_revenue
FROM public.profiles p
LEFT JOIN public.qr_codes qr ON qr.created_by = p.id
LEFT JOIN public.emergency_alerts ea ON ea.user_id = p.id
LEFT JOIN public.revenue_transactions rt ON rt.admin_id = p.id
WHERE p.role IN ('super_admin', 'sub_admin')
GROUP BY p.id, p.email, p.role, p.subscription_plan, p.status;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User and admin profiles with role-based access';
COMMENT ON TABLE public.qr_codes IS 'All QR codes generated in the system';
COMMENT ON TABLE public.qr_details IS 'Detailed information for each QR code';
COMMENT ON TABLE public.emergency_contacts IS 'Emergency contacts associated with QR codes';
COMMENT ON TABLE public.emergency_alerts IS 'SOS alerts triggered by users';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE public.revenue_transactions IS 'All payment and revenue transactions';
COMMENT ON TABLE public.admin_activity_log IS 'Audit trail of all admin actions';
COMMENT ON TABLE public.admin_passcodes IS 'Passcodes for Super Admin and Sub Admin access';
COMMENT ON VIEW public.admin_dashboard_stats IS 'Aggregated statistics for each admin';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '✅ All tables, indexes, and policies are ready';
    RAISE NOTICE '✅ Super Pro Admin system is configured';
    RAISE NOTICE '🚀 You can now start using the application!';
END $$;
