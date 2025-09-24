
-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** artGarden IoT Project
-- SQLINES DEMO *** L 8.0+
-- Au... SQLINES DEMO ***
-- Da... SQLINES DEMO ***
-- SQLINES DEMO *** ------------------------------------------------
CREATE database plant_system;
/* SET SCHEMA 'plant_system' */;
-- SQLINES DEMO *** bles for consistency
/* SET NAMES utf8mb4; */
TIME_ZONE := '+07:00'; -- In... SQLINES DEMO ***
/* SET FOREIGN_KEY_CHECKS = 0; */

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** everse order of creation to handle dependencies)
-- SQLINES DEMO *** ------------------------------------------------
DROP TABLE IF EXISTS Chat_History;
DROP TABLE IF EXISTS System_Logs;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Alerts;
DROP TABLE IF EXISTS Pump_Schedules;
DROP TABLE IF EXISTS Watering_History;
DROP TABLE IF EXISTS Sensors_Data;
DROP TABLE IF EXISTS Plants;
DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS AI_Models;
DROP TABLE IF EXISTS Plant_Profiles;
DROP TABLE IF EXISTS Users;

/* SET FOREIGN_KEY_CHECKS = 1; */

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Users`
-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES FOR EVALUATION USE ONLY (14 DAYS)
CREATE TABLE Users (
  user_id INT GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NULL,
  role VARCHAR(30) CHECK (ROLE IN ('Regular', 'Premium', 'Admin')) NOT NULL DEFAULT 'Regular',
  notification_prefs JSON NULL,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP;
) ;
-- Create index for performance on password reset token lookup
CREATE INDEX idx_users_password_reset_token ON Users(password_reset_token);



-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Plant_Profiles` (General plant species information)
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Plant_Profiles (
  profile_id INT GENERATED ALWAYS AS IDENTITY,
  species_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ideal_moisture INT NULL COMMENT 'Recommended soil moisture percentage',
  PRIMARY KEY (profile_id)
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `AI_Models`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE AI_Models (
  model_id INT GENERATED ALWAYS AS IDENTITY,
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NULL,
  file_path VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by INT NOT NULL COMMENT 'Admin user_id',
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (model_id),
  CONSTRAINT fk_ai_models_admin FOREIGN KEY (uploaded_by) REFERENCES Users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Devices` (IoT hardware)
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Devices (
  device_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  device_key CHAR(36) NOT NULL UNIQUE COMMENT 'UUID for secure API communication',
  device_name VARCHAR(100) NULL,
  status VARCHAR(30) CHECK (STATUS IN ('online', 'offline', 'error')) NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP(0) NULL,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id),
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Plants` (User's specific plants)
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Plants (
  plant_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  profile_id INT NULL,
  custom_name VARCHAR(100) NOT NULL,
  moisture_threshold INT NOT NULL COMMENT 'The specific moisture % to trigger watering',
  auto_watering_on BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (plant_id),
  CONSTRAINT fk_plants_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plants_device FOREIGN KEY (device_id) REFERENCES Devices (device_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plants_profile FOREIGN KEY (profile_id) REFERENCES Plant_Profiles (profile_id) ON DELETE SET NULL ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Sensors_Data`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Sensors_Data (
  data_id BIGINT GENERATED ALWAYS AS IDENTITY,
  device_id INT NOT NULL,
  timestamp TIMESTAMP(0) NOT NULL,
  soil_moisture DOUBLE PRECISION NULL,
  temperature DOUBLE PRECISION NULL,
  air_humidity DOUBLE PRECISION NULL,
  light_intensity DOUBLE PRECISION NULL,
  PRIMARY KEY (data_id),
  CONSTRAINT fk_sensordata_device FOREIGN KEY (device_id) REFERENCES Devices (device_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Watering_History`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Watering_History (
  history_id INT GENERATED ALWAYS AS IDENTITY,
  plant_id INT NOT NULL,
  timestamp TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trigger_type VARCHAR(30) CHECK (TRIGGER_TYPE IN ('manual', 'automatic_threshold', 'schedule', 'ai_prediction')) NOT NULL,
  duration_seconds INT NULL,
  PRIMARY KEY (history_id),
  CONSTRAINT fk_wateringhistory_plant FOREIGN KEY (plant_id) REFERENCES Plants (plant_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Pump_Schedules`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Pump_Schedules (
  schedule_id INT GENERATED ALWAYS AS IDENTITY,
  plant_id INT NOT NULL,
  cron_expression VARCHAR(50) NOT NULL COMMENT 'e.g., "0 8 * * *" for 8 AM daily',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (schedule_id),
  CONSTRAINT fk_schedules_plant FOREIGN KEY (plant_id) REFERENCES Plants (plant_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Alerts`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Alerts (
  alert_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) CHECK (STATUS IN ('unread', 'read')) NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alert_id),
  CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Payments`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Payments (
  payment_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  vnpay_txn_ref VARCHAR(255) NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) CHECK (STATUS IN ('completed', 'failed', 'pending')) NOT NULL,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `System_Logs`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE System_Logs (
  log_id BIGINT GENERATED ALWAYS AS IDENTITY,
  timestamp TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  log_level VARCHAR(20) NULL,
  source VARCHAR(100) NULL,
  message TEXT NOT NULL,
  PRIMARY KEY (log_id)
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** or `Chat_History`
-- SQLINES DEMO *** ------------------------------------------------
CREATE TABLE Chat_History (
  chat_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  timestamp TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_message TEXT NULL,
  ai_response TEXT NULL,
  PRIMARY KEY (chat_id),
  CONSTRAINT fk_chathistory_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ;

-- SQLINES DEMO *** ------------------------------------------------
-- SQLINES DEMO *** erformance
-- SQLINES DEMO *** ------------------------------------------------
CREATE INDEX idx_sensordata_device_timestamp ON Sensors_Data (device_id, timestamp);
CREATE INDEX idx_wateringhistory_plant_timestamp ON Watering_History (plant_id, timestamp);
CREATE INDEX idx_alerts_user_status ON Alerts (user_id, status);
CREATE INDEX idx_systemlogs_timestamp_level ON System_Logs (timestamp, log_level);

-- SQLINES DEMO ***  ---
