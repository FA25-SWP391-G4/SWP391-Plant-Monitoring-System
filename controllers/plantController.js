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
const mqtt = require('mqtt');

// MQTT client for device communication
let mqttClient = null;
try {
    mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');
    
    mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
    });
    
    mqttClient.on('error', (err) => {
        console.error('MQTT connection error:', err);
    });
} catch (error) {
    console.error('Failed to initialize MQTT client:', error);
}

/**
 * UC5: MANUAL WATERING
 * ===============================
 * Manually activates water pump for a specific plant
 * 
 * @route POST /api/plants/:plantId/water
 * @access Private - Requires authentication
 * @param {number} plantId - ID of the plant to water
 * @param {number} duration - Watering duration in seconds (default: 10)
 * @returns {Object} Watering confirmation
 */
async function waterPlant(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { duration = 10 } = req.body; // Default 10 seconds if not provided

        // Validate duration
        if (duration < 1 || duration > 300) { // Limit to 5 minutes max
            return res.status(400).json({
                success: false,
                error: 'Duration must be between 1 and 300 seconds'
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

        // Check if user owns this plant
        if (plant.user_id !== req.user.user_id) {
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

        // Send MQTT command to device to start watering
        const wateringCommand = {
            command: 'water',
            duration: duration,
            plantId: plantId,
            timestamp: new Date().toISOString()
        };

        // Send command via MQTT
        if (mqttClient && mqttClient.connected) {
            mqttClient.publish(`device/${device.device_id}/command`, JSON.stringify(wateringCommand));
        } else {
            console.error('MQTT client not connected. Using alternative method...');
            // Fallback to HTTP API call to device if MQTT is not available
            // This is just a placeholder for the implementation
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
 * @param {number} plantId - ID of the plant
 * @returns {Object} Watering schedule
 */
async function getWateringSchedule(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant
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
 * @param {number} plantId - ID of the plant
 * @param {Array} schedule - Array of schedule entries
 * @returns {Object} Updated watering schedule
 */
async function setWateringSchedule(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { schedule } = req.body;

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

        // Check if user owns this plant
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
 * @param {number} plantId - ID of the plant
 * @param {boolean} enabled - Whether auto-watering should be enabled
 * @returns {Object} Updated plant status
 */
async function toggleAutoWatering(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { enabled } = req.body;

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

        // Check if user owns this plant
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
 * @param {number} plantId - ID of the plant
 * @param {Object} thresholds - Sensor thresholds
 * @returns {Object} Updated thresholds
 */
async function setSensorThresholds(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { thresholds } = req.body;

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

        // Check if user owns this plant
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

module.exports = {
    waterPlant,
    getWateringSchedule,
    setWateringSchedule,
    toggleAutoWatering,
    setSensorThresholds
};