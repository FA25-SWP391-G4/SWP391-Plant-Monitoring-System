/**
 * Mock Dashboard Routes
 * 
 * These routes serve mock data for the dashboard during development.
 * They use the dynamic mock controller which simulates real data changes over time.
 * 
 * These routes will work with or without authentication, defaulting to user ID 11
 * when no authenticated user is present.
 */

const express = require('express');
const router = express.Router();
const dashboardMockController = require('../controllers/dashboardMockController');
const authMiddleware = require('../middlewares/authMiddleware');

// Custom middleware to handle both authenticated and unauthenticated requests
// This allows the mock routes to work even without login
const optionalAuth = (req, res, next) => {
  try {
    authMiddleware(req, res, next);
  } catch (error) {
    // If auth fails, continue anyway
    console.log('Mock route accessed without authentication, using default user ID 11');
    req.user = { id: 11 };
    next();
  }
};

// Apply optional authentication middleware to all routes
router.use(optionalAuth);

// Dashboard overview endpoint - returns all data needed for the dashboard
router.get('/overview', dashboardMockController.getDashboardOverview);

// Sensor data endpoint - returns sensor readings for plants
router.get('/sensors', dashboardMockController.getSensorData);

// Watering history endpoint - returns watering events
router.get('/watering-history', dashboardMockController.getWateringHistory);

// Activities endpoint - returns user activities
router.get('/activities', dashboardMockController.getRecentActivities);

// Weather data endpoint - returns mock weather data
router.get('/weather', dashboardMockController.getWeatherData);

// Water plant endpoint - simulates watering a plant
router.post('/water/:plantId', dashboardMockController.waterPlant);

// Health history endpoint - returns detailed plant health history
router.get('/plant-health', dashboardMockController.getPlantHealthHistory);

// Realtime device data endpoint - returns latest data from enhanced device mock
router.get('/realtime-data', dashboardMockController.getRealtimeDeviceData);

module.exports = router;