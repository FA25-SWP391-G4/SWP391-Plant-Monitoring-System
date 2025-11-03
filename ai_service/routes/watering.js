const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wateringController = require('../controllers/wateringController');

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

/**
 * @route POST /api/watering-prediction/predict
 * @desc Predict watering needs using AI
 * @access Private
 */
router.post('/predict',
    [
        verifyToken,
        body('sensor_data').isObject().withMessage('Sensor data is required'),
        body('sensor_data.moisture').isNumeric().withMessage('Moisture level is required'),
        body('sensor_data.temperature').isNumeric().withMessage('Temperature is required'),
        body('sensor_data.humidity').optional().isNumeric(),
        body('sensor_data.light').optional().isNumeric(),
        body('plant_id').optional().isNumeric(),
        body('historical_data').optional().isArray()
    ],
    wateringController.predictWateringNeeds
);

module.exports = router;