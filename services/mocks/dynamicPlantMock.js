/**
 * Dynamic Plant Monitoring Mock Service
 * 
 * This service generates realistic plant and sensor data that changes over time,
 * simulating a real IoT plant monitoring system. It follows the same data structure
 * as the real database models to ensure compatibility with the controllers.
 * 
 * This is an enhanced version that integrates with real database and controllers,
 * while providing simulated sensor data for development and testing purposes.
 */

const { randomInt, randomUUID } = require('crypto');
const db = require('../../config/db');
const { Pool } = require('pg');

// Import models for database interaction
let Plant, SensorData, Device, WateringHistory;

// Try to load models, but don't fail if they're not available yet
// They will be loaded later in setupAsync
try {
  Plant = require('../../models/Plant');
  SensorData = require('../../models/SensorData');
  Device = require('../../models/Device');
  WateringHistory = require('../../models/WateringHistory');
} catch (error) {
  console.log('Mock service: Models not yet available, will connect later when database is ready');
}

class DynamicPlantMockService {
  constructor() {
    // In-memory data storage for simulation
    this.plants = [];
    this.sensorData = {};
    this.wateringHistory = [];
    this.users = [];
    this.devices = [];
    this.activities = [];
    this.schedules = [];
    
    // Mock User ID - explicitly set to user ID 11 as requested
    this.mockUserId = 11;
    
    // Track simulation state
    this.isInitialized = false;
    this.simulationInterval = null;
    
    // Connection to the database (will be set up later)
    this.dbPool = null;
    
    // Don't automatically initialize - will be called from app.js
    console.log('Dynamic Plant Mock Service instantiated for user ID:', this.mockUserId);
  }
  
  /**
   * Set up database connection and initialize data asynchronously
   */
  async setupAsync() {
    try {
      // Wait for database connection to be available
      this.dbPool = await this.waitForDbConnection();
      
      // Load required models if they weren't loaded at construction time
      if (!Plant) {
        try {
          Plant = require('../../models/Plant');
          SensorData = require('../../models/SensorData');
          Device = require('../../models/Device');
          WateringHistory = require('../../models/WateringHistory');
        } catch (error) {
          console.error('Failed to load models:', error);
        }
      }
      
      // Initialize mock data
      await this.initializeData();
      
      // Start the simulation
      this.startSimulation();
      
      console.log('Dynamic Plant Mock Service initialized successfully for user ID:', this.mockUserId);
      return this; // Return the instance for promise chaining
    } catch (error) {
      console.error('Failed to initialize mock service:', error);
      // Try again in 5 seconds
      setTimeout(() => this.setupAsync(), 5000);
      throw error; // Propagate the error
    }
  }
  
