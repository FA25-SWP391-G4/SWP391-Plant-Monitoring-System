-- Active: 1755670041367@@127.0.0.1@5432@plant_system@public
-- Active: 1755670041367@@127.0.0.1@5432@postgres@plant_system
-- Test data for Plant Monitoring System
-- Created: October 6, 2023

-- Connect to the plant_system database
-- \c plant_system;  -- This only works in psql interactive mode
-- Using SET statement instead:
SET search_path TO plant_system;

-- Insert test users
INSERT INTO Users (email, password_hash, full_name, role, created_at)
VALUES 
  ('john.doe@example.com', '$2b$10$dYp0oOWMrvE88F6k3jtb6eS9mVVBqJVYdMf/pCM1X5l0286mLZiV2', 'John Doe', 'Regular', CURRENT_TIMESTAMP),  -- password: password123
  ('jane.smith@example.com', '$2b$10$WTaz5SLwljCRrOTjVL0PFOQps5DzbpjUbvYq6dPhIcxbY7V4hikIi', 'Jane Smith', 'Premium', CURRENT_TIMESTAMP),  -- password: password123
  ('admin@plantsys.com', '$2b$10$t9VtQbk5xBRwYvYEBHq3F.FcoPrZKsVRnTM6YEP/z2AKZkGO8.cGC', 'Admin User', 'Admin', CURRENT_TIMESTAMP);  -- password: admin123

-- Insert plant profiles (general plant species information)
INSERT INTO Plant_Profiles (species_name, description, ideal_moisture)
VALUES
  ('Monstera Deliciosa', 'The Swiss Cheese Plant is known for its large, holey leaves. It prefers bright indirect light and moderate watering.', 60),
  ('Peace Lily', 'An easy-care flowering plant that thrives in low light conditions. It likes consistently moist soil.', 70),
  ('Snake Plant', 'A highly tolerant, low maintenance plant with stiff, upright leaves. It prefers dry conditions.', 40),
  ('Fiddle Leaf Fig', 'A popular indoor tree with large, violin-shaped leaves. It requires bright indirect light and moderate watering.', 55),
  ('Pothos', 'A trailing vine with heart-shaped leaves. Very adaptable to various light conditions.', 50),
  ('Aloe Vera', 'A succulent plant known for its medicinal properties. Prefers dry conditions and bright light.', 30),
  ('Rubber Plant', 'A popular indoor tree with dark, glossy leaves. It requires bright indirect light.', 55),
  ('Phalaenopsis Orchid', 'Common household orchid with long-lasting flowers. Requires specific care and humidity.', 45);

-- Insert AI Models
INSERT INTO AI_Models (model_name, version, file_path, is_active, uploaded_by, created_at)
VALUES
  ('PlantHealthV1', '1.0.0', '/models/plant_health_v1.h5', TRUE, 3, CURRENT_TIMESTAMP),
  ('MoisturePredictor', '1.2.1', '/models/moisture_predictor.pkl', TRUE, 3, CURRENT_TIMESTAMP),
  ('PlantIdentifier', '2.0.0', '/models/plant_identifier.tflite', FALSE, 3, CURRENT_TIMESTAMP);

