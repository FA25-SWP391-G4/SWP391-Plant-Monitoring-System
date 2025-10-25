/**
 * Plant Management Routes
 * Routes for plant management, watering control, and AI integration
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const plantController = require('../controllers/plantController');
const auth = require('../middlewares/authMiddleware');

/**
 * @route POST /api/plants/:plantId/water
 * @desc Manually water a plant
 * @access Private
 */
router.post('/:plantId/water',
  [
    auth,
    param('plantId').isNumeric().withMessage('Plant ID must be a number'),
    body('duration').optional().isInt({ min: 1, max: 300 }).withMessage('Duration must be between 1 and 300 seconds')
  ],
  plantController.waterPlant
);

/**
 * @route GET /api/plants/:plantId/schedule
 * @desc Get watering schedule for a plant
 * @access Private
 */
router.get('/:plantId/schedule',
  [
    auth,
    param('plantId').isNumeric().withMessage('Plant ID must be a number')
  ],
  plantController.getWateringSchedule
);

/**
 * @route POST /api/plants/:plantId/schedule
 * @desc Set watering schedule for a plant
 * @access Private
 */
router.post('/:plantId/schedule',
  [
    auth,
    param('plantId').isNumeric().withMessage('Plant ID must be a number'),
    body('schedule').isArray().withMessage('Schedule must be an array')
  ],
  plantController.setWateringSchedule
);

/**
 * @route PUT /api/plants/:plantId/auto-watering
 * @desc Toggle auto-watering mode for a plant
 * @access Private
 */
router.put('/:plantId/auto-watering',
  [
    auth,
    param('plantId').isNumeric().withMessage('Plant ID must be a number'),
    body('enabled').isBoolean().withMessage('Enabled must be a boolean value')
  ],
  plantController.toggleAutoWatering
);

/**
 * @route PUT /api/plants/:plantId/thresholds
 * @desc Set sensor thresholds for a plant (Premium feature)
 * @access Private (Premium users only)
 */
router.put('/:plantId/thresholds',
  [
    auth,
    param('plantId').isNumeric().withMessage('Plant ID must be a number'),
    body('thresholds').isObject().withMessage('Thresholds must be an object')
  ],
  plantController.setSensorThresholds
);

module.exports = router;