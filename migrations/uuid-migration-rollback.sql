-- ============================================================================
-- UUID MIGRATION ROLLBACK SCRIPT
-- ============================================================================
--
-- ⚠️  WARNING: This script CANNOT fully restore data after UUID migration!
-- ⚠️  This is why you MUST have a database backup before running the migration!
--
-- What this script does:
-- - Recreates the original table structure with SERIAL IDs
-- - However, user_id values will be NEW and DIFFERENT from before
-- - All relationships will be broken
-- - YOU MUST RESTORE FROM BACKUP to get original data back
--
-- This script is primarily for:
-- - Development/testing environments
-- - Creating a fresh schema with original structure
--
-- FOR PRODUCTION ROLLBACK:
-- - Use your database backup: pg_restore or psql < backup.sql
-- - Do NOT use this script on production data
--
-- ============================================================================

\c plant_system;

-- Confirm before running
DO $$
BEGIN
    RAISE WARNING '============================================================================';
    RAISE WARNING 'UUID MIGRATION ROLLBACK';
    RAISE WARNING '============================================================================';
    RAISE WARNING 'This will DROP all existing data and recreate tables with SERIAL IDs';
    RAISE WARNING 'All user_id values will be NEW (not the same as before migration)';
    RAISE WARNING 'All relationships will be LOST';
    RAISE WARNING '';
    RAISE WARNING 'For production, use your backup instead: pg_restore or psql < backup.sql';
    RAISE WARNING '';
    RAISE WARNING 'Pausing for 5 seconds... Press Ctrl+C to cancel';
    RAISE WARNING '============================================================================';
    PERFORM pg_sleep(5);
END $$;

BEGIN;

-- ============================================================================
-- DROP ALL TABLES
-- ============================================================================

DROP TABLE IF EXISTS Chat_History CASCADE;
DROP TABLE IF EXISTS System_Logs CASCADE;
DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS Alerts CASCADE;
DROP TABLE IF EXISTS Pump_Schedules CASCADE;
DROP TABLE IF EXISTS Watering_History CASCADE;
DROP TABLE IF EXISTS Sensors_Data CASCADE;
DROP TABLE IF EXISTS Plants CASCADE;
DROP TABLE IF EXISTS Devices CASCADE;
DROP TABLE IF EXISTS AI_Models CASCADE;
DROP TABLE IF EXISTS Plant_Profiles CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

RAISE NOTICE 'Dropped all tables';

-- ============================================================================
-- RECREATE ORIGINAL SCHEMA WITH SERIAL IDs
-- ============================================================================

-- Table for Users
CREATE TABLE Users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  given_name VARCHAR(100) NULL,
  family_name VARCHAR(100) NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Regular' CHECK (role IN ('Regular', 'Premium', 'Admin')),
  notification_prefs JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  google_id VARCHAR(255) NULL UNIQUE,
  google_refresh_token TEXT NULL,
  profile_picture TEXT NULL,
  language_preference VARCHAR(10) NOT NULL DEFAULT 'en'
);

CREATE INDEX idx_users_password_reset_token ON Users(password_reset_token);

-- Table for Plant_Profiles
CREATE TABLE Plant_Profiles (
  profile_id SERIAL PRIMARY KEY,
  species_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ideal_moisture INT NULL
);

-- Table for AI_Models
CREATE TABLE AI_Models (
  model_id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NULL,
  file_path VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_models_admin FOREIGN KEY (uploaded_by) REFERENCES Users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for Devices
CREATE TABLE Devices (
  device_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_key CHAR(36) NOT NULL UNIQUE,
  device_name VARCHAR(100) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Plants
CREATE TABLE Plants (
  plant_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  profile_id INT NULL,
  custom_name VARCHAR(100) NOT NULL,
  moisture_threshold INT NOT NULL,
  auto_watering_on BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plants_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plants_device FOREIGN KEY (device_id) REFERENCES Devices (device_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plants_profile FOREIGN KEY (profile_id) REFERENCES Plant_Profiles (profile_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Table for Sensors_Data
CREATE TABLE Sensors_Data (
  data_id BIGSERIAL PRIMARY KEY,
  device_id INT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  soil_moisture DOUBLE PRECISION NULL,
  temperature DOUBLE PRECISION NULL,
  air_humidity DOUBLE PRECISION NULL,
  light_intensity DOUBLE PRECISION NULL,
  CONSTRAINT fk_sensordata_device FOREIGN KEY (device_id) REFERENCES Devices (device_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Watering_History
CREATE TABLE Watering_History (
  history_id SERIAL PRIMARY KEY,
  plant_id INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('manual', 'automatic_threshold', 'schedule', 'ai_prediction')),
  duration_seconds INT NULL,
  CONSTRAINT fk_wateringhistory_plant FOREIGN KEY (plant_id) REFERENCES Plants (plant_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Pump_Schedules
CREATE TABLE Pump_Schedules (
  schedule_id SERIAL PRIMARY KEY,
  plant_id INT NOT NULL,
  cron_expression VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_schedules_plant FOREIGN KEY (plant_id) REFERENCES Plants (plant_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Alerts
CREATE TABLE Alerts (
  alert_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Payments
CREATE TABLE Payments (
  payment_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  vnpay_txn_ref VARCHAR(255) NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for System_Logs
CREATE TABLE System_Logs (
  log_id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  log_level VARCHAR(20) NULL,
  source VARCHAR(100) NULL,
  message TEXT NOT NULL
);

-- Table for Chat_History
CREATE TABLE Chat_History (
  chat_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chathistory_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

RAISE NOTICE '============================================================================';
RAISE NOTICE 'ROLLBACK COMPLETED';
RAISE NOTICE '============================================================================';
RAISE NOTICE 'Original schema with SERIAL IDs has been recreated';
RAISE NOTICE 'All tables are now empty';
RAISE NOTICE '';
RAISE NOTICE 'IMPORTANT:';
RAISE NOTICE '- User IDs will be NEW if you create new users';
RAISE NOTICE '- To restore original data, use your database backup';
RAISE NOTICE '- Restore command: psql -U postgres -d plant_system -f backup.sql';
RAISE NOTICE '============================================================================';

-- COMMIT or ROLLBACK manually
-- COMMIT;
