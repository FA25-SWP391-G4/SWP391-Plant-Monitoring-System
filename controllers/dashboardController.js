/**
 * ============================================================================
 * DASHBOARD CONTROLLER - PLANT MONITORING DASHBOARD
 * ============================================================================
 * 
 * This controller handles dashboard functionality:
 * - UC4: View Plant Monitoring Dashboard - Real-time sensor data
 * - UC17: Customize Dashboard - Widget customization (Premium only)
 * 
 * IMPLEMENTATION NOTES:
 * - Uses WebSocket for real-time data updates
 * - Integration with sensor data collection
 * - Dashboard preferences saved to user profile
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id is now UUID format
 * - Validates UUID parameters before database queries
 */

const Plant = require('../models/Plant');
const SensorData = require('../models/SensorData');
const User = require('../models/User');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');

/**
 * UC4: GET DASHBOARD DATA
 * ===============================
 * Retrieves the latest sensor data for all plants owned by the user
 * 
 * @route GET /api/dashboard
 * @access Private - Requires authentication
 * @returns {Object} Dashboard data with plant info and latest sensor readings
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id from JWT is now UUID
 * - Plant queries use UUID user_id
 */
async function getDashboardData(req, res) {
    try {
        // Get user_id from authenticated request (now UUID)
        const userId = req.user.user_id;

        // Validate UUID (should already be validated by auth middleware, but double-check)
        if (!isValidUUID(userId)) {
            console.error('[DASHBOARD] Invalid user_id UUID:', userId);
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Get all plants owned by this user
        const plants = await Plant.findByUserId(userId);

        // Get notification statistics for dashboard
        const notificationStats = await getNotificationStatsForUser(userId);
        
        // Get recent alerts (last 5) for dashboard display
        const recentAlerts = await Alert.findByUserId(userId, 5);

        if (!plants || plants.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No plants found',
                data: {
                    plants: [],
                    latestReadings: {},
                    deviceStatus: {},
                    notifications: {
                        stats: notificationStats,
                        recentAlerts: recentAlerts
                    }
                }
            });
        }

        // Get plant IDs
        const plantIds = plants.map(plant => plant.plant_id);

        // Get latest sensor readings for these plants
        const latestReadings = await SensorData.findLatestForPlants(plants);

        // Get device status for plants with devices
        const deviceStatus = await Device.getStatusForPlants(plants);

        // Format the response
        const dashboardData = {
            plants: plants,
            latestReadings: latestReadings,
            deviceStatus: deviceStatus,
            notifications: {
                stats: notificationStats,
                recentAlerts: recentAlerts
            },
            systemStatus: {
                totalPlants: plants.length,
                activeDevices: Object.keys(deviceStatus).filter(id => deviceStatus[id] === 'online').length,
                lastUpdated: new Date().toISOString()
            }
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboard data'
        });
    }
}

/**
 * UC4: GET REAL-TIME SENSOR DATA
 * ===============================
 * This function would typically be used with WebSockets
 * Here it's implemented as a REST endpoint for demonstration
 * 
 * @route GET /api/dashboard/real-time/:plantId
 * @access Private - Requires authentication
 * @param {string} plantId - UUID of the plant to get data for
 * @returns {Object} Real-time sensor data
 * 
 * UPDATED FOR UUID MIGRATION:
 * - plantId parameter is now UUID
 * - Validates UUID format before operations
 */
async function getRealTimeSensorData(req, res) {
    try {
        // Get plant ID from route params (now UUID)
        const { plantId } = req.params;

        // Validate UUID format
        if (!isValidUUID(plantId)) {
            console.error('[REAL-TIME DATA] Invalid plant UUID:', plantId);
            return res.status(400).json({
                success: false,
                error: 'Invalid plant ID format'
            });
        }

        // Verify plant ownership
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // UUID comparison
        if (plant.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        }

        // Get the latest sensor data
        const latestData = await SensorData.findLatestForPlant(plantId);

        if (!latestData) {
            return res.status(200).json({
                success: true,
                message: 'No sensor data available for this plant',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: latestData
        });

    } catch (error) {
        console.error('Get real-time sensor data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve real-time sensor data'
        });
    }
}

/**
 * UC17: GET DASHBOARD PREFERENCES
 * ===============================
 * Retrieves the user's dashboard preferences (widget placement, etc)
 * Premium feature only
 * 
 * @route GET /api/dashboard/preferences
 * @access Private - Requires authentication and premium
 * @returns {Object} User's dashboard preferences
 */
async function getDashboardPreferences(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;

        // Check if user is premium
        if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        }

        // Get user with dashboard preferences
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Extract dashboard preferences
        const dashboardPrefs = user.dashboard_preferences || {
            widgets: [],
            layout: 'grid',
            refreshRate: 10 // Default 10 seconds
        };

        res.status(200).json({
            success: true,
            data: dashboardPrefs
        });

    } catch (error) {
        console.error('Get dashboard preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboard preferences'
        });
    }
}

/**
 * UC17: UPDATE DASHBOARD PREFERENCES
 * ===============================
 * Updates the user's dashboard preferences (widget placement, etc)
 * Premium feature only
 * 
 * @route PUT /api/dashboard/preferences
 * @access Private - Requires authentication and premium
 * @param {Object} preferences - Dashboard preferences
 * @returns {Object} Updated dashboard preferences
 */
async function updateDashboardPreferences(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;

        // Check if user is premium
        if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        }

        // Get user 
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get preferences from request body
        const { widgets, layout, refreshRate } = req.body;

        // Validate preferences
        if (!widgets || !Array.isArray(widgets)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid widgets configuration'
            });
        }

        // Create dashboard preferences object
        const dashboardPrefs = {
            widgets,
            layout: layout || 'grid',
            refreshRate: refreshRate || 10
        };

        // Save to user
        user.dashboard_preferences = dashboardPrefs;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Dashboard preferences updated successfully',
            data: dashboardPrefs
        });

    } catch (error) {
        console.error('Update dashboard preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update dashboard preferences'
        });
    }
}

/**
 * Helper function to get notification statistics for dashboard
 */
async function getNotificationStatsForUser(userId) {
    try {
        if (!isValidUUID(userId)) {
            return { total: 0, unread: 0, critical: 0, high_priority: 0, recent: 0 };
        }

        const query = 'SELECT get_notification_stats($1) as stats';
        const result = await pool.query(query, [userId]);
        
        return result.rows[0]?.stats || { 
            total: 0, 
            unread: 0, 
            critical: 0, 
            high_priority: 0, 
            recent: 0,
            by_type: {}
        };
    } catch (error) {
        console.error('Error getting notification stats for dashboard:', error);
        return { total: 0, unread: 0, critical: 0, high_priority: 0, recent: 0, by_type: {} };
    }
}

module.exports = {
    getDashboardData,
    getRealTimeSensorData,
    getDashboardPreferences,
    updateDashboardPreferences
};