  /**
   * Wait for database connection to be available
   */
  async waitForDbConnection() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        if (db && db.query) {
          return db;
        } else {
          // If db is not ready, try to create a new connection
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0@localhost:5432/plant_system'
          });
          
          // Test connection
          await pool.query('SELECT NOW()');
          return pool;
        }
      } catch (error) {
        attempts++;
        console.log(`Waiting for database connection... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Failed to connect to database after multiple attempts');
  }
  
  /**
   * Initialize the mock data with realistic values
   * This loads data from the database where possible, and creates mock data where needed
   */
  async initializeData() {
    try {
      console.log(`Initializing mock data for user ID: ${this.mockUserId}`);
      
      // Check if the mock user exists (ID 11)
      let userExists = false;
      try {
        // Check if the users table exists
        const tableCheck = await this.dbPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          )`);
          
        if (tableCheck.rows[0].exists) {
          const userResult = await this.dbPool.query('SELECT * FROM "users" WHERE user_id = $1', [this.mockUserId]);
          userExists = userResult.rows.length > 0;
          
          if (userExists) {
            // Store the user in our local cache
            this.users = [userResult.rows[0]];
            console.log(`Found existing user with ID ${this.mockUserId}`);
          }
        } else {
          console.log('users table does not exist yet, will create mock user in memory only');
        }
      } catch (error) {
        console.error('Error checking for mock user:', error);
      }
      
      // Create the mock user if it doesn't exist
      if (!userExists) {
        try {
          // Insert according to exact schema in postgredb.sql:
          // user_id SERIAL PRIMARY KEY,
          // email VARCHAR(100) NOT NULL UNIQUE,
          // password_hash VARCHAR(255) NOT NULL,
          // full_name VARCHAR(100) NULL,
          // role VARCHAR(30) NOT NULL DEFAULT 'Regular' CHECK (role IN ('Regular', 'Premium', 'Admin')),
          // notification_prefs JSONB NULL,
          // created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          // password_reset_token VARCHAR(255),
          // password_reset_expires TIMESTAMP
          const result = await this.dbPool.query(
            'INSERT INTO users (user_id, email, password_hash, given_name, family_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
              this.mockUserId,
              'mockuser@plantsystem.com',
              '$2b$12$QkMnUYr5PZRx4SqgCcsKeuICwPqj3YUAHwdE1YRKHeHSZ6QAST5aG', // hashed password "mockpassword"
              'Mock',
              'User',
              'Premium'
            ]
          );
          
          this.users = [result.rows[0]];
          console.log('Created mock user with ID:', this.mockUserId);
        } catch (error) {
          console.error('Failed to create mock user:', error);
          // Fall back to in-memory user
          this.users = [{
            user_id: this.mockUserId,
            email: 'mockuser@plantsystem.com',
            given_name: 'Mock',
            family_name: 'User',
            role: 'premium',
            profile_picture: '/images/avatars/default.jpg',
            created_at: new Date().toISOString()
          }];
        }
      }
      
      // Create devices for the mock user - using the specific devices requested
      await this.setupMockDevices();
      
      // Set up Common Lantana plant as requested
      await this.setupMockplants();
      
      // Create initial sensor data and watering history
      await this.setupInitialSensorData();
      
      // Create watering schedules
      await this.setupWateringSchedules();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing mock data:', error);
      throw error;
    }
  }
  
  /**
   * Set up mock devices for the user - matching the DB schema from postgredb.sql
   */
  async setupMockDevices() {
    try {
      // Check for existing devices first
      const deviceResult = await this.dbPool.query(
        'SELECT * FROM devices WHERE user_id = $1',
        [this.mockUserId]
      );
      
      if (deviceResult.rows.length > 0) {
        // Use existing devices
        this.devices = deviceResult.rows;
        return;
      }
      
      // Define our devices based on the requested hardware
      const deviceSpecs = [
        {
          device_name: 'ESP-32 WiFi Module',
          device_type: 'controller',
          status: 'active',
          location: 'Indoor Garden',
          firmware_version: '1.2.3',
          last_online: new Date().toISOString(),
          properties: {
            ip: '192.168.1.100',
            mac: 'AC:67:B2:34:C5:F8',
            processor: 'ESP-32',
            ram: '520KB',
            flash: '4MB'
          }
        },
        {
          device_name: 'Soil Moisture Sensor',
          device_type: 'sensor',
          sensor_type: 'moisture',
          status: 'active',
          location: 'Indoor Garden',
          properties: {
            model: 'YL-69',
            range: '0-100%',
            accuracy: '±3%',
            connection_type: 'analog'
          }
        },
        {
          device_name: 'BH1750 Light Sensor',
          device_type: 'sensor',
          sensor_type: 'light',
          status: 'active',
          location: 'Indoor Garden',
          properties: {
            model: 'BH1750',
            range: '1-65535 lux',
            accuracy: '±20%',
            connection_type: 'i2c'
          }
        },
        {
          device_name: 'Water Level Sensor',
          device_type: 'sensor',
          sensor_type: 'water_level',
          status: 'active',
          location: 'Water Reservoir',
          properties: {
            model: 'XKC-Y25-V',
            range: '0-100%',
            connection_type: 'analog'
          }
        },
        {
          device_name: 'DS18B20 Temperature Sensor',
          device_type: 'sensor',
          sensor_type: 'temperature',
          status: 'active',
          location: 'Indoor Garden',
          properties: {
            model: 'DS18B20',
            range: '-55°C to +125°C',
            accuracy: '±0.5°C',
            connection_type: 'digital',
            protocol: 'OneWire'
          }
        },
        {
          device_name: 'DHT22 Humidity Sensor',
          device_type: 'sensor',
          sensor_type: 'humidity',
          status: 'active',
          location: 'Indoor Garden',
          properties: {
            model: 'DHT22',
            range: '0-100% RH',
            accuracy: '±2% RH',
            connection_type: 'digital',
            extra_capability: 'temperature'
          }
        },
        {
          device_name: 'Relay Module',
          device_type: 'actuator',
          actuator_type: 'pump',
          status: 'active',
          location: 'Water Pump',
          properties: {
            model: '5V Relay Module',
            channels: '1',
            trigger_type: 'low level',
            max_current: '10A/250V AC'
          }
        },
        {
          device_name: '5V Power Supply',
          device_type: 'power',
          status: 'active',
          location: 'Indoor Garden',
          properties: {
            model: 'LM2596 Buck Converter',
            input: '7-24V',
            output: '5V',
            max_current: '3A',
            efficiency: '85%'
          }
        }
      ];
      
      // Create devices in database and store them locally
      this.devices = [];
      
      for (let i = 0; i < deviceSpecs.length; i++) {
        const spec = deviceSpecs[i];
        try {
          // Generate UUID for device_key (required by schema)
          const deviceKey = require('crypto').randomUUID();
          
          // Insert according to exact schema in postgredb.sql:
          // device_id SERIAL PRIMARY KEY,
          // user_id INT NOT NULL,
          // device_key CHAR(36) NOT NULL UNIQUE, -- UUID for secure API communication
          // device_name VARCHAR(100) NULL,
          // status VARCHAR(30) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
          // last_seen TIMESTAMP NULL,
          // created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          const result = await this.dbPool.query(
            'INSERT INTO devices (user_id, device_key, device_name, status, last_seen) ' +
            'VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
              this.mockUserId,
              deviceKey,
              spec.device_name,
              spec.status === 'active' ? 'online' : 'offline', // Map 'active' to 'online' per schema
              new Date().toISOString()
            ]
          );
          
          this.devices.push(result.rows[0]);
        } catch (error) {
          console.error(`Failed to create device ${spec.device_name}:`, error);
        }
      }
      
      console.log(`Created ${this.devices.length} mock devices for user ${this.mockUserId}`);
    } catch (error) {
      console.error('Error setting up mock devices:', error);
      // Fallback to in-memory devices
      this.setupInMemoryDevices();
    }
  }

  /**
   * Fallback method to create in-memory devices if database operations fail
   */
  setupInMemoryDevices() {
    this.devices = [
      {
        device_id: 1,
        user_id: this.mockUserId,
        device_name: 'ESP-32 WiFi Module',
        device_type: 'controller',
        status: 'active',
        location: 'Indoor Garden',
        firmware_version: '1.2.3',
        last_online: new Date().toISOString(),
        properties: {
          ip: '192.168.1.100',
          mac: 'AC:67:B2:34:C5:F8',
          processor: 'ESP-32',
          ram: '520KB',
          flash: '4MB'
        }
      },
      {
        device_id: 2,
        user_id: this.mockUserId,
        device_name: 'Soil Moisture Sensor',
        device_type: 'sensor',
        sensor_type: 'moisture',
        status: 'active',
        location: 'Indoor Garden',
        last_online: new Date().toISOString()
      },
      {
        device_id: 3,
        user_id: this.mockUserId,
        device_name: 'BH1750 Light Sensor',
        device_type: 'sensor',
        sensor_type: 'light',
        status: 'active',
        location: 'Indoor Garden',
        last_online: new Date().toISOString()
      },
      {
        device_id: 4,
        user_id: this.mockUserId,
        device_name: 'Water Level Sensor',
        device_type: 'sensor',
        sensor_type: 'water_level',
        status: 'active',
        location: 'Water Reservoir',
        last_online: new Date().toISOString()
      },
      {
        device_id: 5,
        user_id: this.mockUserId,
        device_name: 'DS18B20 Temperature Sensor',
        device_type: 'sensor',
        sensor_type: 'temperature',
        status: 'active',
        location: 'Indoor Garden',
        last_online: new Date().toISOString()
      },
      {
        device_id: 6,
        user_id: this.mockUserId,
        device_name: 'DHT22 Humidity Sensor',
        device_type: 'sensor',
        sensor_type: 'humidity',
        status: 'active',
        location: 'Indoor Garden',
        last_online: new Date().toISOString()
      },
      {
        device_id: 7,
        user_id: this.mockUserId,
        device_name: 'Relay Module',
        device_type: 'actuator',
        actuator_type: 'pump',
        status: 'active',
        location: 'Water Pump',
        last_online: new Date().toISOString()
      },
      {
        device_id: 8,
        user_id: this.mockUserId,
        device_name: '5V Power Supply',
        device_type: 'power',
        status: 'active',
        location: 'Indoor Garden',
        last_online: new Date().toISOString()
      }
    ];
  }
  
  /**
   * Set up the Common Lantana plant as requested
   */
  async setupMockplants() {
    try {
      // Check for existing plants first
      const plantResult = await this.dbPool.query(
        'SELECT * FROM "plants" WHERE user_id = $1',
        [this.mockUserId]
      );
      
      if (plantResult.rows.length > 0) {
        // Use existing plants
        this.plants = plantResult.rows;
        return;
      }
      
      // Define the Common Lantana plant
      const lantanaSpec = {
        name: 'Common Lantana',
        scientific_name: 'Lantana camara',
        type: 'lantana',
        size: 45, // cm
        age_days: 180,
        health: 87, // percent
        location: 'Indoor Garden',
        description: 'A colorful flowering shrub with vibrant clusters of small flowers that change color as they mature.',
        image_url: '/images/plants/lantana.jpg',
        water_frequency: 5, // days
        light_preference: 'full sun to partial shade',
        temperature_min: 15, // celsius
        temperature_max: 32, // celsius
        thresholds: {
          moisture_min: 25,
          moisture_max: 60,
          light_min: 2000,
          light_max: 10000,
          temperature_min: 15,
          temperature_max: 32,
          humidity_min: 30,
          humidity_max: 70
        },
        notes: 'Lantana is considered invasive in many regions. The berries are toxic to humans but attract birds.'
      };
      
      try {
        // First, find a device to associate with this plant
        const mainDevice = this.devices && this.devices.length > 0 ? this.devices[0] : null;
        
        if (!mainDevice) {
          throw new Error('No available to associate with plant');
        }
        
        // Create a plant profile for Lantana if needed
        let profileId = null;
        try {
          const profileResult = await this.dbPool.query(
            'INSERT INTO Plant_Profiles (species_name, description, ideal_moisture) VALUES ($1, $2, $3) RETURNING profile_id',
            [
              lantanaSpec.scientific_name,
              lantanaSpec.description,
              lantanaSpec.thresholds.moisture_min + 10
            ]
          );
          profileId = profileResult.rows[0].profile_id;
        } catch (error) {
          console.error('Error creating plant profile:', error);
        }
        
        // Insert according to exact schema in postgredb.sql:
        // plant_id SERIAL PRIMARY KEY,
        // user_id INT NOT NULL,
        // device_id INT NOT NULL,
        // profile_id INT NULL,
        // custom_name VARCHAR(100) NOT NULL,
        // moisture_threshold INT NOT NULL, -- The specific moisture % to trigger watering
        // auto_watering_on BOOLEAN NOT NULL DEFAULT TRUE,
        // created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        const result = await this.dbPool.query(
          `INSERT INTO plants (
            user_id, device_id, profile_id, custom_name, moisture_threshold, auto_watering_on
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            this.mockUserId,
            mainDevice.device_id,
            profileId,
            lantanaSpec.name,
            lantanaSpec.thresholds.moisture_min,
            true
          ]
        );
        
        this.plants = [result.rows[0]];
        console.log(`Created Common Lantana plant for user ${this.mockUserId}`);
        
        // Associate plant with devices
        await this.associatePlantWithDevices(result.rows[0].plant_id);
      } catch (error) {
        console.error('Failed to create Common Lantana plant:', error);
        // Fall back to in-memory plant
        this.setupInMemoryplants();
      }
    } catch (error) {
      console.error('Error setting up mock plants:', error);
      this.setupInMemoryplants();
    }
  }
  
  /**
   * Associate a plant with devices in the database
   */
  async associatePlantWithDevices(plantId) {
    try {
      // Find appropriate device IDs
      const moistureSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'moisture');
      const lightSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'light');
      const tempSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'temperature');
      const humiditySensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'humidity');
      const pumpDevice = this.devices.find(d => d.device_type === 'actuator' && d.actuator_type === 'pump');
      
      // Create plant_device mappings in database if table exists
      try {
        if (moistureSensor) {
          await this.dbPool.query(
            'INSERT INTO plant_devices (plant_id, device_id, assignment_type) VALUES ($1, $2, $3)',
            [plantId, moistureSensor.device_id, 'moisture_sensor']
          );
        }
        
        if (lightSensor) {
          await this.dbPool.query(
            'INSERT INTO plant_devices (plant_id, device_id, assignment_type) VALUES ($1, $2, $3)',
            [plantId, lightSensor.device_id, 'light_sensor']
          );
        }
        
        if (tempSensor) {
          await this.dbPool.query(
            'INSERT INTO plant_devices (plant_id, device_id, assignment_type) VALUES ($1, $2, $3)',
            [plantId, tempSensor.device_id, 'temperature_sensor']
          );
        }
        
        if (humiditySensor) {
          await this.dbPool.query(
            'INSERT INTO plant_devices (plant_id, device_id, assignment_type) VALUES ($1, $2, $3)',
            [plantId, humiditySensor.device_id, 'humidity_sensor']
          );
        }
        
        if (pumpDevice) {
          await this.dbPool.query(
            'INSERT INTO plant_devices (plant_id, device_id, assignment_type) VALUES ($1, $2, $3)',
            [plantId, pumpDevice.device_id, 'water_pump']
          );
        }
      } catch (error) {
        // If plant_devices table doesn't exist, we'll skip this step
        console.log('Note: plant_devices table may not exist, skipping device association');
      }
    } catch (error) {
      console.error('Error associating plant with devices:', error);
    }
  }
  
  /**
   * Fallback method to create in-memory plants
   */
  setupInMemoryplants() {
    this.plants = [{
      plant_id: 1,
      user_id: this.mockUserId,
      name: 'Common Lantana',
      scientific_name: 'Lantana camara',
      type: 'lantana',
      size: 45,
      age_days: 180,
      health: 87,
      location: 'Indoor Garden',
      description: 'A colorful flowering shrub with vibrant clusters of small flowers that change color as they mature.',
      image_url: '/images/plants/lantana.jpg',
      water_frequency: 5,
      light_preference: 'full sun to partial shade',
      temperature_min: 15,
      temperature_max: 32,
      thresholds: {
        moisture_min: 25,
        moisture_max: 60,
        light_min: 2000,
        light_max: 10000,
        temperature_min: 15,
        temperature_max: 32,
        humidity_min: 30,
        humidity_max: 70
      },
      notes: 'Lantana is considered invasive in many regions. The berries are toxic to humans but attract birds.',
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      last_watered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }];
  }
  
  /**
   * Set up initial sensor data for the plant
   */
  async setupInitialSensorData() {
    try {
      // Check if we have any plants and devices
      if (this.plants.length === 0 || this.devices.length === 0) {
        console.log('No plants or devices to create sensor data for');
        return;
      }
      
      const plant = this.plants[0];
      const plantId = plant.plant_id;
      const deviceId = plant.device_id;
      
      // Check if sensor data already exists for the device
      const dataCheck = await this.dbPool.query(
        'SELECT COUNT(*) FROM Sensors_Data WHERE device_id = $1',
        [deviceId]
      );
      
      if (parseInt(dataCheck.rows[0].count) > 0) {
        console.log(`Sensor data already exists for device ${deviceId}`);
        return;
      }
      
      // Generate 14 days of historical data (one reading every 3 hours)
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      // Define thresholds for the Common Lantana
      const thresholds = {
        moisture_min: 25,
        moisture_max: 60,
        light_min: 2000,
        light_max: 10000,
        temperature_min: 15,
        temperature_max: 32,
        humidity_min: 30,
        humidity_max: 70
      };
      
      // Store batch data for insertion
      const sensorData = [];
      
      // Generate readings for the last 14 days
      for (let day = 14; day >= 0; day--) {
        // Generate readings throughout the day (every 3 hours = 8 readings per day)
        for (let hour = 0; hour < 24; hour += 3) {
          const timestamp = new Date(now - (day * dayMs) + (hour * 60 * 60 * 1000));
          
          // Generate values with daily cycle variations
          const hourProgress = hour / 24; // 0-1 for time of day
          const dayFactor = Math.sin(hourProgress * Math.PI * 2); // Fluctuation throughout the day
          const randomFactor = Math.random() * 0.2 - 0.1; // ±10% random variation
          
          // Calculate values within appropriate ranges
          const moistureBase = day === 0 ? 35 : 65 - (day % 6) * 10; // Starts high after watering, decreases over days
          const moisture = Math.max(
            thresholds.moisture_min, 
            Math.min(thresholds.moisture_max, moistureBase + randomFactor * 10)
          );
          
          // Light varies with time of day
          let light;
          if (hour >= 7 && hour <= 18) {
            // Daytime light pattern with peak around noon
            const noonFactor = 1 - Math.abs((hour - 12.5) / 5.5);
            light = thresholds.light_min + (noonFactor * (thresholds.light_max - thresholds.light_min) * 0.8) +
              (Math.random() * 500 - 250);
          } else {
            // Nighttime - minimal light
            light = Math.max(0, thresholds.light_min * 0.1 + Math.random() * 100);
          }
          
          // Temperature with daily cycle
          const baseTemp = (thresholds.temperature_min + thresholds.temperature_max) / 2;
          const tempRange = (thresholds.temperature_max - thresholds.temperature_min) * 0.35;
          const temperature = baseTemp + (dayFactor * tempRange) + (randomFactor * 2);
          
          // Humidity with inverse relationship to temperature
          const baseHumidity = (thresholds.humidity_min + thresholds.humidity_max) / 2;
          const humidity = baseHumidity - (dayFactor * 10) + (randomFactor * 5);
          
          // Add sensor reading to batch
          sensorData.push({
            deviceId,
            timestamp: timestamp.toISOString(),
            soil_moisture: moisture,
            temperature,
            air_humidity: humidity,
            light_intensity: light
          });
        }
      }
      
      // Insert batch sensor data into database
      for (let i = 0; i < sensorData.length; i += 20) {
        const batch = sensorData.slice(i, i + 20);
        
        try {
          // Prepare bulk insert according to Sensors_Data schema
          const values = [];
          const placeholders = [];
          
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const offset = j * 5;
            
            values.push(
              item.deviceId,
              item.timestamp,
              item.soil_moisture,
              item.temperature,
              item.air_humidity
            );
            
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 13)`);
          }
          
          await this.dbPool.query(
            `INSERT INTO sensors_data (device_id, timestamp, soil_moisture, temperature, air_humidity, plant_id) 
             VALUES ${placeholders.join(', ')}`,
            values
          );
        } catch (error) {
          console.error('Error inserting batch sensor data:', error);
          // Continue with the next batch
        }
      }
      
      console.log(`Created sensor data for device ${deviceId} (${sensorData.length} readings)`);
      
      // Create some watering history
      await this.setupWateringHistory(plantId);
      
      // Store the latest reading for each sensor type
      this.sensorData[plantId] = {};
      
      // Group the latest readings by sensor type
      const sensorTypes = ['moisture', 'light', 'temperature', 'humidity'];
      for (const type of sensorTypes) {
        const typeData = sensorData
          .filter(d => d.sensor_type === type)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
        if (typeData.length > 0) {
          this.sensorData[plantId][type] = typeData;
        }
      }
      
      // Create some watering history
      await this.setupWateringHistory(plantId);
      
    } catch (error) {
      console.error('Error setting up initial sensor data:', error);
    }
  }
  
  /**
   * Set up watering history for the plant
   */
  async setupWateringHistory(plantId) {
    try {
      // Check if watering history already exists for this plant
      const historyCheck = await this.dbPool.query(
        'SELECT COUNT(*) FROM "watering_history" WHERE plant_id = $1',
        [plantId]
      );
      
      if (parseInt(historyCheck.rows[0].count) > 0) {
        console.log(`Watering history already exists for plant ${plantId}`);
        return;
      }
      
      // Get plant information
      const plant = this.plants.find(p => p.plant_id === plantId);
      if (!plant) return;
      
      // Get information about watering frequency
      const waterFrequency = plant.water_frequency || 5; // Default to 5 days if not specified
      
      // Generate watering history for the last 30 days
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const wateringEvents = [];
      
      // Generate history
      for (let day = 30; day > 0; day -= waterFrequency) {
        // Add some randomness to the watering days
        const actualDay = day + (Math.random() > 0.5 ? 1 : 0);
        if (actualDay <= 0) continue;
        
        const timestamp = new Date(now - (actualDay * dayMs) + (Math.random() * 12 * 60 * 60 * 1000));
        const triggerType = Math.random() > 0.3 ? 'automatic_threshold' : 'manual'; // 70% automatic, 30% manual
        
        const wateringEvent = {
          plant_id: plantId,
          timestamp: timestamp.toISOString(),
          trigger_type: triggerType,
          duration_seconds: 10 + Math.floor(Math.random() * 20) // 10-30 seconds
        };
        
        wateringEvents.push(wateringEvent);
      }
      
      // Add most recent watering - 2 days ago
      const recentTimestamp = new Date(now - (2 * dayMs) + (Math.random() * 12 * 60 * 60 * 1000));
      wateringEvents.push({
        plant_id: plantId,
        timestamp: recentTimestamp.toISOString(),
        trigger_type: 'manual',
        duration_seconds: 15
      });
      
      // Insert watering events into database
      for (const event of wateringEvents) {
        try {
          await this.dbPool.query(
            `INSERT INTO "watering_history" (
              plant_id, timestamp, trigger_type, duration_seconds
            ) VALUES ($1, $2, $3, $4)`,
            [
              event.plant_id, event.timestamp, event.trigger_type, event.duration_seconds
            ]
          );
        } catch (error) {
          console.error('Error inserting watering history:', error);
        }
      }
      
      console.log(`Created watering history entries for plant ${plantId}`);
    } catch (error) {
      console.error('Error setting up watering history:', error);
    }
  }
      

  
  /**
   * Set up watering schedules for the plant
   */
  async setupWateringSchedules() {
    try {
      // Check if we have any plants
      if (this.plants.length === 0) {
        console.log('No plants to create watering schedules for');
        return;
      }
      
      // Check if schedules already exist
      const schedulesCheck = await this.dbPool.query(
        'SELECT COUNT(*) FROM "pump_schedules" WHERE plant_id IN (SELECT plant_id FROM "plants" WHERE user_id = $1)',
        [this.mockUserId]
      );
      
      if (parseInt(schedulesCheck.rows[0].count) > 0) {
        console.log(`Watering schedules already exist for user ${this.mockUserId}`);
        return;
      }
      
      // For each plant, create a schedule
      for (const plant of this.plants) {
        // Create a watering schedule
        const scheduleData = {
          plant_id: plant.plant_id,
          cron_expression: '0 9 */5 * *', // At 9:00 AM, every 5 days
          is_active: true
        };
        
        try {
          await this.dbPool.query(
            `INSERT INTO "pump_schedules" (
              plant_id, cron_expression, is_active
            ) VALUES ($1, $2, $3)`,
            [
              scheduleData.plant_id, scheduleData.cron_expression, scheduleData.is_active
            ]
          );
          
          this.schedules.push(scheduleData);
        } catch (error) {
          console.error('Error inserting watering schedule:', error);
        }
      }
      
      console.log(`Created ${this.schedules.length} watering schedules for user ${this.mockUserId}`);
    } catch (error) {
      console.error('Error setting up watering schedules:', error);
    }
  }
  
  /**
   * Start the data simulation
   */
  startSimulation() {
    // Generate new data more frequently for development (every 1 minute)
    this.simulationInterval = setInterval(() => {
      if (this.isInitialized) {
        this.generateNewData();
      }
    }, 60 * 1000); // 1 minute
    
    // Generate initial data immediately
    if (this.isInitialized) {
      this.generateNewData();
    }
    
    console.log('Dynamic plant data simulation started for user ID:', this.mockUserId);
  }
  
  /**
   * Generate new sensor data
   */
  async generateNewData() {
    try {
      // Import enhanced device mock and health calculator
      const EnhancedDeviceMock = require('./enhancedDeviceMock');
      const { calculatePlantHealth, getPlantStatus } = require('./plantHealthCalculator');
      
      // For each plant, generate new sensor readings
      for (const plant of this.plants) {
        const plantId = plant.plant_id;
        
        // Default thresholds for Common Lantana if not available from plant object
        const defaultThresholds = {
          moisture_min: 25,
          moisture_max: 60,
          light_min: 2000,
          light_max: 10000,
          temperature_min: 15,
          temperature_max: 32,
          humidity_min: 30,
          humidity_max: 70
        };
        
        // Get plant thresholds, using defaults if missing
        let thresholds;
        if (plant.thresholds) {
          thresholds = typeof plant.thresholds === 'string' 
            ? JSON.parse(plant.thresholds) 
            : plant.thresholds;
        } else {
          thresholds = defaultThresholds;
        }
        
        // Get device IDs for sensors
        const moistureSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'moisture');
        const lightSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'light');
        const tempSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'temperature');
        const humiditySensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'humidity');
        
        // Get the latest readings from database
        const latestReadings = {};
        
        // Generate new readings based on time of day
        const now = new Date();
        const timestamp = now.toISOString();
        const hourOfDay = now.getHours();
        const minuteOfHour = now.getMinutes();
        
        // Daily and hourly patterns
        const hourProgress = (hourOfDay + minuteOfHour / 60) / 24; // 0-1 for time of day
        const dayFactor = Math.sin(hourProgress * Math.PI * 2); // -1 to 1 cyclical throughout the day
        const randomFactor = Math.random() * 0.2 - 0.1; // ±10% random variation
        
        // Get last watering time
        let daysSinceWatering = 2; // Default to 2 days ago
        try {
          const wateringResult = await this.dbPool.query(
            'SELECT timestamp FROM "watering_history" WHERE plant_id = $1 ORDER BY timestamp DESC LIMIT 1',
            [plantId]
          );
          
          if (wateringResult.rows.length > 0) {
            const lastWatered = new Date(wateringResult.rows[0].timestamp);
            daysSinceWatering = (now.getTime() - lastWatered.getTime()) / (24 * 60 * 60 * 1000);
          }
        } catch (error) {
          console.error('Error getting last watering time:', error);
        }
        
        // Generate device data using the enhanced device mock
        // Convert the thresholds format to match our expected format
        const deviceThresholds = {
          soil: thresholds.moisture_min,
          light: thresholds.light_max,
          tempMin: thresholds.temperature_min,
          tempMax: thresholds.temperature_max,
          humidityMax: thresholds.humidity_max
        };
        
        // Calculate soil moisture based on days since watering
        const moistureDecay = daysSinceWatering * 8; // ~8% decrease per day
        const moistureValue = Math.max(
          thresholds.moisture_min,
          Math.min(
            thresholds.moisture_max,
            thresholds.moisture_max - moistureDecay + (randomFactor * 5)
          )
        );
        
        // Generate the mock data using our enhanced device mock
        const deviceId = plant.device_id || 3; // Use plant's device ID or default to 3
        const mockDeviceData = EnhancedDeviceMock.generateMockData(deviceId, {
          soil_moisture: moistureValue,
          thresholds: deviceThresholds,
          // Let the other values be generated automatically based on time of day
        });
        
        // Log the generated mock device data in the format that matches real devices
        console.log('Generated mock device data:', JSON.stringify(mockDeviceData));
        
        // Extract the values for database insertion
        const moisture = mockDeviceData.soil_moisture;
        const light = mockDeviceData.light_intensity;
        const temperature = mockDeviceData.temperature;
        const humidity = mockDeviceData.air_humidity;
        const pumpStatus = mockDeviceData.pump;
        
        // Insert new readings into database
        const sensorData = [];
        
        // Insert moisture reading
        if (moistureSensor) {
          try {
            const result = await this.dbPool.query(
              'INSERT INTO sensors_data (plant_id, device_id, sensor_type, value, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [plantId, moistureSensor.device_id, 'moisture', moisture, timestamp]
            );
            sensorData.push(result.rows[0]);
          } catch (error) {
            console.error('Error inserting moisture data:', error);
          }
        }
        
        // Insert light reading
        if (lightSensor) {
          try {
            const result = await this.dbPool.query(
              'INSERT INTO sensors_data (plant_id, device_id, sensor_type, value, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [plantId, lightSensor.device_id, 'light', light, timestamp]
            );
            sensorData.push(result.rows[0]);
          } catch (error) {
            console.error('Error inserting light data:', error);
          }
        }
        
        // Insert temperature reading
        if (tempSensor) {
          try {
            const result = await this.dbPool.query(
              'INSERT INTO sensors_data (plant_id, device_id, sensor_type, value, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [plantId, tempSensor.device_id, 'temperature', temperature, timestamp]
            );
            sensorData.push(result.rows[0]);
          } catch (error) {
            console.error('Error inserting temperature data:', error);
          }
        }
        
        // Insert humidity reading
        if (humiditySensor) {
          try {
            const result = await this.dbPool.query(
              'INSERT INTO sensors_data (plant_id, device_id, sensor_type, value, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [plantId, humiditySensor.device_id, 'humidity', humidity, timestamp]
            );
            sensorData.push(result.rows[0]);
          } catch (error) {
            console.error('Error inserting humidity data:', error);
          }
        }
        
        // Update local cache
        if (!this.sensorData[plantId]) {
          this.sensorData[plantId] = {};
        }
        
        // Group by sensor type
        for (const data of sensorData) {
          if (!this.sensorData[plantId][data.sensor_type]) {
            this.sensorData[plantId][data.sensor_type] = [];
          }
          
          this.sensorData[plantId][data.sensor_type].push(data);
          
          // Keep the history at a reasonable size
          if (this.sensorData[plantId][data.sensor_type].length > 336) { // 14 days * 24 hours
            this.sensorData[plantId][data.sensor_type].shift();
          }
        }
        
        // Ensure thresholds exist to prevent TypeError
        const safeThresholds = thresholds || {
          moisture_min: 25,
          moisture_max: 60,
          light_min: 2000,
          light_max: 10000,
          temperature_min: 15,
          temperature_max: 32,
          humidity_min: 30,
          humidity_max: 70
        };
        
        // Check if plant needs watering based on moisture
        if (moisture <= safeThresholds.moisture_min + 5) {
          // Find active watering schedule for automatic watering
          const activeSchedule = this.schedules.find(
            s => s.plant_id === plantId && s.status === 'active'
          );
          
          // Only water automatically during daytime with 50% chance
          if (activeSchedule && hourOfDay >= 7 && hourOfDay <= 19 && Math.random() > 0.5) {
            // Trigger automatic watering
            await this.triggerWatering(plantId, {
              user_id: this.mockUserId,
              device_id: activeSchedule.device_id,
              amount_ml: activeSchedule.amount_ml,
              duration_seconds: activeSchedule.duration_seconds,
              source: 'automatic'
            });
          }
        }
        
        // Calculate plant health using the enhanced device data and health calculator
        try {
          // Get past health for trend calculation
          let pastHealth = plant.health || 80; // Default to 80 if not set
          
          // Calculate new health score based on sensor readings
          const healthResult = calculatePlantHealth(mockDeviceData, {
            pastHealth: pastHealth
          });
          
          // Get status based on health score
          const status = getPlantStatus(healthResult.health);
          
          // Update plant health and sensor metrics in database
          await this.dbPool.query(
            'UPDATE "health_history" SET health_score = $1, status = $2, timestamp = $3, temperature_factor = $4, moisture_factor = $5, light_factor = $6, humidity_factor = $7 WHERE plant_id = $8',
            [
              healthResult.health, 
              status, 
              timestamp,
              mockDeviceData.temperature,
              mockDeviceData.soil_moisture,
              mockDeviceData.light_intensity,
              mockDeviceData.air_humidity,
              plantId
            ]
          );
          
          // Update plant in memory
          plant.health = healthResult.health;
          plant.status = status;
          plant.last_reading = timestamp;
          plant.last_temperature = mockDeviceData.temperature;
          plant.last_soil_moisture = mockDeviceData.soil_moisture;
          plant.last_light_level = mockDeviceData.light_intensity;
          plant.last_humidity = mockDeviceData.air_humidity;
          
          console.log(`Plant ${plantId} health updated: ${healthResult.health}% (${status})`);
          console.log('Health factors:', healthResult.factors);
          
          // Store detailed health factors in health_history table if it exists
          try {
            await this.dbPool.query(
              `INSERT INTO health_history 
              (plant_id, timestamp, health_score, moisture_factor, temperature_factor, 
               humidity_factor, light_factor) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                plantId, 
                timestamp, 
                healthResult.health, 
                healthResult.factors.moisture,
                healthResult.factors.temperature,
                healthResult.factors.humidity,
                healthResult.factors.light
              ]
            );
          } catch (error) {
            // Table might not exist yet, which is fine
            console.log('Health history table not available, skipping detailed record');
          }
        } catch (error) {
          console.error('Error updating plant health:', error);
        }
      }
    } catch (error) {
      console.error('Error generating new data:', error);
    }
  }
  
  /**
   * Trigger a watering event for a plant
   */
  async triggerWatering(plantId, options = {}) {
    try {
      const {
        user_id = this.mockUserId,
        device_id = null,
        amount_ml = 200,
        duration_seconds = 15,
        source = 'manual',
        status = 'completed'
      } = options;
      
      // Create watering event
      const timestamp = new Date().toISOString();
      
      // Find the pump device if not specified
      let deviceId = device_id;
      if (!deviceId) {
        const pumpDevice = this.devices.find(d => d.device_type === 'actuator' && d.actuator_type === 'pump');
        if (pumpDevice) {
          deviceId = pumpDevice.device_id;
        }
      }
      
      // Insert watering event into database
      let wateringEvent;
      try {
        const result = await this.dbPool.query(
          `INSERT INTO "watering_history" (
            plant_id, timestamp, trigger_type, duration_seconds
          ) VALUES ($1, $2, $3, $4) RETURNING *`,
          [plantId, timestamp, source === 'automatic' ? 'automatic_threshold' : 'manual', duration_seconds]
        );
        
        wateringEvent = result.rows[0];
      } catch (error) {
        console.error('Error inserting watering event:', error);
        // Create in-memory event as fallback
        wateringEvent = {
          history_id: this.wateringHistory.length + 1,
          plant_id: plantId,
          timestamp,
          trigger_type: source === 'automatic' ? 'automatic_threshold' : 'manual',
          duration_seconds
        };
      }
      
      // Add to local history
      this.wateringHistory.push(wateringEvent);
      
      // Update plant's last watered time
      try {
        await this.dbPool.query(
          'UPDATE "plants" SET last_watered = $1 WHERE plant_id = $2',
          [timestamp, plantId]
        );
        
        // Update local plant data
        const plant = this.plants.find(p => p.plant_id === plantId);
        if (plant) {
          plant.last_watered = timestamp;
        }
      } catch (error) {
        console.error('Error updating plant last watered time:', error);
      }
      
      // Update moisture level immediately
      const moistureSensor = this.devices.find(d => d.device_type === 'sensor' && d.sensor_type === 'moisture');
      if (moistureSensor) {
        // Get plant thresholds
        const plant = this.plants.find(p => p.plant_id === plantId);
        if (plant) {
          // Default thresholds for Common Lantana if not available
          const defaultThresholds = {
            moisture_min: 25,
            moisture_max: 60,
            light_min: 2000,
            light_max: 10000,
            temperature_min: 15,
            temperature_max: 32,
            humidity_min: 30,
            humidity_max: 70
          };
          
          // Get thresholds from plant or use defaults
          let thresholds;
          if (plant.thresholds) {
            thresholds = typeof plant.thresholds === 'string' 
              ? JSON.parse(plant.thresholds) 
              : plant.thresholds;
          } else {
            thresholds = defaultThresholds;
          }
          
          // Set moisture to near maximum after watering
          const newMoisture = thresholds.moisture_max - (Math.random() * 5);
          
          try {
            // Get current sensor data
            const currentData = await this.dbPool.query(
              'SELECT * FROM "Sensors_Data" WHERE plant_id = $1 ORDER BY timestamp DESC LIMIT 1',
              [plantId]
            );
            
            let sensorData = {
              temperature: 22, // Default values
              air_humidity: 50,
              soil_moisture: newMoisture,
              light_intensity: 800
            };
            
            // Use existing data if available
            if (currentData.rows.length > 0) {
              sensorData = {
                temperature: currentData.rows[0].temperature,
                air_humidity: currentData.rows[0].air_humidity,
                soil_moisture: newMoisture, // Update with new moisture
                light_intensity: currentData.rows[0].light_intensity
              };
            }
            
            await this.dbPool.query(
              `INSERT INTO "Sensors_Data" (
                plant_id, device_id, timestamp, temperature, soil_moisture, air_humidity, light_intensity
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                plantId, 
                moistureSensor.device_id, 
                timestamp, 
                sensorData.temperature,
                sensorData.soil_moisture,
                sensorData.air_humidity,
                sensorData.light_intensity
              ]
            );
          } catch (error) {
            console.error('Error updating moisture after watering:', error);
          }
        }
      }
      
      return wateringEvent;
    } catch (error) {
      console.error('Error triggering watering:', error);
      throw error;
    }
  }
  
  /**
   * Get plants by user ID
   */
  async getplantsByUserId(userId) {
    try {
      // Default to mockUserId if none provided
      const targetUserId = userId || this.mockUserId;
      
      if (!this.isInitialized) {
        console.log('Mock service not yet initialized, using in-memory data');
        return this.plants.filter(p => p.user_id === targetUserId);
      }
      
      const result = await this.dbPool.query(
        'SELECT * FROM "plants" WHERE user_id = $1',
        [targetUserId]
      );
      
      // If no plants found in database but we have in-memory plants, use those
      if (result.rows.length === 0 && this.plants.length > 0) {
        return this.plants.filter(p => p.user_id === targetUserId);
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error getting plants by user ID:', error);
      // Fall back to in-memory plants
      return this.plants.filter(p => p.user_id === targetUserId || this.mockUserId);
    }
  }
  
  /**
   * Get sensor data for plants
   */
  async getSensorDataByPlantIds(plantIds) {
    try {
      if (!this.isInitialized) {
        console.log('Mock service not yet initialized');
        return {};
      }
      
      const result = {};
      
      for (const plantId of plantIds) {
        // Get latest readings for each plant
        const latestData = await this.dbPool.query(
          `SELECT * FROM "Sensors_Data" 
           WHERE plant_id = $1 
           ORDER BY timestamp DESC 
           LIMIT 1`,
          [plantId]
        );
        
        // Get historical data (last 24 hours)
        const historyData = await this.dbPool.query(
          `SELECT * FROM "Sensors_Data" 
           WHERE plant_id = $1 AND timestamp > NOW() - INTERVAL '24 hours'
           ORDER BY timestamp ASC`,
          [plantId]
        );
        
        if (latestData.rows.length > 0) {
          const latestRow = latestData.rows[0];
          result[plantId] = {
            current: {
              temperature: {
                value: latestRow.temperature,
                timestamp: latestRow.timestamp
              },
              soil_moisture: {
                value: latestRow.soil_moisture,
                timestamp: latestRow.timestamp
              },
              light: {
                value: latestRow.light_intensity,
                timestamp: latestRow.timestamp
              },
              air_humidity: {
                value: latestRow.air_humidity,
                timestamp: latestRow.timestamp
              }
            },
            history: historyData.rows.map(row => ({
              timestamp: row.timestamp,
              temperature: row.temperature,
              soil_moisture: row.soil_moisture,
              light_intensity: row.light_intensity,
              air_humidity: row.air_humidity
            }))
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting sensor data by plant IDs:', error);
      
      // Fallback to in-memory data
      const result = {};
      for (const plantId of plantIds) {
        if (this.sensorData[plantId]) {
          // Format the in-memory data to match DB format
          const current = {};
          const history = [];
          
          // Map the in-memory data format to match the database structure
          if (this.sensorData[plantId].temperature) {
            const latestTemp = this.sensorData[plantId].temperature[this.sensorData[plantId].temperature.length - 1];
            current.temperature = {
              value: latestTemp.value,
              timestamp: latestTemp.timestamp
            };
          }
          
          if (this.sensorData[plantId].soil_moisture) {
            const latestMoisture = this.sensorData[plantId].soil_moisture[this.sensorData[plantId].soil_moisture.length - 1];
            current.soil_moisture = {
              value: latestMoisture.value,
              timestamp: latestMoisture.timestamp
            };
          }
          
          if (this.sensorData[plantId].light) {
            const latestLight = this.sensorData[plantId].light[this.sensorData[plantId].light.length - 1];
            current.light = {
              value: latestLight.value,
              timestamp: latestLight.timestamp
            };
          }
          
          if (this.sensorData[plantId].air_humidity) {
            const latestHumidity = this.sensorData[plantId].air_humidity[this.sensorData[plantId].air_humidity.length - 1];
            current.air_humidity = {
              value: latestHumidity.value,
              timestamp: latestHumidity.timestamp
            };
          }
          
          // Create merged historical data
          const timestamps = {};
          
          for (const type in this.sensorData[plantId]) {
            for (const reading of this.sensorData[plantId][type]) {
              const ts = reading.timestamp;
              if (!timestamps[ts]) {
                timestamps[ts] = { timestamp: ts };
              }
              timestamps[ts][type] = reading.value;
            }
          }
          
          history.push(...Object.values(timestamps));
          
          result[plantId] = { current, history };
        }
      }
      
      return result;
    }
  }
  
  /**
   * Get watering schedules for a user
   */
  async getWateringSchedules(userId) {
    try {
      if (!this.isInitialized) {
        console.log('Mock service not yet initialized');
        return [];
      }
      
      const result = await this.dbPool.query(
        `SELECT ps.* FROM "pump_schedules" ps
         JOIN "plants" p ON ps.plant_id = p.plant_id
         WHERE p.user_id = $1`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting watering schedules:', error);
      return this.schedules.filter(s => {
        // Find the plant to check its user_id
        const plant = this.plants.find(p => p.plant_id === s.plant_id);
        return plant && plant.user_id === userId;
      });
    }
  }
  
  /**
   * Clean up resources before shutdown
   */
  async shutdown() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    if (this.dbPool && typeof this.dbPool.end === 'function') {
      try {
        await this.dbPool.end();
      } catch (error) {
        console.error('Error closing database pool:', error);
      }
    }
  }
}

// Create a singleton instance
const dynamicMock = new DynamicPlantMockService();

// Export the mock service
module.exports = dynamicMock;
     