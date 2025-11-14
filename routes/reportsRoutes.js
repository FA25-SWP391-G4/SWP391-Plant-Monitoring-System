const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// General reports endpoint
//router.get('/', reportController.getReports);

// Historical data endpoints
//router.get('/historical-data/:plantId', reportController.getHistoricalData);

// Water consumption endpoints
//router.get('/water-consumption', reportController.getWaterConsumption);

// Plant health endpoints
//router.get('/plant-health', reportController.getPlantHealth);

// Custom reports endpoints
//router.get('/custom', reportController.getCustomReports);
//router.post('/custom', reportController.createCustomReport);
//router.post('/custom/:reportId/run', reportController.runCustomReport);
//router.delete('/custom/:reportId', reportController.deleteCustomReport);

module.exports = router;