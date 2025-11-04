const express = require('express');
const { getUserPlants, 
  getPlantById,
  waterPlant,
  getWateringSchedule,
  setWateringSchedule,
  toggleAutoWatering,
  setSensorThresholds } = require('../controllers/plantController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const db = require('../config/db');
const router = express.Router();

//get all plants 
router.get('/', authMiddleware, getUserPlants);

//get plant by id
router.get('/:id', authMiddleware, getPlantById);

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


module.exports = router;