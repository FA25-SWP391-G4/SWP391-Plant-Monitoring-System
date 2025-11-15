/**
 * ============================================================================
 * REPORT CONTROLLER - HISTORY & ANALYTICS
 * ============================================================================
 * 
 * This controller handles report and history functionality:
 * - UC8: View Watering History - Historical data with date filtering
 * - UC14: View Detailed Plant Health Report - Comprehensive analytics (Premium)
 * - UC16: Search Plant Health Reports - Multi-criteria search (Premium)
 * - UC23: Search Watering History - Advanced search (Premium)
 * - UC25: View System-Wide Reports - Global analytics (Admin)
 * 
 * IMPLEMENTATION NOTES:
 * - Regular users can view basic watering history
 * - Premium users get detailed reports and advanced search
 * - Admins can access system-wide analytics
 */

const WateringHistory = require('../models/WateringHistory');
const SensorData = require('../models/SensorData');
const Plant = require('../models/Plant');
const SystemLog = require('../models/SystemLog');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

/**
 * UC8: GET WATERING HISTORY
 * ===============================
 * Gets watering history for a specific plant with date filtering
 * 
 * @route GET /api/reports/watering-history/:plantId
 * @access Private - Requires authentication
 * @param {number} plantId - ID of the plant
 * @param {string} startDate - Start date for filtering (optional)
 * @param {string} endDate - End date for filtering (optional)
 * @returns {Object} Watering history
 */
async function getWateringHistory(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { startDate, endDate } = req.query;

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant
        if (plant.user_id !== req.user.user_id && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        }

        // Parse dates if provided
        let parsedStartDate = startDate ? new Date(startDate) : null;
        let parsedEndDate = endDate ? new Date(endDate) : null;

        // Validate dates
        if ((parsedStartDate && isNaN(parsedStartDate)) || (parsedEndDate && isNaN(parsedEndDate))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Get watering history
        const history = await WateringHistory.findByPlantId(plantId, parsedStartDate, parsedEndDate);

        res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Get watering history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve watering history'
        });
    }
}

/**
 * UC8: EXPORT WATERING HISTORY
 * ===============================
 * Exports watering history as CSV file
 * 
 * @route GET /api/reports/watering-history/:plantId/export
 * @access Private - Requires authentication
 * @param {number} plantId - ID of the plant
 * @param {string} startDate - Start date for filtering (optional)
 * @param {string} endDate - End date for filtering (optional)
 * @returns {File} CSV file download
 */
async function exportWateringHistory(req, res) {
    try {
        // Get plant ID from route params
        const { plantId } = req.params;
        const { startDate, endDate } = req.query;

        // Find the plant
        const plant = await Plant.findById(plantId);
        
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found'
            });
        }

        // Check if user owns this plant
        if (plant.user_id !== req.user.user_id && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        }

        // Parse dates if provided
        let parsedStartDate = startDate ? new Date(startDate) : null;
        let parsedEndDate = endDate ? new Date(endDate) : null;

        // Validate dates
        if ((parsedStartDate && isNaN(parsedStartDate)) || (parsedEndDate && isNaN(parsedEndDate))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Get watering history
        const history = await WateringHistory.findByPlantId(plantId, parsedStartDate, parsedEndDate);

        // Create CSV file
        const timestamp = Date.now();
        const fileName = `plant-${plantId}-watering-history-${timestamp}.csv`;
        const filePath = path.join(__dirname, '..', 'public', 'exports', fileName);

        // Ensure directory exists
        const dirPath = path.join(__dirname, '..', 'public', 'exports');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Define CSV structure
        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'watering_id', title: 'Watering ID' },
                { id: 'created_at', title: 'Date & Time' },
                { id: 'duration', title: 'Duration (seconds)' },
                { id: 'water_amount', title: 'Water Amount (ml)' },
                { id: 'method', title: 'Method' },
                { id: 'created_by', title: 'Created By' }
            ]
        });

        // Write data to CSV
        await csvWriter.writeRecords(history);

        // Send file to client
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            
            // Clean up - delete file after sending
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting file:', unlinkErr);
                }
            });
        });

    } catch (error) {
        console.error('Export watering history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export watering history'
        });
    }
}

