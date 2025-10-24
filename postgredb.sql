-- Active: 1755670041367@@127.0.0.1@5432@plant_system
-- Active: 1755670041367@@127.0.0.1@5432@plant_system-- Active: 1755670041367@@127.0.0.1@5432@postgres
-- Plant Monitoring System Database Schema for PostgreSQL

CREATE DATABASE plant_system;
\c plant_system;

-- Drop tables in reverse order to handle dependencies
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

-- Table for Users
CREATE TABLE Users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL, -- NULL allowed for Google-only accounts
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
-- Create index for performance on password reset token lookup
CREATE INDEX idx_users_password_reset_token ON Users(password_reset_token);

-- Table for Plant_Profiles (General plant species information)
CREATE TABLE Plant_Profiles (
  profile_id SERIAL PRIMARY KEY,
  species_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ideal_moisture INT NULL -- Recommended soil moisture percentage
);

-- Table for AI_Models
CREATE TABLE AI_Models (
  model_id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NULL,
  file_path VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by INT NOT NULL, -- Admin user_id
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_models_admin FOREIGN KEY (uploaded_by) REFERENCES Users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for Devices (IoT hardware)
CREATE TABLE Devices (
  device_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_key CHAR(36) NOT NULL UNIQUE, -- UUID for secure API communication
  device_name VARCHAR(100) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table for Plants (User's specific plants)
CREATE TABLE Plants (
  plant_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  profile_id INT NULL,
  custom_name VARCHAR(100) NOT NULL,
  moisture_threshold INT NOT NULL, -- The specific moisture % to trigger watering
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
  cron_expression VARCHAR(50) NOT NULL, -- e.g., "0 8 * * *" for 8 AM daily
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
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_message TEXT NULL,
  ai_response TEXT NULL,
  CONSTRAINT fk_chathistory_user FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_sensordata_device_timestamp ON Sensors_Data (device_id, timestamp);
CREATE INDEX idx_wateringhistory_plant_timestamp ON Watering_History (plant_id, timestamp);
CREATE INDEX idx_alerts_user_status ON Alerts (user_id, status);
CREATE INDEX idx_systemlogs_timestamp_level ON System_Logs (timestamp, log_level);
