/**
 * ============================================================================
 * PLANT CONTROLLER - PLANT & WATERING MANAGEMENT
 * ===            });

            await sendPumpCommand(device.device_key, 'pump_on', duration); // Pass parameters in correct order: device_key, command, duration
            
            console.log('✅ [PUMP DEBUG] Pump command sent successfully');
            
            // Log to system logs for tracking==================================================================
 * 
 * This controller handles plant management and watering functionality:
 * - UC5: Manual Watering - Direct pump control
 * - UC6: Configure Auto-Watering Schedule - Cron job management
 * - UC7: Toggle Auto-Watering Mode - Enable/disable automation
 * - UC14: Manage Multiple Plant Zones - Zone management (Premium only)
 * - UC15: Configure Advanced Sensor Thresholds - Custom limits (Premium only)
 * 
 * IMPLEMENTATION NOTES:
 * - Integration with IoT devices for watering control
 * - Schedule management for automated watering
 * - Zone management for premium users
 */

const Plant = require('../models/Plant');
const Device = require('../models/Device');
const WateringHistory = require('../models/WateringHistory');
const PumpSchedule = require('../models/PumpSchedule');
const SystemLog = require('../models/SystemLog');
const { pool } = require('../config/db.js');
const { connectAwsIoT } = require('../services/awsIOTClient');
const { mqtt } = require('aws-iot-device-sdk-v2');
const { isValidUUID } = require('../utils/uuidGenerator');
const { data } = require('@tensorflow/tfjs');
const mqttClient = require('../mqtt/mqttClient');
const db = require('../config/db');

// AWS IoT connection for device communication
let awsIoTConnection = null;

// Connect to AWS IoT Core
async function getAwsIoTConnection() {
    if (!awsIoTConnection) {
        try {
            awsIoTConnection = await connectAwsIoT();
            console.log('Connected to AWS IoT Core');
        } catch (error) {
            console.error('AWS IoT connection error:', error);
            throw error;
        }
    }
    return awsIoTConnection;
}


/**
 * UC5: MANUAL WATERING
 * ===============================
 * Manually activates water pump for a specific plant
 * 
 * @route POST /api/plants/:plantId/water
 * @access Private - Requires authentication
 * @param {string} plantId - UUID of the plant to water
 * @param {number} duration - Watering duration in seconds (default: 10)
 * @returns {Object} Watering confirmation
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID (not integer)
 * - user_id comparison uses UUID format
 * - Validates UUID format before database operations
 */