/**
 * UC23: SEARCH WATERING HISTORY (Premium Feature)
 * ===============================
 * Advanced search for watering history across all user's plants
 * 
 * @route POST /api/reports/search/watering-history
 * @access Private - Requires authentication and premium
 * @param {Object} filters - Search filters
 * @returns {Object} Search results
 */
async function searchWateringHistory(req, res) {
    try {
        // Check if user is premium
        if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        }

        const { 
            plantId, 
            startDate, 
            endDate, 
            method, 
            minDuration, 
            maxDuration 
        } = req.body;

        // Get user's plants
        const plants = await Plant.findByUserId(req.user.user_id);
        const plantIds = plants.map(plant => plant.plant_id);
        
        // Search watering history
        const searchResults = await WateringHistory.search({
            plantId: plantId ? [plantId] : plantIds,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            method,
            minDuration,
            maxDuration,
            userId: req.user.user_id
        });

        res.status(200).json({
            success: true,
            data: searchResults
        });

    } catch (error) {
        console.error('Search watering history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search watering history'
        });
    }
}

/**
 * UC14: GET PLANT HEALTH REPORT (Premium Feature)
 * ===============================
 * Gets detailed health report for a plant including trends
 * 
 * @route GET /api/reports/health/:plantId
 * @access Private - Requires authentication and premium
 * @param {number} plantId - ID of the plant
 * @param {string} timeframe - Report timeframe (day, week, month)
 * @returns {Object} Plant health report
 */
async function getPlantHealthReport(req, res) {
    try {
        // Check if user is premium
        if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        }

        // Get plant ID from route params
        const { plantId } = req.params;
        const { timeframe = 'week' } = req.query; // Default to week

        // Validate timeframe
        if (!['day', 'week', 'month'].includes(timeframe)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid timeframe. Must be day, week, or month'
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
        if (plant.user_id !== req.user.user_id && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        }

        // Calculate date range based on timeframe
        const endDate = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case 'day':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        // Get sensor data
        const sensorData = await SensorData.findByPlantId(plantId, startDate, endDate);

        // Get watering history
        const wateringHistory = await WateringHistory.findByPlantId(plantId, startDate, endDate);

        // Generate report
        const report = generatePlantHealthReport(plant, sensorData, wateringHistory, timeframe);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Get plant health report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve plant health report'
        });
    }
}

/**
 * Generate a plant health report from raw data
 * @param {Object} plant - Plant object
 * @param {Array} sensorData - Sensor data array
 * @param {Array} wateringHistory - Watering history array
 * @param {string} timeframe - Report timeframe
 * @returns {Object} Formatted report
 */
