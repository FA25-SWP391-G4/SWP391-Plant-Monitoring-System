import { pool } from  '../config/db.js';

//fetch all sensor data
export const getLastestSensorData = async (req, res) => {
    try {
        const result = await pool.query("SELECT DISTINCT ON (device_id) device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity FROM sensors_data ORDER BY device_id, timestamp DESC");

        res.json({
            ok: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};