-- ============================================
-- SUPER ADMIN SYSTEM - DATABASE MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_admin_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_features JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS branding JSONB;

-- 2. Create Sub-Admin Configuration Table
CREATE TABLE IF NOT EXISTS sub_admin_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_admin_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  qr_quota INTEGER DEFAULT 0,
  qr_used INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  allowed_categories TEXT[] DEFAULT ARRAY['child-safety', 'women-safety', 'elderly-safety', 'school-safety', 'vehicle-safety', 'tourist-safety', 'temple-event'],
  subscription_plan VARCHAR(100) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly', 'lifetime'
  subscription_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Revenue Sharing Table
CREATE TABLE IF NOT EXISTS revenue_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_id UUID REFERENCES qr_codes(id),
  subscription_id UUID REFERENCES subscriptions(id),
  super_admin_id UUID REFERENCES users(id),
  sub_admin_id UUID REFERENCES users(id),
  customer_name VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  sub_admin_commission DECIMAL(10,2) DEFAULT 0,
  super_admin_revenue DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'completed',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Sub-Admin Activity Logs
CREATE TABLE IF NOT EXISTS sub_admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- 'qr_generated', 'qr_sold', 'settings_updated', etc.
  action_details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_admin_config_sub_admin_id ON sub_admin_config(sub_admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_sharing_super_admin_id ON revenue_sharing(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_sharing_sub_admin_id ON revenue_sharing(sub_admin_id);
CREATE INDEX IF NOT EXISTS idx_revenue_sharing_transaction_date ON revenue_sharing(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sub_admin_activity_logs_sub_admin_id ON sub_admin_activity_logs(sub_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_admin_id ON users(parent_admin_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_activated_by ON qr_codes(activated_by);

-- 6. Create updated_at trigger for new tables
CREATE TRIGGER update_sub_admin_config_updated_at BEFORE UPDATE ON sub_admin_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS on new tables
ALTER TABLE sub_admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (adjust based on your auth setup)
CREATE POLICY "Allow full access to admins on sub_admin_config" ON sub_admin_config
  FOR ALL USING (true);

CREATE POLICY "Allow full access to admins on revenue_sharing" ON revenue_sharing
  FOR ALL USING (true);

CREATE POLICY "Allow full access to admins on sub_admin_activity_logs" ON sub_admin_activity_logs
  FOR ALL USING (true);

-- 9. Insert initial Super Admin (if not exists)
-- IMPORTANT: Change password_hash to actual bcrypt hash
INSERT INTO users (email, password_hash, name, role, is_active, qr_quota, commission_rate)
VALUES ('superadmin@thinktrust.com', '$2a$10$example_hash_replace_this', 'Super Administrator', 'super_admin', true, 999999, 0)
ON CONFLICT (email) DO NOTHING;

-- 10. Sample Sub-Admin Plans (for reference)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'yearly', 'lifetime'
  qr_quota INTEGER NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (plan_name, plan_type, qr_quota, commission_rate, price, features) VALUES
('Starter Monthly', 'monthly', 100, 10.00, 2999, '["Basic Dashboard", "QR Generation", "Email Support"]'),
('Starter Quarterly', 'quarterly', 300, 10.00, 7999, '["Basic Dashboard", "QR Generation", "Email Support"]'),
('Starter Yearly', 'yearly', 1200, 10.00, 24999, '["Basic Dashboard", "QR Generation", "Email Support", "Priority Support"]'),

('Professional Monthly', 'monthly', 500, 15.00, 7999, '["Advanced Dashboard", "Custom Branding", "API Access", "Phone Support"]'),
('Professional Quarterly', 'quarterly', 1500, 15.00, 19999, '["Advanced Dashboard", "Custom Branding", "API Access", "Phone Support"]'),
('Professional Yearly', 'yearly', 6000, 15.00, 59999, '["Advanced Dashboard", "Custom Branding", "API Access", "Phone Support", "Analytics"]'),

('Enterprise Monthly', 'monthly', 999999, 20.00, 19999, '["Full Dashboard", "Custom Branding", "API Access", "Dedicated Support", "White Label"]'),
('Enterprise Quarterly', 'quarterly', 999999, 20.00, 49999, '["Full Dashboard", "Custom Branding", "API Access", "Dedicated Support", "White Label"]'),
('Enterprise Yearly', 'yearly', 999999, 20.00, 149999, '["Full Dashboard", "Custom Branding", "API Access", "Dedicated Support", "White Label", "Custom Features"]')
ON CONFLICT DO NOTHING;

-- 11. Create function to track QR usage
CREATE OR REPLACE FUNCTION increment_qr_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If QR is activated by a sub-admin, increment their usage
  IF NEW.activated_by IS NOT NULL THEN
    UPDATE sub_admin_config 
    SET qr_used = qr_used + 1 
    WHERE sub_admin_id = NEW.activated_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to auto-increment QR usage
CREATE TRIGGER track_qr_usage_trigger
AFTER UPDATE OF status ON qr_codes
FOR EACH ROW
WHEN (NEW.status = 'activated' AND OLD.status != 'activated')
EXECUTE FUNCTION increment_qr_usage();

-- 13. Create function to calculate revenue sharing
CREATE OR REPLACE FUNCTION calculate_revenue_sharing(
  p_subscription_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS TABLE(super_admin_revenue DECIMAL(10,2), sub_admin_commission DECIMAL(10,2)) AS $$
DECLARE
  v_sub_admin_id UUID;
  v_commission_rate DECIMAL(5,2);
BEGIN
  -- Get sub-admin and commission rate
  SELECT s.user_id, sa.commission_rate INTO v_sub_admin_id, v_commission_rate
  FROM subscriptions s
  JOIN sub_admin_config sa ON sa.sub_admin_id = s.user_id
  WHERE s.id = p_subscription_id;
  
  -- Calculate revenue split
  sub_admin_commission := (p_amount * v_commission_rate / 100);
  super_admin_revenue := p_amount - sub_admin_commission;
  
  RETURN QUERY SELECT super_admin_revenue, sub_admin_commission;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE sub_admin_config IS 'Configuration and quota management for sub-admins';
COMMENT ON TABLE revenue_sharing IS 'Tracks revenue sharing between super admin and sub-admins';
COMMENT ON TABLE sub_admin_activity_logs IS 'Audit trail for sub-admin actions';
COMMENT ON TABLE subscription_plans IS 'Predefined subscription plans for sub-admins';