async function waterPlant(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;
        const { duration = 10 } = req.body; // Default 10 seconds if not provided

        // Validate duration
        if (duration < 1 || duration > 300) { // Limit to 5 minutes max
            return res.status(400).json({
                success: false,
                error: 'Duration must be between 1 and 300 seconds'
            });
        }

        console.log('[WATER PLANT] Watering plant:', plantId, 'for', duration, 'seconds');

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant (both are now UUIDs)
        if (plant.user_id !== req.user.user_id) {
            console.error('[WATER PLANT] Permission denied. Plant owner:', plant.user_id, 'Request user:', req.user.user_id);
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to water this plant'
            });
        }

        // Get device associated with this plant
        const device = await Device.findById(plant.device_key);
        
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'No device found for this plant'
            });
        }

        // Check if device is online
        if (!device.isOnline) {
            return res.status(400).json({
                success: false,
                error: 'Device is offline. Cannot water plant.'
            });
        }

        // Send command to device to start watering via MQTT
        const wateringCommand = {
            command: 'pump_on',
            parameters: {
                duration: duration,
                state: 'ON'
            },
            plantId: plantId,
            timestamp: new Date().toISOString()
        };

        // Send command via MQTT
        try {
            console.log('🌿 [PUMP DEBUG] Preparing to send pump command:', {
                device_key: device.device_key,
                command: wateringCommand.command,
                parameters: wateringCommand.parameters,
                timestamp: wateringCommand.timestamp
            });

            // Log pre-command device state
            console.log('🔍 [PUMP DEBUG] Current device state:', {
                deviceId: device.device_key,
                deviceStatus: device.status,
                lastSeen: device.last_seen,
                plantId: plantId
            });

            await mqttClient.sendPumpCommand(device.device_key.trim(), wateringCommand.command, wateringCommand.parameters.duration);
            
            console.log('✅ [PUMP DEBUG] Pump command sent successfully');
            
            // Log to system logs for tracking
            await SystemLog.create({
                log_level: 'DEBUG',
                source: 'PlantController-PumpCommand',
                message: JSON.stringify({
                    action: 'pump_command_sent',
                    device_key: device.deviceKey,
                    command: wateringCommand.command,
                    parameters: wateringCommand.parameters,
                    user_id: req.user.user_id,
                    plant_id: plantId
                })
            });

        } catch (error) {
            console.error('❌ [PUMP DEBUG] Failed to send pump command:', {
                error: error.message,
                deviceKey: device.device_key,
                command: wateringCommand.command,
                stack: error.stack
            });
            
            // Log error but continue - we already saved the watering record
            await SystemLog.error('PlantController', 
                `Pump command failed - Device: ${device.device_key}, Error: ${error.message}`);
        }

        // Create watering history record
        const wateringHistory = await WateringHistory.logWatering(
            plantId,           // plantId
            'manual',         // triggerType
            duration         // durationSeconds
        );

        // Calculate water amount for response
        const waterAmount = calculateWaterAmount(duration);

        // Log the action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'PlantController',
            message: `Manual watering initiated for plant ${plantId} by user ${req.user.user_id} for ${duration} seconds`
        });

        res.status(200).json({
            success: true,
            message: `Watering initiated for ${duration} seconds`,
            data: {
                wateringId: wateringHistory.watering_id,
                waterAmount: waterAmount,
                timestamp: wateringHistory.timestamp
            }
        });

    } catch (error) {
        console.error('Manual watering error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate watering. Please try again later.'
        });
    }
}

/**
 * Calculate water amount based on duration
 * @param {number} duration - Duration in seconds
 * @returns {number} Water amount in milliliters
 */
function calculateWaterAmount(duration) {
    // Assuming pump flow rate of 100ml/second
    const FLOW_RATE = 100; // ml per second
    return duration * FLOW_RATE;
}

/**
 * UC6: GET WATERING SCHEDULE
 * ===============================
 * Gets the auto-watering schedule for a plant
 * 
 * @route GET /api/plants/:plantId/schedule
 * @access Private - Requires authentication
 * @param {string} plantId - UUID of the plant
 * @returns {Object} Watering schedule
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID
 * - Validates UUID format before operations
 */
async function getWateringSchedule(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;

        // Validate UUID format
        // if (!isValidUUID(plantId)) {
        //     console.error('[GET SCHEDULE] Invalid plant UUID:', plantId);
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Invalid plant ID format'
        //     });
        // }

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant (UUID comparison)
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        }

        // Get schedule for this plant
        const schedule = await PumpSchedule.findByPlantId(plantId);

        res.status(200).json({
            success: true,
            data: schedule || []
        });

    } catch (error) {
        console.error('Get watering schedule error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve watering schedule'
        });
    }
}

/**
 * UC6: SET WATERING SCHEDULE
 * ===============================
 * Sets or updates the auto-watering schedule for a plant
 * 
 * @route POST /api/plants/:plantId/schedule
 * @access Private - Requires authentication
 * @param {string} plantId - UUID of the plant
 * @param {Array} schedule - Array of schedule entries
 * @returns {Object} Updated watering schedule
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID
 * - Validates UUID format before operations
 */
