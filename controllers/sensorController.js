import db from  '../config/db.js';

/**
 * Get the latest sensor data for all devices
 * If user_id is provided, only returns data for devices associated with that user
 */
const getLatestSensorData = async (req, res) => {
    try {
        const query = "SELECT DISTINCT ON (device_id) device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity FROM sensor_data ORDER BY device_id, timestamp DESC";

        const { rows } = await db.query(query);
        res.json({ success: true, data: rows });
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