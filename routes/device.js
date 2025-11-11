/**
 * ============================================================================
 * DEVICE ROUTES - IOT DEVICE MANAGEMENT
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { getAllDevices } = require('../controllers/deviceController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/devices
router.get('/', authMiddleware, getAllDevices);

module.exports = router;
