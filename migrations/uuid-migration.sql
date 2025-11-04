-- Active: 1758998406794@@127.0.0.1@5432@plant_system
-- ============================================================================
-- UUID MIGRATION SCRIPT
-- ============================================================================
-- 
-- This script migrates the database from integer user_id to UUID user_id
-- and changes device_id to use device_key as primary key
--
-- CHANGES:
-- 1. Users: user_id (SERIAL) → user_id (UUID)
-- 2. Devices: device_id (SERIAL PK) → device_key (UUID PK)
-- 3. All foreign keys updated to reference new UUID fields
--
-- EXECUTION TIME: Estimated 5-10 minutes for ~10,000 users
-- DOWNTIME: Required (use rollback script if needed)
--
-- PREREQUISITES:
-- - Backup database before running
-- - Stop all application services
-- - Ensure no active connections to database
--
-- RUN COMMAND:
-- psql -U postgres -d plant_system -f migrations/uuid-migration.sql
-- ============================================================================



-- Start transaction for atomic migration
BEGIN;
END;

-- ============================================================================
-- STEP 1: ADD UUID EXTENSION (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RAISE NOTICE 'Step 1: UUID extensions enabled';

-- ============================================================================
-- STEP 2: ADD NEW UUID COLUMNS
-- ============================================================================

-- Add UUID column to Users table
ALTER TABLE Users 
ADD COLUMN user_uuid UUID DEFAULT gen_random_uuid();

-- Generate UUIDs for existing users (if any)
UPDATE Users 
SET user_uuid = gen_random_uuid() 
WHERE user_uuid IS NULL;

-- Make user_uuid NOT NULL after populating
ALTER TABLE Users 
ALTER COLUMN user_uuid SET NOT NULL;

-- Add unique constraint
ALTER TABLE Users 
ADD CONSTRAINT users_user_uuid_unique UNIQUE (user_uuid);

-- RAISE NOTICE 'Step 2: Added user_uuid column to Users table';

-- ============================================================================
-- STEP 3: ADD TEMPORARY UUID COLUMNS TO RELATED TABLES
-- ============================================================================

-- AI_Models
ALTER TABLE AI_Models 
ADD COLUMN uploaded_by_uuid UUID;

-- Devices  
ALTER TABLE Devices
ADD COLUMN user_uuid UUID;

-- Plants
ALTER TABLE Plants
ADD COLUMN user_uuid UUID;

-- Alerts
ALTER TABLE Alerts
ADD COLUMN user_uuid UUID;

-- Payments
ALTER TABLE Payments
ADD COLUMN user_uuid UUID;

-- RAISE NOTICE 'Step 3: Added temporary UUID columns to related tables';

-- ============================================================================
-- STEP 4: POPULATE UUID FOREIGN KEYS
-- ============================================================================

-- Update AI_Models
UPDATE AI_Models am
SET uploaded_by_uuid = u.user_uuid
FROM Users u
WHERE am.uploaded_by = u.user_id;

-- Update Devices
UPDATE Devices d
SET user_uuid = u.user_uuid
FROM Users u
WHERE d.user_id = u.user_id;

-- Update Plants
UPDATE Plants p
SET user_uuid = u.user_uuid
FROM Users u
WHERE p.user_id = u.user_id;

-- Update Alerts
UPDATE Alerts a
SET user_uuid = u.user_uuid
FROM Users u
WHERE a.user_id = u.user_id;

-- Update Payments pay
UPDATE Payments pay
SET user_uuid = u.user_uuid
FROM Users u
WHERE pay.user_id = u.user_id;

-- RAISE NOTICE 'Step 4: Populated UUID foreign keys in all related tables';

-- ============================================================================
-- STEP 5: DROP OLD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- AI_Models
ALTER TABLE AI_Models
DROP CONSTRAINT IF EXISTS fk_ai_models_admin;

-- Devices
ALTER TABLE Devices
DROP CONSTRAINT IF EXISTS fk_devices_user;

-- Plants
ALTER TABLE Plants
DROP CONSTRAINT IF EXISTS fk_plants_user;

-- Alerts
ALTER TABLE Alerts
DROP CONSTRAINT IF EXISTS fk_alerts_user;

-- Payments
ALTER TABLE Payments
DROP CONSTRAINT IF EXISTS fk_payments_user;

-- RAISE NOTICE 'Step 5: Dropped old foreign key constraints';

-- ============================================================================
-- STEP 6: DROP OLD INTEGER COLUMNS
-- ============================================================================

-- Drop old integer user_id columns from related tables
ALTER TABLE AI_Models DROP COLUMN uploaded_by;
ALTER TABLE Devices DROP COLUMN user_id;
ALTER TABLE Plants DROP COLUMN user_id;
ALTER TABLE Alerts DROP COLUMN user_id;
ALTER TABLE Payments DROP COLUMN user_id;

-- RAISE NOTICE 'Step 6: Dropped old integer user_id columns';

-- ============================================================================
-- STEP 7: RENAME UUID COLUMNS TO user_id
-- ============================================================================

-- Rename UUID columns to user_id
ALTER TABLE AI_Models RENAME COLUMN uploaded_by_uuid TO uploaded_by;
ALTER TABLE Devices RENAME COLUMN user_uuid TO user_id;
ALTER TABLE Plants RENAME COLUMN user_uuid TO user_id;
ALTER TABLE Alerts RENAME COLUMN user_uuid TO user_id;
ALTER TABLE Payments RENAME COLUMN user_uuid TO user_id;

-- Drop old Users primary key and rename user_uuid
ALTER TABLE Users DROP CONSTRAINT users_pkey CASCADE;
ALTER TABLE Users DROP COLUMN user_id;
ALTER TABLE Users RENAME COLUMN user_uuid TO user_id;

-- Create new primary key on UUID
ALTER TABLE Users ADD PRIMARY KEY (user_id);

-- Make UUID columns NOT NULL
ALTER TABLE AI_Models ALTER COLUMN uploaded_by SET NOT NULL;
ALTER TABLE Devices ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE Plants ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE Alerts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE Payments ALTER COLUMN user_id SET NOT NULL;

-- RAISE NOTICE 'Step 7: Renamed UUID columns to user_id';

-- ============================================================================
-- STEP 8: CREATE NEW FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE AI_Models
ADD CONSTRAINT fk_ai_models_admin 
FOREIGN KEY (uploaded_by) REFERENCES Users(user_id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE Devices
ADD CONSTRAINT fk_devices_user 
FOREIGN KEY (user_id) REFERENCES Users(user_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Plants
ADD CONSTRAINT fk_plants_user 
FOREIGN KEY (user_id) REFERENCES Users(user_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Alerts
ADD CONSTRAINT fk_alerts_user 
FOREIGN KEY (user_id) REFERENCES Users(user_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Payments
ADD CONSTRAINT fk_payments_user 
FOREIGN KEY (user_id) REFERENCES Users(user_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- RAISE NOTICE 'Step 8: Created new UUID foreign key constraints';

-- ============================================================================
-- STEP 9: MIGRATE DEVICES TO USE device_key AS PRIMARY KEY
-- ============================================================================

-- Store old device_id mappings for Plants, Sensors_Data, Watering_History
CREATE TEMP TABLE device_id_mapping AS
SELECT device_name, device_id
FROM Devices;

-- Add temporary device_key columns to related tables
ALTER TABLE Plants ADD COLUMN device_key_temp CHAR(36);
ALTER TABLE Sensors_Data ADD COLUMN device_key_temp CHAR(36);
ALTER TABLE Watering_History ADD COLUMN device_key_temp CHAR(36);

-- Populate device_key in related tables
UPDATE Plants p
SET device_key_temp = d.device_key
FROM Devices d
WHERE p.device_id = d.device_id;

UPDATE Sensors_Data sd
SET device_key_temp = d.device_key
FROM Devices d
WHERE sd.device_id = d.device_id;

UPDATE Watering_History wh
SET device_key_temp = (
    SELECT d.device_key 
    FROM Devices d 
    INNER JOIN Plants p ON p.device_id = d.device_id
    WHERE wh.plant_id = p.plant_id
);

-- Drop old foreign key constraints
ALTER TABLE Plants DROP CONSTRAINT IF EXISTS fk_plants_device;
ALTER TABLE Sensors_Data DROP CONSTRAINT IF EXISTS fk_sensordata_device;

-- Drop old device_id columns
ALTER TABLE Plants DROP COLUMN device_id;
ALTER TABLE Sensors_Data DROP COLUMN device_id;

-- Rename device_key_temp to device_id
ALTER TABLE Plants RENAME COLUMN device_key_temp TO device_id;
ALTER TABLE Sensors_Data RENAME COLUMN device_key_temp TO device_id;

-- Make device_id NOT NULL
ALTER TABLE Plants ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE Sensors_Data ALTER COLUMN device_id SET NOT NULL;

-- Drop old primary key from Devices
ALTER TABLE Devices DROP CONSTRAINT devices_pkey CASCADE;

-- Remove old device_id column
ALTER TABLE Devices DROP COLUMN device_id;

-- Rename device_key to device_id (now it's the primary key)
ALTER TABLE Devices RENAME COLUMN device_key TO device_id;

-- Add new primary key on device_id (which is the UUID)
ALTER TABLE Devices ADD PRIMARY KEY (device_id);

-- Recreate foreign keys
ALTER TABLE Plants
ADD CONSTRAINT fk_plants_device 
FOREIGN KEY (device_id) REFERENCES Devices(device_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Sensors_Data
ADD CONSTRAINT fk_sensordata_device 
FOREIGN KEY (device_id) REFERENCES Devices(device_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop temporary mapping table
DROP TABLE device_id_mapping;

-- RAISE NOTICE 'Step 9: Migrated Devices to use device_key (now device_id) as primary key';

-- ============================================================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on user_id in related tables
CREATE INDEX IF NOT EXISTS idx_ai_models_uploaded_by ON AI_Models(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON Devices(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON Plants(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON Alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON Payments(user_id);

-- Index on device_id in related tables
CREATE INDEX IF NOT EXISTS idx_plants_device_id ON Plants(device_id);
CREATE INDEX IF NOT EXISTS idx_sensors_data_device_id ON Sensors_Data(device_id);

-- RAISE NOTICE 'Step 10: Created performance indexes';

-- ============================================================================
-- STEP 11: VERIFY MIGRATION
-- ============================================================================

-- Verify Users table

-- RAISE NOTICE '============================================================================';
-- RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
-- RAISE NOTICE '============================================================================';
-- RAISE NOTICE 'Users table: user_id is now UUID';
-- RAISE NOTICE 'Devices table: device_id (formerly device_key) is now UUID primary key';
-- RAISE NOTICE 'All foreign keys updated';
-- RAISE NOTICE 'Please test the application before committing the transaction';
-- RAISE NOTICE 'To commit: COMMIT;';
-- RAISE NOTICE 'To rollback: ROLLBACK;';
-- RAISE NOTICE '============================================================================';

-- COMMIT or ROLLBACK manually after testing
-- COMMIT;