function generatePlantHealthReport(plant, sensorData, wateringHistory, timeframe) {
    // This would typically be a complex function with data analysis
    // Here we're providing a simplified version

    // Calculate averages
    const moistureReadings = sensorData.filter(reading => reading.sensor_type === 'moisture');
    const temperatureReadings = sensorData.filter(reading => reading.sensor_type === 'temperature');
    const lightReadings = sensorData.filter(reading => reading.sensor_type === 'light');

    const avgMoisture = moistureReadings.length > 0 
        ? moistureReadings.reduce((sum, reading) => sum + reading.value, 0) / moistureReadings.length 
        : null;
    
    const avgTemperature = temperatureReadings.length > 0 
        ? temperatureReadings.reduce((sum, reading) => sum + reading.value, 0) / temperatureReadings.length 
        : null;
    
    const avgLight = lightReadings.length > 0 
        ? lightReadings.reduce((sum, reading) => sum + reading.value, 0) / lightReadings.length 
        : null;

    // Calculate total watering
    const totalWateringDuration = wateringHistory.reduce((sum, record) => sum + record.duration, 0);
    const totalWaterAmount = wateringHistory.reduce((sum, record) => sum + record.water_amount, 0);

    // Define health status based on sensor data and thresholds
    let moistureStatus = 'unknown';
    if (avgMoisture !== null) {
        if (avgMoisture < (plant.thresholds?.moisture_min || 30)) {
            moistureStatus = 'too dry';
        } else if (avgMoisture > (plant.thresholds?.moisture_max || 70)) {
            moistureStatus = 'too wet';
        } else {
            moistureStatus = 'optimal';
        }
    }

    let temperatureStatus = 'unknown';
    if (avgTemperature !== null) {
        if (avgTemperature < (plant.thresholds?.temperature_min || 15)) {
            temperatureStatus = 'too cold';
        } else if (avgTemperature > (plant.thresholds?.temperature_max || 30)) {
            temperatureStatus = 'too hot';
        } else {
            temperatureStatus = 'optimal';
        }
    }

    let lightStatus = 'unknown';
    if (avgLight !== null) {
        if (avgLight < (plant.thresholds?.light_min || 20)) {
            lightStatus = 'too dark';
        } else if (avgLight > (plant.thresholds?.light_max || 80)) {
            lightStatus = 'too bright';
        } else {
            lightStatus = 'optimal';
        }
    }

    // Return formatted report
    return {
        plant_id: plant.plant_id,
        plant_name: plant.name,
        timeframe,
        report_date: new Date(),
        sensor_summary: {
            moisture: {
                average: avgMoisture?.toFixed(2) || 'No data',
                status: moistureStatus,
                readings_count: moistureReadings.length
            },
            temperature: {
                average: avgTemperature?.toFixed(2) || 'No data',
                status: temperatureStatus,
                readings_count: temperatureReadings.length
            },
            light: {
                average: avgLight?.toFixed(2) || 'No data',
                status: lightStatus,
                readings_count: lightReadings.length
            }
        },
        watering_summary: {
            count: wateringHistory.length,
            total_duration: totalWateringDuration,
            total_water_amount: totalWaterAmount,
            manual_count: wateringHistory.filter(record => record.method === 'manual').length,
            auto_count: wateringHistory.filter(record => record.method === 'auto').length
        },
        health_assessment: {
            overall_status: determineOverallHealth(moistureStatus, temperatureStatus, lightStatus),
            recommendations: generateRecommendations(moistureStatus, temperatureStatus, lightStatus)
        },
        raw_data: {
            sensor_data: timeframe === 'day' ? sensorData : null, // Only include raw data for daily reports
            watering_history: wateringHistory
        }
    };
}

/**
 * Determine overall plant health from individual statuses
 */
function determineOverallHealth(moisture, temperature, light) {
    // Count how many are optimal
    const statuses = [moisture, temperature, light];
    const optimalCount = statuses.filter(status => status === 'optimal').length;
    
    if (optimalCount === 3) return 'excellent';
    if (optimalCount === 2) return 'good';
    if (optimalCount === 1) return 'fair';
    return 'poor';
}

/**
 * Generate recommendations based on plant status
 */
function generateRecommendations(moisture, temperature, light) {
    const recommendations = [];
    
    if (moisture === 'too dry') {
        recommendations.push('Increase watering frequency or duration');
    } else if (moisture === 'too wet') {
        recommendations.push('Reduce watering frequency or duration');
    }
    
    if (temperature === 'too cold') {
        recommendations.push('Move plant to a warmer location or provide supplemental heating');
    } else if (temperature === 'too hot') {
        recommendations.push('Move plant to a cooler location or provide shade');
    }
    
    if (light === 'too dark') {
        recommendations.push('Move plant to a brighter location or provide supplemental lighting');
    } else if (light === 'too bright') {
        recommendations.push('Provide shade or move to a location with filtered light');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Plant conditions are optimal. Continue current care routine.');
    }
    
    return recommendations;
}

module.exports = {
    getWateringHistory,
    exportWateringHistory,
    searchWateringHistory,
    getPlantHealthReport
};