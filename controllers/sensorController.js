const { pool } = require('../config/db.js');

/**
 * Get the latest sensor data for all devices
 * If user_id is provided, only returns data for devices associated with that user
 */


const getLatestSensorData = async (req, res) => {
    console.log("📡 [getLatestSensorData] called - checking route");
    try {
        // Determine user and SQL query to fetch latest sensor readings (joined with devices/plants when user is authenticated)
        const userId = req.user ? (req.user.user_id || req.user.userId) : null;
        
        let query;
        let params = [];
        
        if (userId) {
    query = `
        WITH cleaned_data AS (
            SELECT 
                TRIM(sd.device_key) AS device_key,
                sd.timestamp,
                sd.soil_moisture AS moisture,
                sd.temperature,
                sd.air_humidity AS humidity,
                sd.light_intensity AS light,
                TRIM(d.device_key) AS dev_key,
                d.device_name,
                p.plant_id,
                p.custom_name AS plant_name,
                p.user_id
            FROM 
                sensors_data sd
            JOIN 
                devices d ON TRIM(sd.device_key) = TRIM(d.device_key)
            LEFT JOIN 
                plants p ON TRIM(d.device_key) = TRIM(p.device_key)
            )
            SELECT DISTINCT ON (device_key)
                device_key, timestamp, moisture, temperature, humidity, light,
                device_name, plant_id, plant_name
            FROM cleaned_data
            WHERE user_id = $1
            ORDER BY device_key, timestamp DESC;
        `;
        params = [userId];
        } else {
            query = `
                WITH cleaned_data AS (
                    SELECT 
                        TRIM(sd.device_key) AS device_key,
                        sd.timestamp,
                        sd.soil_moisture AS moisture,
                        sd.temperature,
                        sd.air_humidity AS humidity,
                        sd.light_intensity AS light,
                        TRIM(d.device_key) AS dev_key,
                        d.device_name
                    FROM 
                        sensors_data sd
                    JOIN 
                        devices d ON TRIM(sd.device_key) = TRIM(d.device_key)
                )
                SELECT DISTINCT ON (device_key)
                    device_key, timestamp, moisture, temperature, humidity, light, device_name
                FROM cleaned_data
                ORDER BY device_key, timestamp DESC;
            `;
        }

        // Execute main query
        const { rows } = await pool.query(query, params);

        console.log("✅ Sensor data query result:", rows);

        // Format the response as an object with device_id as keys
        const formattedData = {};
        rows.forEach(row => {
            formattedData[row.device_key] = {
                device_key: row.device_key,
                device_name: row.device_name,
                plant_id: row.plant_id,
                plant_name: row.plant_name,
                timestamp: row.timestamp,
                moisture: row.moisture,
                temperature: row.temperature,
                humidity: row.humidity,
                light: row.light,
            };
        });
        
        return res.json({ ok: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getLatestSensorData
};