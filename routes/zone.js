/**
 * ============================================================================
 * ZONE ROUTES - PLANT ORGANIZATION API ENDPOINTS
 * ============================================================================
 * 
 * API endpoints for managing plant zones (Premium/Ultimate feature):
 * 
 * PROTECTED ROUTES (Authentication + Premium/Ultimate required):
 * - GET    /api/zones                    - List all user zones
 * - POST   /api/zones                    - Create new zone  
 * - GET    /api/zones/:id                - Get zone details with plants
 * - PUT    /api/zones/:id                - Update zone information
 * - DELETE /api/zones/:id                - Delete zone (unassigns plants)
 * - POST   /api/zones/:id/plants/:plantId - Assign plant to zone
 * 
 * USAGE EXAMPLES:
 * - Create zone: POST /api/zones {"zone_name": "Living Room", "description": "Indoor plants"}
 * - Assign plant: POST /api/zones/1/plants/5
 * - List zones: GET /api/zones
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ZoneController = require('../controllers/zoneController');

// Apply authentication middleware to all zone routes
router.use(authMiddleware);

// ============================================================================
// ZONE MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/zones
 * @desc    Get all zones for authenticated user
 * @access  Private (Premium/Ultimate)
 */
router.get('/', ZoneController.getAllZones);

/**
 * @route   POST /api/zones
 * @desc    Create a new zone
 * @access  Private (Premium/Ultimate)
 * @body    { zone_name: string, description?: string }
 */
router.post('/', ZoneController.createZone);

/**
 * @route   GET /api/zones/:id
 * @desc    Get specific zone details with plants
 * @access  Private (Premium/Ultimate)
 */
router.get('/:id', ZoneController.getZoneById);

/**
 * @route   PUT /api/zones/:id
 * @desc    Update zone information
 * @access  Private (Premium/Ultimate)
 * @body    { zone_name?: string, description?: string }
 */
router.put('/:id', ZoneController.updateZone);

/**
 * @route   DELETE /api/zones/:id
 * @desc    Delete zone (plants will be unassigned)
 * @access  Private (Premium/Ultimate)
 */
router.delete('/:id', ZoneController.deleteZone);

/**
 * @route   POST /api/zones/:id/plants/:plantId
 * @desc    Assign a plant to a zone
 * @access  Private (Premium/Ultimate)
 */
router.post('/:id/plants/:plantId', ZoneController.assignPlantToZone);

module.exports = router;