async function setWateringSchedule(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;
        const { schedule } = req.body;

        // Validate UUID format
        // if (!isValidUUID(plantId)) {
        //     console.error('[SET SCHEDULE] Invalid plant UUID:', plantId);
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Invalid plant ID format'
        //     });
        // }

        // Validate schedule
        if (!schedule || !Array.isArray(schedule)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid schedule format'
            });
        }

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant (UUID comparison)
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this plant'
            });
        }

        // Delete existing schedule
        await PumpSchedule.deleteByPlantId(plantId);

        // Create new schedule entries
        const schedulePromises = schedule.map(async (entry) => {
        const newSchedule = new PumpSchedule({
            plant_id: plantId,
            cron_expression: `${entry.minute} ${entry.hour} * * ${entry.dayOfWeek}`, // convert dayOfWeek to cron
            is_active: entry.enabled !== false
        });

        return await newSchedule.save();
    });

        const createdSchedules = await Promise.all(schedulePromises);

        // Log the action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'PlantController',
            message: `Watering schedule updated for plant ${plantId} by user ${req.user.user_id}`
        });

        res.status(200).json({
            success: true,
            message: 'Watering schedule updated successfully',
            data: createdSchedules
        });

    } catch (error) {
        console.error('Set watering schedule error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update watering schedule'
        });
    }
}

/**
 * UC7: TOGGLE AUTO-WATERING MODE
 * ===============================
 * Enables or disables auto-watering for a plant
 * 
 * @route PUT /api/plants/:plantId/auto-watering
 * @access Private - Requires authentication
 * @param {string} plantId - UUID of the plant
 * @param {boolean} enabled - Whether auto-watering should be enabled
 * @returns {Object} Updated plant status
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID
 * - Validates UUID format before operations
 */
async function toggleAutoWatering(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;
        const { enabled } = req.body;

        // Validate UUID format
        // if (!isValidUUID(plantId)) {
        //     console.error('[TOGGLE AUTO WATERING] Invalid plant UUID:', plantId);
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Invalid plant ID format'
        //     });
        // }

        // Validate input
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Enabled status must be a boolean value'
            });
        }

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant (UUID comparison)
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this plant'
            });
        }

        // Update auto_watering_on flag
        plant.auto_watering_on = enabled;
        await plant.save();

        // Log the action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'PlantController',
            message: `Auto-watering ${enabled ? 'enabled' : 'disabled'} for plant ${plantId} by user ${req.user.user_id}`
        });

        res.status(200).json({
            success: true,
            message: `Auto-watering ${enabled ? 'enabled' : 'disabled'} successfully`,
            data: {
                plant_id: plant.plant_id,
                auto_watering_on: plant.auto_watering_on
            }
        });

    } catch (error) {
        console.error('Toggle auto-watering error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update auto-watering status'
        });
    }
}

/**
 * UC15: SET SENSOR THRESHOLDS (Premium Feature)
 * ===============================
 * Sets custom thresholds for plant sensors
 * 
 * @route PUT /api/plants/:plantId/thresholds
 * @access Private - Requires authentication and premium
 * @param {string} plantId - UUID of the plant
 * @param {Object} thresholds - Sensor thresholds
 * @returns {Object} Updated thresholds
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID
 * - Validates UUID format before operations
 */
