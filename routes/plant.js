const express = require('express');
const { getAllPlants, getPlantById, getUserPlants } = require('../controllers/plantController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @route   GET /api/plants
 * @desc    Get all plants for the authenticated user
 * @access  Private
 */
router.get('/', authMiddleware, getUserPlants);

/**
 * @route   GET /api/plants/:id
 * @desc    Get a plant by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, getPlantById);

module.exports = router;