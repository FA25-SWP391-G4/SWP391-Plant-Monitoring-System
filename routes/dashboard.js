const express = require('express');
const {
    getDashboardData, 
    getRealTimeSensorData,
    getDashboardPreferences,
    updateDashboardPreferences
} = require('../controllers/dashboardController');
const router = express.Router();

router.get('/', getDashboardData);                     // UC4: Get dashboard data

router.get('/realtime/:plantId', getRealTimeSensorData);    // UC4: Get real-time sensor data

router.get('/preferences', getDashboardPreferences);       // UC4: Get dashboard preferences

router.put('/preferences', updateDashboardPreferences);    // UC4: Update dashboard preferences


module.exports = router;