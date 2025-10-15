import db from  '../config/db.js';

//fetch all sensor data
export const getLastestSensorData = async (req, res) => {
    try {
        const query = "SELECT DISTINCT ON (device_id) device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity FROM sensor_data ORDER BY device_id, timestamp DESC";

        const { rows } = await db.query(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};