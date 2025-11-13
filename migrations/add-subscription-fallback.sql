-- Add fallback subscription support
-- This allows Ultimate subscriptions to fall back to lifetime Premium

-- Add fallback_subscription_id column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS fallback_subscription_id INTEGER DEFAULT NULL;

-- Add foreign key constraint for fallback subscription
ALTER TABLE subscriptions 
ADD CONSTRAINT IF NOT EXISTS fk_fallback_subscription 
FOREIGN KEY (fallback_subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Add index for fallback subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_fallback ON subscriptions(fallback_subscription_id);

-- Update the subscription expiration function to handle fallbacks
CREATE OR REPLACE FUNCTION expire_subscriptions_with_fallback()
RETURNS VOID AS $$
BEGIN
    -- Handle subscriptions with fallbacks first
    UPDATE subscriptions SET 
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (
        SELECT fb.id 
        FROM subscriptions s
        JOIN subscriptions fb ON s.fallback_subscription_id = fb.id
        WHERE s.is_active = true 
        AND s.sub_end IS NOT NULL 
        AND s.sub_end <= CURRENT_TIMESTAMP
        AND fb.is_active = false
    );
    
    -- Mark expired subscriptions with fallbacks as inactive
    UPDATE subscriptions 
    SET is_active = false, 
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = true 
    AND sub_end IS NOT NULL 
    AND sub_end <= CURRENT_TIMESTAMP
    AND fallback_subscription_id IS NOT NULL;
    
    -- Mark regular expired subscriptions as inactive
    UPDATE subscriptions 
    SET is_active = false, 
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = true 
    AND sub_end IS NOT NULL 
    AND sub_end <= CURRENT_TIMESTAMP
    AND fallback_subscription_id IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN subscriptions.fallback_subscription_id IS 'Reference to fallback subscription (e.g., lifetime Premium when Ultimate expires)';
COMMENT ON FUNCTION expire_subscriptions_with_fallback() IS 'Expires subscriptions with fallback support - reactivates fallback subscriptions when main subscription expires';