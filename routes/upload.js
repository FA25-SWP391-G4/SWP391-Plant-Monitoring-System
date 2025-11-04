/**
 * ============================================================================
 * UPLOAD ROUTES - FILE UPLOAD API ENDPOINTS
 * ============================================================================
 * 
 * API endpoints for file upload management:
 * 
 * AUTHENTICATED ROUTES:
 * - POST   /api/upload/image        - Upload and process image file
 * - DELETE /api/upload/:filename    - Delete uploaded file
 * - GET    /api/upload/info/:filename - Get file information
 * 
 * USAGE EXAMPLES:
 * - Upload plant image: POST /api/upload/image (with FormData containing 'image' file and 'type'='plant')
 * - Delete image: DELETE /api/upload/plant-image-123.jpg
 * - Get file info: GET /api/upload/info/plant-image-123.jpg
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    upload,
    uploadImage,
    deleteImage,
    getImageInfo
} = require('../controllers/uploadController');

// ============================================================================
// AUTHENTICATED ROUTES - Login required
// ============================================================================

/**
 * @route   POST /api/upload/image
 * @desc    Upload and process an image file
 * @access  Private (Authenticated users)
 * @body    FormData with:
 *          - image: File (required, max 5MB, images only)
 *          - type: string (optional, 'plant'|'profile'|'general', default: 'general')
 */
router.post('/image', authMiddleware, upload.single('image'), uploadImage);

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete an uploaded file
 * @access  Private (Authenticated users)
 * @params  filename - Name of the file to delete
 */
router.delete('/:filename', authMiddleware, deleteImage);

/**
 * @route   GET /api/upload/info/:filename
 * @desc    Get information about an uploaded file
 * @access  Private (Authenticated users)
 * @params  filename - Name of the file to get info for
 */
router.get('/info/:filename', authMiddleware, getImageInfo);

module.exports = router;