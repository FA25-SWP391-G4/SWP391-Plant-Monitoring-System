const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// General reports endpoint
router.get('/', reportsController.getReports);

// Historical data endpoints
router.get('/historical-data/:plantId', reportsController.getHistoricalData);

// Water consumption endpoints
router.get('/water-consumption', reportsController.getWaterConsumption);

// Plant health endpoints
router.get('/plant-health', reportsController.getPlantHealth);

// Custom reports endpoints
router.get('/custom', reportsController.getCustomReports);
router.post('/custom', reportsController.createCustomReport);
router.post('/custom/:reportId/run', reportsController.runCustomReport);
router.delete('/custom/:reportId', reportsController.deleteCustomReport);

module.exports = router;