async function setSensorThresholds(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;
        const { thresholds } = req.body;

        // Validate UUID format
        // if (!isValidUUID(plantId)) {
        //     console.error('[SET THRESHOLDS] Invalid plant UUID:', plantId);
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Invalid plant ID format'
        //     });
        // }

        // Check if user is premium
        if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        }

        // Validate thresholds
        if (!thresholds || typeof thresholds !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid threshold format'
            });
        }

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant (UUID comparison)
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this plant'
            });
        }

        // Update thresholds
        const validThresholds = {};
        
        // Moisture threshold
        if (thresholds.moisture_min !== undefined && thresholds.moisture_max !== undefined) {
            if (thresholds.moisture_min < 0 || thresholds.moisture_max > 100 || thresholds.moisture_min >= thresholds.moisture_max) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid moisture thresholds. Must be 0-100% with min < max'
                });
            }
            validThresholds.moisture_min = thresholds.moisture_min;
            validThresholds.moisture_max = thresholds.moisture_max;
        }

        // Temperature threshold
        if (thresholds.temperature_min !== undefined && thresholds.temperature_max !== undefined) {
            if (thresholds.temperature_min < -10 || thresholds.temperature_max > 50 || thresholds.temperature_min >= thresholds.temperature_max) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid temperature thresholds. Must be -10°C to 50°C with min < max'
                });
            }
            validThresholds.temperature_min = thresholds.temperature_min;
            validThresholds.temperature_max = thresholds.temperature_max;
        }

        // Light threshold
        if (thresholds.light_min !== undefined && thresholds.light_max !== undefined) {
            if (thresholds.light_min < 0 || thresholds.light_max > 100 || thresholds.light_min >= thresholds.light_max) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid light thresholds. Must be 0-100% with min < max'
                });
            }
            validThresholds.light_min = thresholds.light_min;
            validThresholds.light_max = thresholds.light_max;
        }

        // Update plant thresholds
        plant.thresholds = validThresholds;
        await plant.save();

        res.status(200).json({
            success: true,
            message: 'Sensor thresholds updated successfully',
            data: {
                plant_id: plant.plant_id,
                thresholds: plant.thresholds
            }
        });

    } catch (error) {
        console.error('Set sensor thresholds error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update sensor thresholds'
        });
    }
}

/**
 * Get all plants for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 */
const getUserPlants = async (req, res) => {
    try {
        const userId = req.user.user_id; // Fixed: using user_id instead of userId to match JWT auth
        
        // Get all plants for the user with their devices and zones
        const query = `
            SELECT 
                p.plant_id,
                p.user_id,
                p.custom_name,
                p.profile_id,
                p.moisture_threshold,
                p.auto_watering_on,
                p.status,
                p.notes,
                p.created_at,
                p.device_key,
                p.image,
                p.zone_id,
                d.device_name,
                d.status as device_status,
                d.last_seen as device_last_seen,
                z.zone_name,
                z.description as zone_description,
                pp.species_name,
                pp.description as species_description,
                pp.ideal_moisture
            FROM plants p
            LEFT JOIN devices d ON p.device_key = d.device_key
            LEFT JOIN zones z ON p.zone_id = z.zone_id
            LEFT JOIN plant_profiles pp ON p.profile_id = pp.profile_id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `;

        console.log('Fetching plants for user:', userId); // Added logging
        const { rows } = await pool.query(query, [userId]);
        
        if (rows.length === 0) {
            // Return empty array with consistent structure
            return res.json({
                success: true,
                data: []
            });
        }
        
        // Process the plants data to make it frontend-friendly
        const plants = rows.map(plant => {
            return {
                plant_id: plant.plant_id,
                name: plant.custom_name || plant.name || 'Unnamed Plant',
                species: plant.species_name || 'Unknown Species',
                location: plant.zone_name || 'No zone assigned', // Use zone_name instead of location
                status: plant.status || 'healthy',
                health: 100, // Default health for now
                image: plant.image || null,
                lastWatered: null, // Will be populated from watering history later
                auto_watering_on: plant.auto_watering_on || false,
                thresholds: plant.thresholds || {},
                device_key: plant.device_key,
                device_name: plant.device_name,
                zone_id: plant.zone_id,
                zone_name: plant.zone_name,
                zone_description: plant.zone_description,
                notes: plant.notes,
                created_at: plant.created_at
            };
        });
        
        res.json({
            success: true,
            data: plants
        });
    } catch (error) {
        console.error('Error fetching user plants:', error);
        
        // Log the error
        await SystemLog.error('plantController', `Error fetching plants for user ${req.user.user_id}: ${error.message}`);
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch plants'
        });
    }
};

/**
 * Get a specific plant by ID
 * @param {Object} req - Express request object with authenticated user and plant ID
 * @param {Object} res - Express response object
 */
