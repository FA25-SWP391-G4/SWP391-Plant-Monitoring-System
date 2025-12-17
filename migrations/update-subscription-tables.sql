-- Update existing tables to add missing columns and features
-- This migration updates the existing plans and subscriptions tables

-- Add missing columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_lifetime NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_plants INTEGER DEFAULT NULL;

-- Update plans table data with proper values
UPDATE plans SET 
    description = 'Essential features for casual plant owners',
    max_plants = 5
WHERE name = 'Basic';

UPDATE plans SET 
    description = 'Advanced features for serious plant enthusiasts',
    price_lifetime = 299000,
    max_plants = NULL
WHERE name = 'Premium';

UPDATE plans SET 
    description = 'Everything Premium has + AI intelligence & real-time monitoring',
    max_plants = NULL
WHERE name = 'Ultimate';

-- Insert/Update admin plan
INSERT INTO plans (name, description, price_monthly, price_yearly, price_lifetime, features, max_plants, is_admin_only, is_active)
VALUES ('Admin', 'Administrative access with full system control', 0, 0, NULL,
        '["Full system access", "User management", "System monitoring", "Data analytics", "All premium features"]'::jsonb,
        NULL, TRUE, TRUE)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    is_admin_only = EXCLUDED.is_admin_only;

-- Update existing plan features with proper JSON arrays
UPDATE plans SET features = '[
    "Up to 5 plants",
    "Basic plant monitoring", 
    "Watering reminders",
    "Limited data history (30 days)",
    "Community support"
]'::jsonb WHERE name = 'Basic';

UPDATE plans SET features = '[
    "Unlimited plants",
    "Custom zones & plant groups",
    "Advanced analytics & reports", 
    "Automated watering schedules",
    "Unlimited data history",
    "Priority customer support",
    "Export data (CSV, PDF)"
]'::jsonb WHERE name = 'Premium';

UPDATE plans SET features = '[
    "AI-powered plant recommendations",
    "Real-time camera monitoring",
    "Advanced plant health analysis",
    "Smart notifications & alerts", 
    "Environmental pattern recognition",
    "Instant priority support"
]'::jsonb WHERE name = 'Ultimate';

-- Create or replace the function to get user's active subscription
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
        s.id as subscription_id,
        p.name as plan_name,
        s.subscription_type,
        s.sub_start as start_date,
        s.sub_end as end_date,
        s.is_active
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = p_user_id
    AND s.is_active = TRUE
    AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to expire subscriptions (using correct column names)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS VOID AS $$
BEGIN
    -- Mark expired subscriptions as inactive
    UPDATE subscriptions 
    SET is_active = FALSE, 
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = TRUE 
    AND sub_end IS NOT NULL 
    AND sub_end <= CURRENT_TIMESTAMP;
    
    -- Update user roles for affected users
    UPDATE users 
    SET role = CASE 
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = users.user_id
            AND s.is_active = TRUE 
            AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
            AND p.is_admin_only = TRUE
        ) THEN 'Admin'
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = users.user_id
            AND s.is_active = TRUE 
            AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
            AND p.name IN ('Premium', 'Ultimate')
        ) THEN 'Premium'
        ELSE 'Regular'
    END;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to use correct column names
CREATE OR REPLACE FUNCTION update_user_role_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user role based on active subscription
    UPDATE users 
    SET role = CASE 
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND s.is_active = TRUE 
            AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
            AND p.is_admin_only = TRUE
        ) THEN 'Admin'
        WHEN EXISTS (
            SELECT 1 FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND s.is_active = TRUE 
            AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
            AND p.name IN ('Premium', 'Ultimate')
        ) THEN 'Premium'
        ELSE 'Regular'
    END
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN plans.description IS 'Human-readable description of the plan';
COMMENT ON COLUMN plans.price_lifetime IS 'One-time lifetime payment amount, NULL if not available';
COMMENT ON COLUMN plans.max_plants IS 'Maximum number of plants allowed, NULL means unlimited';
COMMENT ON COLUMN plans.is_admin_only IS 'If true, this plan can only be assigned by administrators';

-- Verify all plans exist
SELECT name, price_monthly, price_yearly, price_lifetime, is_admin_only FROM plans ORDER BY id;