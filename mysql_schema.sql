-- MySQL Schema for Plant Monitoring System

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS plant_monitoring_system;
USE plant_monitoring_system;

-- Users table
CREATE TABLE users (
    user_id CHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'premium') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY idx_users_email (email),
    UNIQUE KEY idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Zones table
CREATE TABLE zones (
    zone_id INT AUTO_INCREMENT NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (zone_id),
    KEY idx_zones_user_id (user_id),
    CONSTRAINT fk_zones_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices table
CREATE TABLE devices (
    device_id CHAR(36) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive',
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id),
    KEY idx_devices_user_id (user_id),
    CONSTRAINT fk_devices_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plants table
CREATE TABLE plants (
    plant_id INT AUTO_INCREMENT NOT NULL,
    profile_id INT,
    custom_name VARCHAR(100) NOT NULL,
    moisture_threshold INT NOT NULL,
    auto_watering_on BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'healthy',
    user_id CHAR(36) NOT NULL,
    device_id CHAR(36),
    image VARCHAR(255),
    zone_id INT,
    notes TEXT,
    species_name VARCHAR(100),
    PRIMARY KEY (plant_id),
    KEY idx_plants_user_id (user_id),
    KEY idx_plants_device_id (device_id),
    KEY idx_plants_zone_id (zone_id),
    CONSTRAINT fk_plants_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_plants_device FOREIGN KEY (device_id) 
        REFERENCES devices (device_id) ON DELETE SET NULL,
    CONSTRAINT fk_plants_zone FOREIGN KEY (zone_id) 
        REFERENCES zones (zone_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Watering History table
CREATE TABLE watering_history (
    history_id INT AUTO_INCREMENT NOT NULL,
    plant_id INT NOT NULL,
    watered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_ml INT,
    source ENUM('manual', 'automatic', 'scheduled') NOT NULL,
    PRIMARY KEY (history_id),
    KEY idx_watering_history_plant_id (plant_id),
    CONSTRAINT fk_watering_history_plant FOREIGN KEY (plant_id)
        REFERENCES plants (plant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensor Data table
CREATE TABLE sensor_data (
    data_id INT AUTO_INCREMENT NOT NULL,
    device_id CHAR(36) NOT NULL,
    moisture_level INT,
    temperature DECIMAL(5,2),
    humidity INT,
    light_level INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (data_id),
    KEY idx_sensor_data_device_id (device_id),
    KEY idx_sensor_data_recorded_at (recorded_at),
    CONSTRAINT fk_sensor_data_device FOREIGN KEY (device_id)
        REFERENCES devices (device_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plant Profiles table
CREATE TABLE plant_profiles (
    profile_id INT AUTO_INCREMENT NOT NULL,
    species_name VARCHAR(100) NOT NULL,
    ideal_moisture INT NOT NULL,
    ideal_temperature DECIMAL(5,2),
    ideal_humidity INT,
    ideal_light INT,
    description TEXT,
    care_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create triggers for updated_at timestamps
DELIMITER //

CREATE TRIGGER before_user_update 
    BEFORE UPDATE ON users
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER before_zone_update
    BEFORE UPDATE ON zones
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER before_plant_update
    BEFORE UPDATE ON plants
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER before_profile_update
    BEFORE UPDATE ON plant_profiles
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;