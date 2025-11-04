/**
 * ============================================================================
 * PLANT PROFILE ROUTES - SPECIES DATABASE API ENDPOINTS
 * ============================================================================
 * 
 * API endpoints for plant species database management:
 * 
 * PUBLIC ROUTES (No authentication required):
 * - GET    /api/plant-profiles              - Browse all plant profiles (paginated)
 * - GET    /api/plant-profiles/:id          - Get specific plant profile by ID
 * - GET    /api/plant-profiles/species/:name - Get plant profile by species name
 * - GET    /api/plant-profiles/search/suggest - Get species name suggestions
 * - GET    /api/plant-profiles/stats        - Get database statistics
 * 
 * ADMIN ROUTES (Authentication + Admin role required):
 * - POST   /api/plant-profiles              - Create new plant profile
 * - PUT    /api/plant-profiles/:id          - Update existing plant profile
 * - DELETE /api/plant-profiles/:id          - Delete plant profile
 * 
 * USAGE EXAMPLES:
 * - Browse plants: GET /api/plant-profiles?page=1&limit=20&search=rose
 * - Filter by moisture: GET /api/plant-profiles?moisture_min=60&moisture_max=80
 * - Search suggestions: GET /api/plant-profiles/search/suggest?q=monstera&limit=5
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    getAllPlantProfiles,
    getPlantProfileById,
    getPlantProfileBySpecies,
    createPlantProfile,
    updatePlantProfile,
    deletePlantProfile,
    getSpeciesSuggestions,
    getPlantProfileStats
} = require('../controllers/plantProfileController');

// ============================================================================
// PUBLIC ROUTES - No authentication required
// ============================================================================

/**
 * @route   GET /api/plant-profiles
 * @desc    Get all plant profiles with pagination, search, and filtering
 * @access  Public
 * @params  
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *   - search: Search in species name and description
 *   - moisture_min: Minimum ideal moisture percentage
 *   - moisture_max: Maximum ideal moisture percentage
 *   - sort: Sort field (species_name, ideal_moisture, profile_id)
 *   - order: Sort order (ASC, DESC)
 */
router.get('/', getAllPlantProfiles);

/**
 * @route   GET /api/plant-profiles/stats
 * @desc    Get plant profile database statistics
 * @access  Public
 * @returns {Object} Statistics including total count, moisture distribution
 */
router.get('/stats', getPlantProfileStats);

/**
 * @route   GET /api/plant-profiles/search/suggest
 * @desc    Get species name suggestions for autocomplete
 * @access  Public
 * @params  
 *   - q: Search query (minimum 2 characters)
 *   - limit: Maximum suggestions to return (default: 10, max: 50)
 */
router.get('/search/suggest', getSpeciesSuggestions);

/**
 * @route   GET /api/plant-profiles/species/:name
 * @desc    Get plant profile by species name (case-insensitive)
 * @access  Public
 * @params  name - Species name (URL encoded if contains spaces)
 * @example GET /api/plant-profiles/species/Monstera%20deliciosa
 */
router.get('/species/:name', getPlantProfileBySpecies);

/**
 * @route   GET /api/plant-profiles/:id
 * @desc    Get specific plant profile by ID
 * @access  Public
 * @params  id - Plant profile ID (integer)
 */
router.get('/:id', getPlantProfileById);

// ============================================================================
// ADMIN ROUTES - Authentication + Admin role required
// ============================================================================

/**
 * @route   POST /api/plant-profiles
 * @desc    Create new plant profile
 * @access  Admin only
 * @body    
 *   - species_name: string (required)
 *   - description: string (optional)
 *   - ideal_moisture: integer 0-100 (optional)
 */
router.post('/', authMiddleware, createPlantProfile);

/**
 * @route   PUT /api/plant-profiles/:id
 * @desc    Update existing plant profile
 * @access  Admin only
 * @params  id - Plant profile ID (integer)
 * @body    
 *   - species_name: string (optional)
 *   - description: string (optional) 
 *   - ideal_moisture: integer 0-100 (optional)
 */
router.put('/:id', authMiddleware, updatePlantProfile);

/**
 * @route   DELETE /api/plant-profiles/:id
 * @desc    Delete plant profile (only if not used by existing plants)
 * @access  Admin only
 * @params  id - Plant profile ID (integer)
 */
router.delete('/:id', authMiddleware, deletePlantProfile);

module.exports = router;