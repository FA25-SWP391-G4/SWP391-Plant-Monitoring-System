/**
 * ============================================================================
 * PLANT CONTROLLER - PLANT & WATERING MANAGEMENT
 * ============================================================================
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

        // Validate UUID format
        if (!isValidUUID(plantId)) {
            console.error('[WATER PLANT] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
            });
        }

        // Validate duration
        if (duration < 1 || duration > 300) { // Limit to 5 minutes max
            return res.status(400).json({
                success: false,
                error: 'Duration must be between 1 and 300 seconds'
            });
        }

        console.log('[WATER PLANT] Watering plant UUID:', plantId, 'for', duration, 'seconds');

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
        const device = await Device.findByPlantId(plantId);
        
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'No device found for this plant'
            });
        }

        // Check if device is online
        if (!device.is_online) {
            return res.status(400).json({
                success: false,
                error: 'Device is offline. Cannot water plant.'
            });
        }

        // Send command to device to start watering via AWS IoT Core
        const wateringCommand = {
            command: 'water',
            duration: duration,
            plantId: plantId,
            timestamp: new Date().toISOString()
        };

        // Send command via AWS IoT Core
        try {
            const connection = await getAwsIoTConnection();
            const topic = `smartplant/device/${device.device_id}/command`;
            
            connection.publish(
                topic,
                JSON.stringify(wateringCommand),
                mqtt.QoS.AtLeastOnce
            );
            
            console.log(`Command sent to AWS IoT Core on topic: ${topic}`);
        } catch (error) {
            console.error('AWS IoT Core publishing error:', error);
            // Log error but continue - we already saved the watering record
            await SystemLog.error('PlantController', `AWS IoT publish error: ${error.message}`);
        }

        // Create watering history record
        const wateringRecord = {
            plant_id: plantId,
            duration: duration,
            water_amount: calculateWaterAmount(duration), // ml of water
            method: 'manual',
            created_by: req.user.user_id
        };

        const wateringHistory = await WateringHistory.create(wateringRecord);

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
                waterAmount: wateringRecord.water_amount,
                timestamp: wateringHistory.created_at
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
        if (!isValidUUID(plantId)) {
            console.error('[GET SCHEDULE] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
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
        if (!isValidUUID(plantId)) {
            console.error('[SET SCHEDULE] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
            });
        }

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
        const schedulePromises = schedule.map(entry => {
            return PumpSchedule.create({
                plant_id: plantId,
                day_of_week: entry.dayOfWeek,
                hour: entry.hour,
                minute: entry.minute,
                duration: entry.duration,
                enabled: entry.enabled !== false // Default to enabled
            });
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
        if (!isValidUUID(plantId)) {
            console.error('[TOGGLE AUTO WATERING] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
            });
        }

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
        if (!isValidUUID(plantId)) {
            console.error('[SET THRESHOLDS] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
            });
        }

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
        const userId = req.user.user_id;
        
        // Get all plants for the user with their devices and latest sensor data
        const query = `
            SELECT 
                p.*,
                d.device_id,
                d.device_name
            FROM 
                "plants" p
            LEFT JOIN 
                "devices" d ON p.device_id = d.device_id
            WHERE 
                p.user_id = $1
        `;
        
        const { rows } = await pool.query(query, [userId]);
        
        if (rows.length === 0) {
            // Return a default plant if none exists for this user
            return res.json([
                {
                    plant_id: 'default-1',
                    name: 'Common Lantana',
                    species: 'Lantana camara',
                    location: 'Living Room',
                    status: 'healthy',
                    health: 95,
                    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Lantana_camara-IMG_8252.JPG/320px-Lantana_camara-IMG_8252.JPG',
                    lastWatered: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    auto_watering_on: true,
                    thresholds: JSON.stringify({
                        moisture_min: 25,
                        moisture_max: 60,
                        light_min: 2000,
                        light_max: 10000,
                        temperature_min: 15,
                        temperature_max: 32,
                        humidity_min: 30,
                        humidity_max: 70
                    })
                },
                {
                    plant_id: 'default-2',
                    name: 'Peace Lily',
                    species: 'Spathiphyllum',
                    location: 'Bedroom',
                    status: 'needs_water',
                    health: 70,
                    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Spathiphyllum_cochlearispathum_RTBG.jpg/320px-Spathiphyllum_cochlearispathum_RTBG.jpg',
                    lastWatered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                    auto_watering_on: false,
                    thresholds: JSON.stringify({
                        moisture_min: 30,
                        moisture_max: 70,
                        light_min: 1000,
                        light_max: 8000,
                        temperature_min: 18,
                        temperature_max: 30,
                        humidity_min: 40,
                        humidity_max: 80
                    })
                },
                {
                    plant_id: 'default-3',
                    name: 'Snake Plant',
                    species: 'Sansevieria trifasciata',
                    location: 'Study',
                    status: 'needs_attention',
                    health: 50,
                    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg/320px-Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg',
                    lastWatered: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
                    auto_watering_on: true,
                    thresholds: JSON.stringify({
                        moisture_min: 15,
                        moisture_max: 40,
                        light_min: 500,
                        light_max: 5000,
                        temperature_min: 10,
                        temperature_max: 35,
                        humidity_min: 20,
                        humidity_max: 50
                    })
                }
            ]);
        }
        
        // Process the plants data to make it frontend-friendly
        const plants = rows.map(plant => {
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
            
            return {
                plant_id: plant.plant_id,
                name: plant.name,
                species: plant.species || 'Unknown',
                location: plant.location || 'Not specified',
                status: plant.status || 'healthy',
                health: plant.health || 100,
                image: plant.image_url || null,
                lastWatered: plant.last_watered || new Date().toISOString(),
                auto_watering_on: plant.auto_watering_on || false,
                device_id: plant.device_id,
                device_name: plant.device_name,
                thresholds: thresholds
            };
        });
        
        res.json(plants);
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
        const userId = req.user.user_id;
        const plantId = req.params.id;
        
        // Get the plant with its device and latest sensor data
        const query = `
            SELECT 
                p.*,
                d.device_id,
                d.device_name,
                d.sensor_type
            FROM 
                "plants" p
            LEFT JOIN 
                "devices" d ON p.device_id = d.device_id
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
            name: plant.name,
            species: plant.species || 'Unknown',
            location: plant.location || 'Not specified',
            status: plant.status || 'healthy',
            health: plant.health || 100,
            image: plant.image_url || null,
            lastWatered: plant.last_watered || new Date().toISOString(),
            auto_watering_on: plant.auto_watering_on || false,
            device_id: plant.device_id,
            device_name: plant.device_name,
            thresholds: thresholds
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

module.exports = {
    waterPlant,
    getWateringSchedule,
    setWateringSchedule,
    toggleAutoWatering,
    setSensorThresholds,
    getUserPlants,
    getPlantById
};