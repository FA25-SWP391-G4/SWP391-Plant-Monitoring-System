-- Migration to update the Alerts table for enhanced notification functionality
-- This supports UC9: Receive Real-Time Notifications

-- Add new columns to Alerts table
ALTER TABLE "Alerts" 
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "type" VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS "details" JSONB DEFAULT '{}'::jsonb;

-- Update existing records
UPDATE "Alerts" SET "title" = 'Notification' WHERE "title" IS NULL;
UPDATE "Alerts" SET "type" = 'general' WHERE "type" IS NULL;
UPDATE "Alerts" SET "details" = '{}'::jsonb WHERE "details" IS NULL;

-- Update Users table to add FCM tokens support and notification preferences
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "fcm_tokens" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "notification_prefs" JSONB DEFAULT '{
    "email": true,
    "push": true,
    "lowMoisture": true,
    "highTemperature": true,
    "deviceOffline": true,
    "pumpActivation": true
  }'::jsonb;

-- Create index for faster notification queries by user
CREATE INDEX IF NOT EXISTS "idx_alerts_user_id" ON "Alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_is_read" ON "Alerts" ((CASE WHEN "status" = 'read' THEN true ELSE false END));