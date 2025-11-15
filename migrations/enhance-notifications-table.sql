-- Enhanced Notifications Database Migration
-- Adds comprehensive notification support with better categorization and metadata

-- First, let's add the new columns to the existing Alerts table
ALTER TABLE Alerts 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'warning', 'error', 'success', 'info', 'plant_alert', 'system', 'device', 'payment', 'ai_analysis')),
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=critical, 2=high, 3=medium, 4=low, 5=info
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS action_label VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS is_persistent BOOLEAN DEFAULT FALSE;

-- Update existing records to have proper defaults
UPDATE Alerts 
SET title = CASE 
    WHEN message LIKE '%water%' OR message LIKE '%irrigation%' THEN 'Watering Alert'
    WHEN message LIKE '%moisture%' THEN 'Moisture Level Alert'
    WHEN message LIKE '%temperature%' THEN 'Temperature Alert'
    WHEN message LIKE '%device%' THEN 'Device Alert'
    WHEN message LIKE '%payment%' THEN 'Payment Notification'
    ELSE 'System Notification'
END,
type = CASE 
    WHEN message LIKE '%error%' OR message LIKE '%fail%' THEN 'error'
    WHEN message LIKE '%warning%' OR message LIKE '%low%' OR message LIKE '%high%' THEN 'warning'
    WHEN message LIKE '%success%' OR message LIKE '%complete%' THEN 'success'
    WHEN message LIKE '%plant%' OR message LIKE '%water%' OR message LIKE '%moisture%' THEN 'plant_alert'
    WHEN message LIKE '%device%' THEN 'device'
    WHEN message LIKE '%payment%' THEN 'payment'
    ELSE 'general'
END,
priority = CASE 
    WHEN message LIKE '%critical%' OR message LIKE '%urgent%' THEN 1
    WHEN message LIKE '%error%' OR message LIKE '%fail%' THEN 2
    WHEN message LIKE '%warning%' OR message LIKE '%low%' OR message LIKE '%high%' THEN 3
    WHEN message LIKE '%success%' OR message LIKE '%complete%' THEN 4
    ELSE 3
END,
read_at = CASE WHEN status = 'read' THEN created_at + INTERVAL '1 minute' ELSE NULL END
WHERE title IS NULL OR title = '';

-- Create enhanced indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_type_priority ON Alerts (user_id, type, priority);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON Alerts (user_id) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_alerts_type_priority ON Alerts (type, priority);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON Alerts (created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON Alerts (expires_at) WHERE expires_at IS NOT NULL;

-- Create a view for easy notification queries
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
    a.alert_id,
    a.user_id,
    a.title,
    a.message,
    a.type,
    a.details,
    a.priority,
    a.status,
    a.is_read,
    a.read_at,
    a.created_at,
    a.expires_at,
    a.action_url,
    a.action_label,
    a.source,
    a.is_persistent,
    u.family_name as user_name,
    u.email as user_email,
    CASE 
        WHEN a.priority = 1 THEN 'critical'
        WHEN a.priority = 2 THEN 'high'
        WHEN a.priority = 3 THEN 'medium'
        WHEN a.priority = 4 THEN 'low'
        WHEN a.priority = 5 THEN 'info'
        ELSE 'unknown'
    END as priority_label,
    CASE 
        WHEN a.expires_at IS NOT NULL AND a.expires_at < CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_expired,
    CASE 
        WHEN a.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN true
        ELSE false
    END as is_recent
FROM Alerts a
LEFT JOIN Users u ON a.user_id = u.user_id;

-- Function to automatically clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM Alerts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND is_persistent = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO System_Logs (component, level, message, details, created_at)
    VALUES ('notifications', 'info', 
           'Cleaned up expired notifications', 
           JSON_BUILD_OBJECT('deleted_count', deleted_count),
           CURRENT_TIMESTAMP);
           
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications with enhanced data
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'general',
    p_priority INTEGER DEFAULT 3,
    p_details JSONB DEFAULT '{}',
    p_expires_at TIMESTAMP DEFAULT NULL,
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_source VARCHAR(100) DEFAULT 'system',
    p_is_persistent BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    new_alert_id INTEGER;
BEGIN
    INSERT INTO Alerts (
        user_id, title, message, type, priority, details, 
        expires_at, action_url, action_label, source, is_persistent,
        status, created_at
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_priority, p_details,
        p_expires_at, p_action_url, p_action_label, p_source, p_is_persistent,
        'unread', CURRENT_TIMESTAMP
    ) RETURNING alert_id INTO new_alert_id;
    
    RETURN new_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification stats for a user
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT JSON_BUILD_OBJECT(
        'total', COUNT(*),
        'unread', COUNT(*) FILTER (WHERE status = 'unread'),
        'critical', COUNT(*) FILTER (WHERE priority = 1 AND status = 'unread'),
        'high_priority', COUNT(*) FILTER (WHERE priority <= 2 AND status = 'unread'),
        'recent', COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'),
        'by_type', JSON_OBJECT_AGG(
            type, 
            COUNT(*) FILTER (WHERE status = 'unread')
        )
    ) INTO stats
    FROM Alerts
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update read_at when status changes to 'read'
CREATE OR REPLACE FUNCTION update_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'read' AND OLD.status = 'unread' THEN
        NEW.read_at = CURRENT_TIMESTAMP;
        NEW.is_read = TRUE;
    ELSIF NEW.status = 'unread' THEN
        NEW.read_at = NULL;
        NEW.is_read = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_alerts_update_read_at
    BEFORE UPDATE ON Alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_read_at();

-- Insert some sample enhanced notifications for testing
INSERT INTO Alerts (user_id, title, message, type, priority, details, source, action_url, action_label)
SELECT 
    u.user_id,
    'Welcome to Plant Monitor',
    'Your account has been set up successfully. Start by adding your first plant!',
    'success',
    4,
    JSON_BUILD_OBJECT('welcome_bonus', true, 'first_login', true),
    'system',
    '/dashboard/add-plant',
    'Add Plant'
FROM Users u 
WHERE NOT EXISTS (
    SELECT 1 FROM Alerts a 
    WHERE a.user_id = u.user_id 
    AND a.title = 'Welcome to Plant Monitor'
)
LIMIT 1;

-- Cleanup function can be scheduled to run periodically
-- SELECT cleanup_expired_notifications();