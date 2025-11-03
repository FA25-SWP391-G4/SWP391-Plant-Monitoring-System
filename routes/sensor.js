const express = require('express');
const { getLatestSensorData } = require('../controllers/sensorController.js');
const db = require('../config/db.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');
const router = express.Router();

/**
 * @route   GET /api/sensor/latest
 * @desc    Get latest sensor data for all devices
 * @access  Private
 */
router.get('/latest', authMiddleware, getLatestSensorData);

module.exports = router;

// SELECT * FROM 'plant-system/device/+/data'

router.post('/upload', async (req, res) => {
    try {
        const { device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity } = req.body;

        await db.query(
            "INSERT INTO sensors_data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity) VALUES ($1, NOW(), $3, $4, $5, $6)",
            [device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity]
        );

        res.json({ success: true, message: 'Sensor data uploaded successfully' });
    } catch (error) {
        console.error('Error uploading sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
