-- Migration: Add settings column to Users table
-- Date: 2025-10-30
-- Description: Adds JSONB settings column to store user preferences including dashboard widgets, appearance, notifications, etc.

-- Add settings column to Users table
ALTER TABLE Users ADD COLUMN settings JSONB;

-- Create index for performance on settings queries
CREATE INDEX idx_users_settings ON Users USING GIN (settings);

-- Add comment to document the column
COMMENT ON COLUMN Users.settings IS 'User settings in JSON format including dashboard widgets, appearance, language, notifications, and privacy preferences';