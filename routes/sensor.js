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

/**
 * @route   GET /api/sensor/history
 * @desc    Get historical sensor data with pagination and filtering
 * @access  Private
 */
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            page = 1,
            limit = 50,
            device_id,
            start_date,
            end_date,
            sensor_type
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['p.user_id = $1'];
        let params = [userId];
        let paramIndex = 2;

        // Add device filter if specified
        if (device_id) {
            whereConditions.push(`sd.device_id = $${paramIndex}`);
            params.push(device_id);
            paramIndex++;
        }

        // Add date range filters
        if (start_date) {
            whereConditions.push(`sd.timestamp >= $${paramIndex}`);
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereConditions.push(`sd.timestamp <= $${paramIndex}`);
            params.push(end_date);
            paramIndex++;
        }

        // Add sensor type filter
        if (sensor_type) {
            whereConditions.push(`d.sensor_type = $${paramIndex}`);
            params.push(sensor_type);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Query for historical data
        const dataQuery = `
            SELECT 
                sd.data_id,
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
                ${whereClause}
            ORDER BY 
                sd.timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(parseInt(limit), offset);

        // Query for total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM 
                "SensorData" sd
            JOIN 
                "Device" d ON sd.device_id = d.device_id
            LEFT JOIN 
                "Plant" p ON d.device_id = p.device_id
            WHERE 
                ${whereClause}
        `;

        const [dataResult, countResult] = await Promise.all([
            db.query(dataQuery, params),
            db.query(countQuery, params.slice(0, paramIndex - 2))
        ]);

        const totalRecords = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalRecords / limit);

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching sensor history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sensor history',
            error: error.message 
        });
    }
});

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
