const express = require('express');
<<<<<<< HEAD:routes/sensor.js
const { getLastestSensorData } = require('../controllers/sensorController');
const db = require ('../config/db.js');
=======
const { getLatestSensorData } = require('../controllers/sensorController.js');
const db = require('../config/db.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987:routes/sensors.js
const router = express.Router();

/**
 * @route   GET /api/sensor/latest
 * @desc    Get latest sensor data for all devices
 * @access  Private
 */
router.get('/latest', authMiddleware, getLatestSensorData);


// SELECT * FROM 'plant-system/device/+/data'

router.post('/upload', async (req, res) => {
    try {
        const { device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity } = req.body;

        // Insert sensor data
        await db.query(
            "INSERT INTO sensors_data (device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity) VALUES ($1, NOW(), $3, $4, $5, $6)",
            [device_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity]
        );

        // Trigger AI watering prediction for this device's plant (if exists)
        try {
            const plantResult = await db.query(
                "SELECT plant_id FROM plants WHERE device_id = $1",
                [device_id]
            );

            if (plantResult.rows.length > 0) {
                const plant_id = plantResult.rows[0].plant_id;
                
                // Prepare sensor data for AI prediction
                const sensorData = {
                    moisture: soil_moisture,
                    temperature: temperature,
                    humidity: air_humidity,
                    light: light_intensity
                };

                // Call AI prediction service (async, don't wait for response)
                // Create a system-level JWT token for internal API calls
                const jwt = require('jsonwebtoken');
                const systemToken = jwt.sign(
                    { user_id: 'system', role: 'system' }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: '5m' }
                );

                const axios = require('axios');
                axios.post(`${process.env.BASE_URL || 'http://localhost:3000'}/api/ai/watering-prediction`, {
                    plant_id: plant_id,
                    sensor_data: sensorData
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${systemToken}`
                    },
                    timeout: 5000 // 5 second timeout for non-critical operation
                }).catch(error => {
                    console.log('AI prediction failed (non-critical):', error.message);
                });
            }
        } catch (aiError) {
            // AI integration failure is non-critical for sensor data upload
            console.log('AI integration error (non-critical):', aiError.message);
        }

        res.json({ success: true, message: 'Sensor data uploaded successfully' });
    } catch (error) {
        console.error('Error uploading sensor data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;