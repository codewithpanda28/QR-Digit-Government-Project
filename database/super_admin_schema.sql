-- Super Pro Admin System Database Schema
-- This adds support for multi-tier admin hierarchy

-- 1. Update profiles table to support admin roles and subscriptions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_revenue INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Create admin_permissions table for granular access control
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id)
);

-- 3. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_name TEXT UNIQUE NOT NULL,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    qr_code_limit INTEGER NOT NULL,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, price_monthly, price_yearly, qr_code_limit, features) VALUES
('free', 0, 0, 100, '{"analytics": false, "priority_support": false, "custom_branding": false}'),
('starter', 999, 9999, 500, '{"analytics": true, "priority_support": false, "custom_branding": false}'),
('professional', 2999, 29999, 2000, '{"analytics": true, "priority_support": true, "custom_branding": true}'),
('enterprise', 9999, 99999, -1, '{"analytics": true, "priority_support": true, "custom_branding": true, "api_access": true}')
ON CONFLICT (plan_name) DO NOTHING;

-- 4. Create admin_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create revenue_transactions table
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'subscription', 'qr_purchase', 'renewal'
    plan_name TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    transaction_date TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- 6. Update qr_codes table to track creator
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES auth.users(id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_admin_id ON revenue_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON qr_codes(created_by);

-- 8. Row Level Security (RLS) Policies

-- Profiles: Super Pro Admin can see all, others only their own
CREATE POLICY "Super Pro Admin can view all profiles" ON profiles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_pro_admin'
        )
        OR auth.uid() = id
    );

-- Admin Activity Log: Only accessible by Super Pro Admin
CREATE POLICY "Super Pro Admin can view activity log" ON admin_activity_log
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_pro_admin'
        )
    );

-- Revenue Transactions: Super Pro Admin sees all, others see their own
CREATE POLICY "Revenue transaction access" ON revenue_transactions
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_pro_admin'
        )
        OR auth.uid() = admin_id
    );

-- 9. Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    p.id as admin_id,
    p.email,
    p.role,
    p.subscription_plan,
    COUNT(DISTINCT qr.id) as total_qr_codes,
    COUNT(DISTINCT CASE WHEN qr.status = 'activated' THEN qr.id END) as active_qr_codes,
    COUNT(DISTINCT ea.id) as total_emergency_alerts,
    COALESCE(SUM(rt.amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN rt.transaction_date >= NOW() - INTERVAL '30 days' THEN rt.amount ELSE 0 END), 0) as monthly_revenue
FROM profiles p
LEFT JOIN qr_codes qr ON qr.created_by = p.id
LEFT JOIN emergency_alerts ea ON ea.user_id = p.id
LEFT JOIN revenue_transactions rt ON rt.admin_id = p.id
WHERE p.role IN ('super_admin', 'sub_admin')
GROUP BY p.id, p.email, p.role, p.subscription_plan;

-- 10. Function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            jsonb_build_object(
                'old_data', to_jsonb(OLD),
                'new_data', to_jsonb(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for important tables
CREATE TRIGGER log_qr_code_changes
    AFTER INSERT OR UPDATE OR DELETE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER log_profile_changes
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- 12. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 13. Comment documentation
COMMENT ON TABLE admin_permissions IS 'Stores granular permissions for admin users';
COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans and their features';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for all admin actions';
COMMENT ON TABLE revenue_transactions IS 'Tracks all revenue from subscriptions and purchases';
COMMENT ON VIEW admin_dashboard_stats IS 'Aggregated statistics for each admin user';