-- Insert Devices
INSERT INTO Devices (user_id, device_key, device_name, status, last_seen, created_at)
VALUES
  (1, '550e8400-e29b-41d4-a716-446655440000', 'Living Room Hub', 'online', CURRENT_TIMESTAMP - INTERVAL '5 minutes', CURRENT_TIMESTAMP - INTERVAL '30 days'),
  (1, '550e8400-e29b-41d4-a716-446655440001', 'Bedroom Hub', 'offline', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
  (2, '550e8400-e29b-41d4-a716-446655440002', 'Kitchen Garden', 'online', CURRENT_TIMESTAMP - INTERVAL '10 minutes', CURRENT_TIMESTAMP - INTERVAL '45 days'),
  (2, '550e8400-e29b-41d4-a716-446655440003', 'Balcony System', 'error', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '40 days');

-- Insert Plants
INSERT INTO Plants (user_id, device_id, profile_id, custom_name, moisture_threshold, auto_watering_on, created_at)
VALUES
  -- John's plants
  (1, 1, 1, 'My Monstera', 55, TRUE, CURRENT_TIMESTAMP - INTERVAL '28 days'),
  (1, 1, 2, 'Living Room Lily', 65, TRUE, CURRENT_TIMESTAMP - INTERVAL '28 days'),
  (1, 2, 3, 'Bedroom Snake Plant', 35, FALSE, CURRENT_TIMESTAMP - INTERVAL '24 days'),
  (1, 2, 4, 'Fiddle Leaf Friend', 50, TRUE, CURRENT_TIMESTAMP - INTERVAL '20 days'),
  (2, 3, 5, 'Kitchen Pothos', 45, TRUE, CURRENT_TIMESTAMP - INTERVAL '42 days'),
  (2, 3, 6, 'My Aloe', 25, FALSE, CURRENT_TIMESTAMP - INTERVAL '40 days'),
  (2, 4, 7, 'Rubber Tree', 50, TRUE, CURRENT_TIMESTAMP - INTERVAL '38 days'),
  (2, 4, 8, 'Orchid Beauty', 40, TRUE, CURRENT_TIMESTAMP - INTERVAL '35 days');

-- Insert Sensors_Data (last 3 days, readings every hour)
-- For John's devices
DO $$
DECLARE
    i INT;
    reference_time TIMESTAMP := '2024-05-01 12:00:00'; -- Fixed reference date instead of CURRENT_TIMESTAMP
    reading_time TIMESTAMP;
    temp DOUBLE PRECISION;
    humidity DOUBLE PRECISION;
    moisture DOUBLE PRECISION;
    light DOUBLE PRECISION;
BEGIN
    -- For Device 1 (Living Room Hub - online)
    FOR i IN 0..71 LOOP -- 3 days * 24 hours = 72 readings
        reading_time := reference_time - (i * INTERVAL '1 hour');
        
        -- Normal healthy readings
        temp := 21.0 + (RANDOM() * 3);
        humidity := 55.0 + (RANDOM() * 15);
        moisture := 60.0 + (RANDOM() * 10);
        light := 70.0 + (RANDOM() * 20);
        
        INSERT INTO Sensors_Data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
        VALUES (1, reading_time, moisture, temp, humidity, light);
    END LOOP;
    
    -- For Device 2 (Bedroom Hub - offline)
    -- Only add readings until it went offline
    FOR i IN 48..71 LOOP -- Last readings before going offline
        reading_time := reference_time - (i * INTERVAL '1 hour');
        
        -- Slightly worse readings
        temp := 19.0 + (RANDOM() * 2);
        humidity := 40.0 + (RANDOM() * 10);
        moisture := 30.0 + (RANDOM() * 15); -- Low moisture
        light := 40.0 + (RANDOM() * 15); -- Low light
        
        INSERT INTO Sensors_Data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
        VALUES (2, reading_time, moisture, temp, humidity, light);
    END LOOP;

    -- For Device 3 (Kitchen Garden - online)
    FOR i IN 0..71 LOOP
        reading_time := reference_time - (i * INTERVAL '1 hour');
        
        -- Good readings
        temp := 22.0 + (RANDOM() * 3);
        humidity := 60.0 + (RANDOM() * 10);
        moisture := 55.0 + (RANDOM() * 15);
        light := 80.0 + (RANDOM() * 15);
        
        INSERT INTO Sensors_Data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
        VALUES (3, reading_time, moisture, temp, humidity, light);
    END LOOP;
    
    -- For Device 4 (Balcony System - error)
    FOR i IN 0..4 LOOP -- Recent readings before error
        reading_time := reference_time - (i * INTERVAL '1 hour');
        
        -- Erratic readings
        temp := 26.0 + (RANDOM() * 5); -- High temp
        humidity := 20.0 + (RANDOM() * 10); -- Low humidity
        moisture := 15.0 + (RANDOM() * 10); -- Very low moisture
        light := 95.0 + (RANDOM() * 5); -- Very high light (direct sun)
        
        INSERT INTO Sensors_Data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
        VALUES (4, reading_time, moisture, temp, humidity, light);
    END LOOP;
END $$;

-- Insert Watering_History
INSERT INTO Watering_History (plant_id, timestamp, trigger_type, duration_seconds)
VALUES
  -- John's plants
  (1, CURRENT_TIMESTAMP - INTERVAL '5 days', 'schedule', 30),
  (1, CURRENT_TIMESTAMP - INTERVAL '2 days', 'schedule', 30),
  (2, CURRENT_TIMESTAMP - INTERVAL '6 days', 'automatic_threshold', 45),
  (2, CURRENT_TIMESTAMP - INTERVAL '3 days', 'manual', 60),
  (3, CURRENT_TIMESTAMP - INTERVAL '14 days', 'manual', 20),
  (4, CURRENT_TIMESTAMP - INTERVAL '4 days', 'automatic_threshold', 35),
  (4, CURRENT_TIMESTAMP - INTERVAL '1 day', 'ai_prediction', 25),
  
  -- Jane's plants
  (5, CURRENT_TIMESTAMP - INTERVAL '7 days', 'schedule', 30),
  (5, CURRENT_TIMESTAMP - INTERVAL '3 days', 'schedule', 30),
  (6, CURRENT_TIMESTAMP - INTERVAL '20 days', 'manual', 15),
  (7, CURRENT_TIMESTAMP - INTERVAL '5 days', 'automatic_threshold', 40),
  (8, CURRENT_TIMESTAMP - INTERVAL '5 days', 'manual', 10),
  (8, CURRENT_TIMESTAMP - INTERVAL '2 days', 'manual', 10);

-- Insert Pump_Schedules
INSERT INTO Pump_Schedules (plant_id, cron_expression, is_active)
VALUES
  (1, '0 8 * * *', TRUE),       -- Daily at 8 AM
  (2, '0 9 * * *', TRUE),       -- Daily at 9 AM
  (3, '0 10 * * 0', FALSE),     -- Sundays at 10 AM
  (4, '0 7 * * 2,5', TRUE),     -- Tuesdays and Fridays at 7 AM
  (5, '0 8 * * 1,3,5', TRUE),   -- Monday, Wednesday, Friday at 8 AM
  (6, '0 8 1,15 * *', TRUE),    -- 1st and 15th of month at 8 AM
  (7, '0 9 * * 2,6', TRUE),     -- Tuesday and Saturday at 9 AM
  (8, '0 10 * * 0,3', TRUE);    -- Sunday and Wednesday at 10 AM

-- Insert Alerts
INSERT INTO Alerts (user_id, message, status, created_at)
VALUES
  -- John's alerts
  (1, 'Low moisture detected for your Living Room Lily. Automatic watering triggered.', 'unread', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (1, 'Your Bedroom Hub device is offline. Please check the connection.', 'unread', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (1, 'Fiddle Leaf Friend is showing signs of stress. Adjust watering schedule.', 'read', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  
  -- Jane's alerts
  (2, 'Balcony System is reporting an error. Check device status.', 'unread', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
  (2, 'Critical moisture level for Orchid Beauty. Manual watering recommended.', 'unread', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
  (2, 'Your Kitchen Garden is experiencing high temperatures. Consider moving to shade.', 'read', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Insert Payments (for Premium user)
INSERT INTO Payments (user_id, vnpay_txn_ref, amount, status, created_at)
VALUES
  (2, 'VNP123456789', 99.99, 'completed', CURRENT_TIMESTAMP - INTERVAL '45 days'),
  (2, 'VNP987654321', 99.99, 'completed', CURRENT_TIMESTAMP - INTERVAL '15 days'),
  (1, 'VNP123454321', 99.99, 'failed', CURRENT_TIMESTAMP - INTERVAL '10 days');

-- Insert System_Logs
INSERT INTO System_Logs (timestamp, log_level, source, message)
VALUES
  (CURRENT_TIMESTAMP - INTERVAL '5 days', 'INFO', 'AuthService', 'User login: john.doe@example.com'),
  (CURRENT_TIMESTAMP - INTERVAL '4 days', 'WARNING', 'DeviceService', 'Device offline: Bedroom Hub'),
  (CURRENT_TIMESTAMP - INTERVAL '3 days', 'ERROR', 'WateringService', 'Failed to trigger pump for plant_id=8'),
  (CURRENT_TIMESTAMP - INTERVAL '2 days', 'INFO', 'AuthService', 'User login: jane.smith@example.com'),
  (CURRENT_TIMESTAMP - INTERVAL '1 day', 'ERROR', 'DeviceService', 'Device error: Balcony System - sensor fault detected'),
  (CURRENT_TIMESTAMP - INTERVAL '6 hours', 'INFO', 'AIService', 'Model prediction completed for 8 plants'),
  (CURRENT_TIMESTAMP - INTERVAL '1 hour', 'INFO', 'AuthService', 'User login: admin@plantsys.com');

-- Insert Chat_History
INSERT INTO Chat_History (user_id, timestamp, user_message, ai_response)
VALUES
  (1, CURRENT_TIMESTAMP - INTERVAL '5 days', 'Why are the leaves on my Monstera turning yellow?', 'Yellow leaves on Monstera plants are often caused by overwatering. Make sure you let the soil dry out between waterings. Check that your pot has proper drainage.'),
  (1, CURRENT_TIMESTAMP - INTERVAL '3 days', 'When should I fertilize my Peace Lily?', 'Peace Lilies benefit from fertilizing every 6-8 weeks during the growing season (spring and summer). Use a balanced houseplant fertilizer diluted to half the recommended strength.'),
  (1, CURRENT_TIMESTAMP - INTERVAL '1 day', 'How often should I water my Fiddle Leaf Fig?', 'Fiddle Leaf Figs prefer to dry out slightly between waterings. Check the top 1-2 inches of soil - if it feels dry, it''s time to water. For your specific plant, based on its current readings, I''d recommend watering in 3-4 days.'),
  
  (2, CURRENT_TIMESTAMP - INTERVAL '6 days', 'My Orchid has yellow leaves. What should I do?', 'Yellow leaves on Orchids are normal as older leaves die off. However, if many leaves are yellowing, it could indicate overwatering or too much direct sunlight. Based on your sensor data, I recommend moving your orchid to a spot with less direct light.'),
  (2, CURRENT_TIMESTAMP - INTERVAL '4 days', 'Is my Aloe Vera getting enough light?', 'Based on your sensor readings, your Aloe Vera is receiving adequate light. Aloe plants prefer bright, indirect sunlight. The current light levels of 85% are ideal for this plant.'),
  (2, CURRENT_TIMESTAMP - INTERVAL '2 days', 'Why is my Rubber Plant dropping leaves?', 'Leaf drop in Rubber Plants can be caused by sudden temperature changes, drafts, or inconsistent watering. Your sensor data shows some temperature fluctuations. Try to maintain a more consistent environment and water only when the top inch of soil is dry.');

-- Generate random sequential IDs
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM Users));
SELECT setval('plant_profiles_profile_id_seq', (SELECT MAX(profile_id) FROM Plant_Profiles));
SELECT setval('ai_models_model_id_seq', (SELECT MAX(model_id) FROM AI_Models));
SELECT setval('devices_device_id_seq', (SELECT MAX(device_id) FROM Devices));
SELECT setval('plants_plant_id_seq', (SELECT MAX(plant_id) FROM Plants));
SELECT setval('watering_history_history_id_seq', (SELECT MAX(history_id) FROM Watering_History));
SELECT setval('pump_schedules_schedule_id_seq', (SELECT MAX(schedule_id) FROM Pump_Schedules));
SELECT setval('alerts_alert_id_seq', (SELECT MAX(alert_id) FROM Alerts));
SELECT setval('payments_payment_id_seq', (SELECT MAX(payment_id) FROM Payments));
SELECT setval('system_logs_log_id_seq', (SELECT MAX(log_id) FROM System_Logs));
SELECT setval('chat_history_chat_id_seq', (SELECT MAX(chat_id) FROM Chat_History));

-- Output completion message
DO $$ 
BEGIN 
  RAISE NOTICE 'Test data has been successfully loaded into the plant_system database.';
END $$;