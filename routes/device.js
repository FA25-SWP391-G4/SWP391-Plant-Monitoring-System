/**
 * ============================================================================
 * DEVICE ROUTES - IOT DEVICE MANAGEMENT
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/devices
router.get('/', authMiddleware, deviceController.getAllDevices);
// GET /api/devices/:deviceId
router.put('/:deviceId', authMiddleware, deviceController.updateDevice);

module.exports = router;