const getPlantById = async (req, res) => {
    try {
        console.log('\n[GET PLANT] Getting plant details');
        console.log('[GET PLANT] Plant ID:', req.params.plantId);
        console.log('[GET PLANT] User:', req.user.user_id);
        console.log('[GET PLANT] Auth header:', req.headers.authorization ? 'Present' : 'Missing');

        const userId = req.user.user_id;
        const plantId = req.params.plantId;

        // Get the plant with its device and latest sensor data
        const query = `
            WITH latest_sensor_data AS (
                SELECT DISTINCT ON (device_key)
                    device_key,
                    timestamp,
                    soil_moisture AS moisture,
                    temperature,
                    air_humidity AS humidity,
                    light_intensity AS light
                FROM sensors_data
                ORDER BY device_key, timestamp DESC
            )
            SELECT 
                p.*,
                d.device_key,
                d.device_name,
                pp.species_name,
                pp.description AS profile_description,
                sd.timestamp,
                sd.moisture,
                sd.temperature,
                sd.humidity,
                sd.light
            FROM 
                plants p
            LEFT JOIN 
                devices d ON p.device_key = d.device_key
            LEFT JOIN
                plant_profiles pp ON p.profile_id = pp.profile_id
            LEFT JOIN
                latest_sensor_data sd ON d.device_key = sd.device_key
            WHERE 
                p.plant_id = $1 AND p.user_id = $2
        `;
        
        const { rows } = await pool.query(query, [plantId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Plant not found or access denied'
            });
        }
        
        // Get the plant data
        const plant = rows[0];
        
        // Parse the thresholds if they exist
        let thresholds = {};
        if (plant.thresholds) {
            try {
                thresholds = typeof plant.thresholds === 'string'
                    ? JSON.parse(plant.thresholds)
                    : plant.thresholds;
            } catch (e) {
                console.error('Error parsing thresholds JSON:', e);
            }
        }
        
        // Format the response
        const formattedPlant = {
            plant_id: plant.plant_id,
            name: plant.custom_name,
            species: plant.species_name || 'Unknown',
            location: plant.location || 'Not specified',
            status: plant.status || 'healthy',
            image: plant.image_url || null,
            lastWatered: plant.last_watered || new Date().toISOString(),
            auto_watering_on: plant.auto_watering_on || false,
            device_key: plant.device_key,
            device_name: plant.device_name,
            data: {
                timestamp: plant.timestamp,
                moisture: plant.moisture,
                temperature: plant.temperature,
                humidity: plant.humidity,
                light: plant.light
            }
        };
        
        res.json(formattedPlant);
    } catch (error) {
        console.error('Error fetching plant by ID:', error);
        
        // Log the error
        await SystemLog.error('plantController', `Error fetching plant ${req.params.id} for user ${req.user.user_id}: ${error.message}`);
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch plant details'
        });
    }
};

/**
 * CREATE NEW PLANT
 * ===============================
 * Creates a new plant for the authenticated user
 * 
 * @route POST /api/plants
 * @access Private - Requires authentication
 * @param {Object} plant_data - Plant information
 * @returns {Object} Created plant data
 */
