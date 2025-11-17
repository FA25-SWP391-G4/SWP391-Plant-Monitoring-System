const express = require('express');
const { getUserPlants, 
  getPlantById,
  waterPlant,
  getWateringSchedule,
  setWateringSchedule,
  toggleAutoWatering,
  setSensorThresholds,
  createPlant,
  updatePlant,
  deletePlant,
  getWateringHistory,
  getSensorHistory,
  getCurrentSensorData,
  getSensorStats,
  getLastWatered } = require('../controllers/plantController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const db = require('../config/db');
const router = express.Router();

//get all plants 
router.get('/', authMiddleware, getUserPlants);

//create new plant
router.post('/', authMiddleware, createPlant);

//get plant by id
router.get('/:plantId', authMiddleware, (req, res, next) => {
  // Validate plantId parameter
  const { plantId } = req.params;
  if (!plantId || isNaN(plantId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid plant ID format'
    });
  }
  next();
}, getPlantById);

//get plant by user id
router.get('/user/:userId', authMiddleware, (req, res, next) => {
  // Validate userId parameter
  const { userId } = req.params;
  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID format'
    });
  }
  next();
}, getUserPlants);

//water plant
router.post('/:plantId/water', authMiddleware, waterPlant);

//get watering schedule
router.get('/:plantId/schedule', authMiddleware, getWateringSchedule);

//set watering schedule
router.post('/:plantId/schedule', authMiddleware, setWateringSchedule);

//toggle auto watering
router.post('/:plantId/auto-watering', authMiddleware, toggleAutoWatering);

//set sensor thresholds
router.post('/:plantId/thresholds', authMiddleware, setSensorThresholds);

//get watering history
router.get('/:plantId/history/watering', authMiddleware, getWateringHistory);

//get sensor data history
router.get('/:plantId/history/sensors', authMiddleware, getSensorHistory);

//get sensor stats
router.get('/:plantId/stats/sensors', authMiddleware, getSensorStats);

//get last watered info
router.get('/:plantId/last-watered', authMiddleware, getLastWatered);

// Update plant
router.put('/:plantId', authMiddleware, updatePlant);

// Delete plant
router.delete('/:plantId', authMiddleware, deletePlant);

module.exports = router;