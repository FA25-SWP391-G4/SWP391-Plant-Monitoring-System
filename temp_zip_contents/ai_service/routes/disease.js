const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const diseaseController = require('../controllers/diseaseController');

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
 * @route POST /api/disease-recognition/analyze
 * @desc Analyze plant image for disease recognition
 * @access Private
 */
router.post('/analyze',
    verifyToken,
    diseaseController.upload.single('image'),
    [
        body('plant_type').optional().isString()
    ],
    diseaseController.analyzePlantImage
);

module.exports = router;