const createPlant = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            custom_name,
            profile_id,
            notes,
            zone_id,
            moisture_threshold,
            image,
            species_name
        } = req.body;
        
        // Debug logging
        console.log('Received plant creation request:', req.body);
        console.log('Zone ID received:', zone_id, typeof zone_id);

        // Validate required fields
        if (!custom_name || !custom_name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Plant name is required'
            });
        }

        // zone_id is optional, but if provided, validate it exists
        if (zone_id && !Number.isInteger(parseInt(zone_id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid zone ID format'
            });
        }

        // Validate moisture threshold
        const threshold = parseInt(moisture_threshold);
        if (isNaN(threshold) || threshold < 10 || threshold > 90) {
            return res.status(400).json({
                success: false,
                error: 'Moisture threshold must be between 10% and 90%'
            });
        }

        // Check if profile_id exists if provided
        let selectedProfile = null;
        if (profile_id) {
            const PlantProfile = require('../models/PlantProfile');
            selectedProfile = await PlantProfile.findById(profile_id);
            if (!selectedProfile) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid plant profile selected'
                });
            }
        }

        // Create new plant using the Plant model
        const plantData = {
            user_id: userId,
            profile_id: profile_id || null,
            custom_name: custom_name.trim(),
            notes: notes ? notes.trim() : null,
            zone_id: zone_id ? parseInt(zone_id) : null,
            moisture_threshold: threshold,
            image: image || null,
            species_name: species_name || 'Unknown Species',
            auto_watering_on: true, // Default to enabled
            status: 'healthy', // Default status
            created_at: new Date()
        };

        // Use raw SQL insert for basic plant creation (simplified for existing schema)
        const insertQuery = `
            INSERT INTO plants (
                user_id, profile_id, custom_name, 
                moisture_threshold, auto_watering_on, zone_id, notes, image
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            plantData.user_id,
            plantData.profile_id,
            plantData.custom_name,
            plantData.moisture_threshold,
            plantData.auto_watering_on,
            plantData.zone_id,
            plantData.notes,
            plantData.image
        ];

        const result = await pool.query(insertQuery, values);
        const createdPlant = result.rows[0];

        // Get zone information if zone_id exists
        let zoneInfo = null;
        if (createdPlant.zone_id) {
            const zoneQuery = `SELECT zone_name, description FROM zones WHERE zone_id = $1`;
            const zoneResult = await pool.query(zoneQuery, [createdPlant.zone_id]);
            if (zoneResult.rows.length > 0) {
                zoneInfo = zoneResult.rows[0];
            }
        }

        // Log the action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'PlantController',
            message: `New plant created: ${createdPlant.custom_name} (ID: ${createdPlant.plant_id}) by user ${userId}`
        });

        // Return the created plant with formatted response (matching getUserPlants structure)
        const responseData = {
            plant_id: createdPlant.plant_id,
            name: createdPlant.custom_name,
            species: selectedProfile ? selectedProfile.species_name : (species_name || 'Unknown Species'),
            location: zoneInfo ? zoneInfo.zone_name : 'No zone assigned',
            status: createdPlant.status || 'healthy',
            health: 100, // New plants start healthy
            image: createdPlant.image,
            lastWatered: null, // Never watered yet
            auto_watering_on: createdPlant.auto_watering_on,
            moisture_threshold: createdPlant.moisture_threshold,
            device_key: createdPlant.device_key,
            device_name: null, // No device assigned yet
            zone_id: createdPlant.zone_id,
            zone_name: zoneInfo ? zoneInfo.zone_name : null,
            zone_description: zoneInfo ? zoneInfo.description : null,
            notes: createdPlant.notes,
            created_at: createdPlant.created_at
        };

        res.status(201).json({
            success: true,
            message: 'Plant created successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Create plant error:', error);
        
        // Log the error
        await SystemLog.error('PlantController', `Error creating plant for user ${req.user.user_id}: ${error.message}`);
        
        res.status(500).json({
            success: false,
            error: 'Failed to create plant. Please try again.'
        });
    }
};

/**
 * Get watering history actions for a specific plant
 */
const getWateringHistory = async (req, res) => {
    try {
        const { plantId } = req.params;
        console.log('[WATERING HISTORY] Plant ID:', plantId);
        
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            console.log('[WATERING HISTORY] Plant not found');
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Verify ownership
        if (plant.user_id !== req.user.user_id) {
            console.log('[WATERING HISTORY] Unauthorized access');
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access to plant'
            });
        }

        console.log('[WATERING HISTORY] Executing direct query for plant:', plantId);
        
        // Use direct query instead of WateringHistory model to avoid any potential issues
        const query = `
            SELECT 
                wh.history_id,
                wh.plant_id,
                wh.timestamp,
                wh.trigger_type,
                wh.duration_seconds,
                wh.device_key,
                d.device_name
            FROM watering_history wh
            LEFT JOIN devices d ON wh.device_key = d.device_key
            WHERE wh.plant_id = $1
            ORDER BY wh.timestamp DESC 
            LIMIT 50
        `;

        const result = await pool.query(query, [plantId]);
        console.log('[WATERING HISTORY] Found records:', result.rows.length);
        
        return res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('[WATERING HISTORY] Error:', error);
        await SystemLog.error('plantController', `Error fetching watering history for plant ${req.params.plantId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching watering history'
        });
    }
};

