const { pool } = require('../config/db.js');

/**
 * Get the latest sensor data for all devices
 * If user_id is provided, only returns data for devices associated with that user
 */
const getLatestSensorData = async (req, res) => {
    try {
        const userId = req.user ? req.user.user_id : null;
        
        let query;
        let params = [];
        
        if (userId) {
            // If user is authenticated, only return their devices
            query = `
                SELECT DISTINCT ON (sd.device_id) 
                    sd.device_id, 
                    sd.timestamp, 
                    sd.soil_moisture AS moisture,
                    sd.temperature, 
                    sd.air_humidity AS humidity, 
                    sd.light_intensity AS light,
                    d.device_name,
                    d.sensor_type,
                    p.plant_id,
                    p.name AS plant_name
                FROM 
                    "SensorData" sd
                JOIN 
                    "Device" d ON sd.device_id = d.device_id
                LEFT JOIN 
                    "Plant" p ON d.device_id = p.device_id
                WHERE 
                    p.user_id = $1
                ORDER BY 
                    sd.device_id, sd.timestamp DESC
            `;
            params = [userId];
        } else {
            // If no user_id (should not happen due to authMiddleware), return all data
            query = `
                SELECT DISTINCT ON (sd.device_id) 
                    sd.device_id, 
                    sd.timestamp, 
                    sd.soil_moisture AS moisture,
                    sd.temperature, 
                    sd.air_humidity AS humidity, 
                    sd.light_intensity AS light,
                    d.device_name,
                    d.sensor_type
                FROM 
                    "SensorData" sd
                JOIN 
                    "Device" d ON sd.device_id = d.device_id
                ORDER BY 
                    sd.device_id, sd.timestamp DESC
            `;
        }

                const { rows: countRows } = await pool.query(countQuery, countParams);
        
        // Format the response as an object with device_id as keys
        const formattedData = {};
        rows.forEach(row => {
            formattedData[row.device_id] = {
                device_id: row.device_id,
                device_name: row.device_name,
                sensor_type: row.sensor_type,
                plant_id: row.plant_id,
                plant_name: row.plant_name,
                timestamp: row.timestamp,
                moisture: row.moisture,
                temperature: row.temperature,
                humidity: row.humidity,
                light: row.light,
                // Add historical data for charts
                history: {
                    moisture: generateMockHistoryData(30, 40, 80),
                    temperature: generateMockHistoryData(30, 18, 30),
                    humidity: generateMockHistoryData(30, 40, 80),
                    light: generateMockHistoryData(30, 1000, 10000)
                }
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Generate mock history data for charts
 */
const generateMockHistoryData = (count, min, max) => {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < count; i++) {
        // Generate timestamps going back in time
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - i);
        
        // Generate a random value with some smoothing for realistic data
        let value;
        if (i === 0) {
            // First value is completely random
            value = Math.floor(min + Math.random() * (max - min));
        } else {
            // Subsequent values are based on previous value with some variance
            const prevValue = data[i-1].value;
            const variance = (max - min) * 0.05; // 5% variance
            const change = (Math.random() * variance * 2) - variance;
            value = Math.max(min, Math.min(max, prevValue + change));
        }
        
        data.push({
            timestamp: timestamp.toISOString(),
            value: Math.round(value)
        });
    }
    
    // Reverse so newest data comes last
    return data.reverse();
};

module.exports = {
    getLatestSensorData
};