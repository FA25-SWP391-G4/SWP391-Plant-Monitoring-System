-- Create subscription and plan tables with proper relationships
-- Run this migration after the users and payments tables are created

-- Create plan table first (referenced by subscriptions)
CREATE TABLE plans (
    plan_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_lifetime NUMERIC(10,2) DEFAULT NULL,
    features JSONB DEFAULT '[]',
    max_plants INTEGER DEFAULT NULL, -- NULL means unlimited
    is_admin_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for plan table
CREATE INDEX idx_plans_name ON plans USING btree (name);
CREATE INDEX idx_plans_is_active ON plans USING btree (is_active);
CREATE INDEX idx_plans_is_admin_only ON plans USING btree (is_admin_only);

-- Create subscription table
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id INTEGER NOT NULL,
    payment_id INTEGER DEFAULT NULL, -- Can be NULL for admin-assigned subscriptions
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly', 'lifetime'
    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITHOUT TIME ZONE, -- NULL for lifetime subscriptions
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    cancelled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON DELETE RESTRICT,
    CONSTRAINT fk_subscriptions_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
    
    -- Check constraints
    CONSTRAINT subscriptions_type_check CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
    CONSTRAINT subscriptions_dates_check CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create indexes for subscription table
CREATE INDEX idx_subscriptions_user_id ON subscriptions USING btree (user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions USING btree (plan_id);
CREATE INDEX idx_subscriptions_payment_id ON subscriptions USING btree (payment_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions USING btree (is_active);
CREATE INDEX idx_subscriptions_end_date ON subscriptions USING btree (end_date);
CREATE INDEX idx_subscriptions_user_active ON subscriptions USING btree (user_id, is_active);

-- Insert default plans
INSERT INTO plans (name, description, price_monthly, price_yearly, price_lifetime, features, max_plants, is_admin_only) VALUES
('Basic', 'Essential features for casual plant owners', 0, 0, NULL, 
 '["Up to 5 plants", "Basic plant monitoring", "Watering reminders", "Limited data history (30 days)", "Community support"]', 
 5, FALSE),

('Premium', 'Advanced features for serious plant enthusiasts', 15000, 150000, 299000,
 '["Unlimited plants", "Custom zones & plant groups", "Advanced analytics & reports", "Automated watering schedules", "Unlimited data history", "Priority customer support", "Export data (CSV, PDF)"]',
 NULL, FALSE),

('Ultimate', 'Everything Premium has + AI intelligence & real-time monitoring', 45000, 399000, NULL,
 '["🤖 AI-powered plant recommendations", "📹 Real-time camera monitoring", "🔬 Advanced plant health analysis", "📱 Smart notifications & alerts", "🌡️ Environmental pattern recognition", "⚡ Instant priority support"]',
 NULL, FALSE),

('Admin', 'Administrative access with full system control', 0, 0, NULL,
 '["Full system access", "User management", "System monitoring", "Data analytics", "All premium features"]',
 NULL, TRUE);

-- Create function to update user role based on subscription
CREATE OR REPLACE FUNCTION update_user_role_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user role based on active subscription
    UPDATE users 
    SET role = CASE 
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.plan_id 
            WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND s.is_active = TRUE 
            AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
            AND p.is_admin_only = TRUE
        ) THEN 'Admin'
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.plan_id 
            WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND s.is_active = TRUE 
            AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
            AND p.name IN ('Premium', 'Ultimate')
        ) THEN 'Premium'
        ELSE 'Regular'
    END
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update user role
CREATE TRIGGER trigger_update_user_role_on_subscription_change
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_role_from_subscription();

-- Create function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS VOID AS $$
BEGIN
    -- Mark expired subscriptions as inactive
    UPDATE subscriptions 
    SET is_active = FALSE, 
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = TRUE 
    AND end_date IS NOT NULL 
    AND end_date <= CURRENT_TIMESTAMP;
    
    -- Update user roles for affected users
    UPDATE users 
    SET role = CASE 
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.plan_id 
            WHERE s.user_id = users.user_id
            AND s.is_active = TRUE 
            AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
            AND p.is_admin_only = TRUE
        ) THEN 'Admin'
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.plan_id 
            WHERE s.user_id = users.user_id
            AND s.is_active = TRUE 
            AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
            AND p.name IN ('Premium', 'Ultimate')
        ) THEN 'Premium'
        ELSE 'Regular'
    END
    WHERE user_id IN (
        SELECT DISTINCT user_id FROM subscriptions 
        WHERE is_active = FALSE 
        AND end_date IS NOT NULL 
        AND end_date <= CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user's current active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE(
    subscription_id INTEGER,
    plan_name VARCHAR(100),
    subscription_type VARCHAR(20),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.subscription_id,
        p.name as plan_name,
        s.subscription_type,
        s.start_date,
        s.end_date,
        s.is_active
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.plan_id
    WHERE s.user_id = p_user_id
    AND s.is_active = TRUE
    AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE plans IS 'Available subscription plans with pricing and features';
COMMENT ON TABLE subscriptions IS 'User subscriptions linking users to plans with payment tracking';
COMMENT ON COLUMN plans.is_admin_only IS 'If true, this plan can only be assigned by administrators';
COMMENT ON COLUMN plans.max_plants IS 'Maximum number of plants allowed, NULL means unlimited';
COMMENT ON COLUMN subscriptions.end_date IS 'Subscription end date, NULL for lifetime subscriptions';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription should auto-renew before expiration';