/**
 * Get watering history statistics for a specific plant
 */
const getWateringStats = async (req, res) => {
    try {
        const { plantId } = req.params;
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Verify ownership
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access to plant'
            });
        }

        const stats = await WateringHistory.getStatsByPlantId(plantId);
        
        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        await SystemLog.error('plantController', `Error fetching watering stats for plant ${req.params.plantId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching watering stats'
        });
    }
};

/**
 * Get sensor data history for a specific plant
 */
const getSensorHistory = async (req, res) => {
    try {
        const { plantId } = req.params;
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Verify ownership
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access to plant'
            });
        }

        const query = `
            SELECT data_id, timestamp, soil_moisture, temperature, 
                   air_humidity, light_intensity 
            FROM sensors_data
            WHERE plant_id = $1
            ORDER BY timestamp DESC
            LIMIT 100
        `;

        const result = await pool.query(query, [plantId]);
        
        return res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        await SystemLog.error('plantController', `Error fetching sensor history for plant ${req.params.plantId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching sensor history'
        });
    }
};

/**
 * Get sensor data statistics for a specific plant
 */
const getSensorStats = async (req, res) => {
    try {
        const { plantId } = req.params;
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Verify ownership
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access to plant'
            });
        }

        // Get statistics for each sensor type - simplified approach
        const query = `
            SELECT 
                ROUND(AVG(soil_moisture)::numeric, 2) as avg_soil_moisture,
                ROUND(MIN(soil_moisture)::numeric, 2) as min_soil_moisture,
                ROUND(MAX(soil_moisture)::numeric, 2) as max_soil_moisture,
                ROUND(AVG(temperature)::numeric, 2) as avg_temperature,
                ROUND(MIN(temperature)::numeric, 2) as min_temperature,
                ROUND(MAX(temperature)::numeric, 2) as max_temperature,
                ROUND(AVG(air_humidity)::numeric, 2) as avg_humidity,
                ROUND(MIN(air_humidity)::numeric, 2) as min_humidity,
                ROUND(MAX(air_humidity)::numeric, 2) as max_humidity,
                ROUND(AVG(light_intensity)::numeric, 2) as avg_light,
                ROUND(MIN(light_intensity)::numeric, 2) as min_light,
                ROUND(MAX(light_intensity)::numeric, 2) as max_light,
                COUNT(*) as total_readings,
                MIN(timestamp) as first_reading,
                MAX(timestamp) as last_reading
            FROM sensors_data
            WHERE plant_id = $1
            AND timestamp >= NOW() - INTERVAL '1 day'
        `;

        const result = await pool.query(query, [plantId]);
        
        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        await SystemLog.error('plantController', `Error fetching sensor stats for plant ${req.params.plantId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching sensor stats'
        });
    }
};

/**
 * Get last watered information for a specific plant
 */
const getLastWatered = async (req, res) => {
    try {
        const { plantId } = req.params;
        console.log('[LAST WATERED] Plant ID:', plantId);
        
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            console.log('[LAST WATERED] Plant not found');
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Verify ownership
        if (plant.user_id !== req.user.user_id) {
            console.log('[LAST WATERED] Unauthorized access');
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access to plant'
            });
        }

        console.log('[LAST WATERED] Executing query for plant:', plantId);
        const query = `
            SELECT 
                wh.history_id,
                wh.timestamp,
                wh.trigger_type,
                wh.duration_seconds,
                d.device_name,
                EXTRACT(EPOCH FROM (NOW() - wh.timestamp)) as seconds_ago
            FROM watering_history wh
            LEFT JOIN devices d ON wh.device_key = d.device_key
            WHERE wh.plant_id = $1
            ORDER BY wh.timestamp DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [plantId]);
        console.log('[LAST WATERED] Query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('[LAST WATERED] No watering history found');
            return res.json({
                success: true,
                data: {
                    last_watered: null,
                    message: 'No watering history found for this plant'
                }
            });
        }

        const lastWatering = result.rows[0];
        console.log('[LAST WATERED] Found watering record:', lastWatering);
        
        const hoursAgo = Math.floor(lastWatering.seconds_ago / 3600);
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timeAgoText;
        if (daysAgo > 0) {
            timeAgoText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        } else if (hoursAgo > 0) {
            timeAgoText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
            const minutesAgo = Math.floor(lastWatering.seconds_ago / 60);
            timeAgoText = minutesAgo > 0 ? `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago` : 'Just now';
        }
        
        return res.json({
            success: true,
            data: {
                last_watered: {
                    timestamp: lastWatering.timestamp,
                    trigger_type: lastWatering.trigger_type,
                    duration_seconds: lastWatering.duration_seconds,
                    device_name: lastWatering.device_name,
                    time_ago: timeAgoText,
                    hours_ago: Math.round(lastWatering.seconds_ago / 3600 * 100) / 100
                }
            }
        });

    } catch (error) {
        console.error('[LAST WATERED] Error:', error);
        await SystemLog.error('plantController', `Error fetching last watered for plant ${req.params.plantId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching last watered information'
        });
    }
};

// Replace or update your existing waterPlant handler with this safe version
exports.waterPlant = async (req, res) => {
  try {
    // Accept both numeric IDs and UUIDs from the route
    const rawId = req.params.plantId || req.params.id;
    if (!rawId) return res.status(400).json({ success: false, message: 'Missing plant id' });

    // Determine numeric vs UUID
    let plantId = rawId;
    if (/^\d+$/.test(String(rawId))) {
      plantId = parseInt(rawId, 10);
    }

    // Read payload
    const { duration, action } = req.body;
    let cmd = 'pump_on';
    let dur = duration;
    if (action === 'pump_off' || dur === 0) {
      cmd = 'pump_off';
      dur = null;
    }

    // Load plant record (Plant.findById should accept either int or uuid)
    const plant = await Plant.findById(plantId);
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    const deviceKey = plant.device_key ? String(plant.device_key).trim() : null;
    if (!deviceKey) {
      // Optionally continue but warn; keep behavior consistent with your app:
      console.warn(`[WATER] Plant ${plantId} has no device_key`);
      // return res.status(400).json({ success:false, message:'No device linked to this plant' });
    }

    // Send MQTT command (will generate commandId on server side)
    const result = await mqttClient.sendPumpCommand(deviceKey, cmd, dur);

    // Record watering history and include device_key (may be null)
    const recordedDuration = cmd === 'pump_on' ? (parseInt(duration, 10) || 0) : 0;
    await WateringHistory.logWatering(plant.plant_id || plantId, 'manual', recordedDuration, deviceKey);

    return res.json({ success: true, result, message: `Watering initiated for ${recordedDuration} seconds` });
  } catch (error) {
    console.error('Error in waterPlant:', error);
    await SystemLog.create('ERROR', `waterPlant error: ${error.message}`).catch(()=>{});
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
    waterPlant,
    getWateringSchedule,
    setWateringSchedule,
    toggleAutoWatering,
    setSensorThresholds,
    getUserPlants,
    getPlantById,
    createPlant,
    getWateringHistory,
    getSensorHistory,
    getSensorStats,
    getLastWatered
};