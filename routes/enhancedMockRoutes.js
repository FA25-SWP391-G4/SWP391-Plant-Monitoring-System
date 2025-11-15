/**
 * Enhanced Mock Routes
 * 
 * API routes for accessing enhanced mock device data
 */

const express = require('express');
const router = express.Router();
const enhancedMockController = require('../controllers/enhancedMockController');

// GET mock device data
router.get('/device', enhancedMockController.getMockDeviceData);

// GET mock watering event
router.get('/watering', enhancedMockController.getMockWateringEvent);

// GET mock alarm event
router.get('/alarm', enhancedMockController.getMockAlarmEvent);

module.exports = router;