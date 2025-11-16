/**
 * ============================================================================
 * UPLOAD CONTROLLER - FILE UPLOAD MANAGEMENT
 * ============================================================================
 * 
 * This controller handles file uploads for the plant monitoring system:
 * - Plant images
 * - User profile pictures
 * - Document uploads (if needed)
 * 
 * IMPLEMENTATION NOTES:
 * - File validation (type, size)
 * - Image processing and optimization
 * - Secure file storage
 * - URL generation for uploaded files
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const SystemLog = require('../models/SystemLog');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../client/public/images');
const ensureUploadsDir = async () => {
    try {
        await fs.access(uploadsDir);
    } catch (error) {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
};

// Initialize uploads directory
ensureUploadsDir();

// Configure multer for memory storage (we'll process before saving)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

/**
 * Process and optimize image
 */
const processImage = async (buffer, options = {}) => {
    const {
        width = 800,
        height = 600,
        quality = 85,
        format = 'jpeg'
    } = options;

    try {
        return await sharp(buffer)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality })
            .toBuffer();
    } catch (error) {
        throw new Error('Failed to process image');
    }
};

/**
 * POST /api/upload/image
 * Upload and process an image file
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        const { type = 'general' } = req.body;
        const file = req.file;

        // Generate unique filename
        const fileExtension = '.jpg'; // Always convert to JPEG
        const fileName = `${type}_${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Process image based on type
        let processOptions = {};
        switch (type) {
            case 'plant':
                processOptions = { width: 800, height: 600, quality: 85 };
                break;
            case 'profile':
                processOptions = { width: 300, height: 300, quality: 90 };
                break;
            default:
                processOptions = { width: 800, height: 600, quality: 85 };
        }

        // Process and save image
        const processedBuffer = await processImage(file.buffer, processOptions);
        await fs.writeFile(filePath, processedBuffer);

        // Generate URL for accessing the image
        const imageUrl = `/images/${fileName}`;

        await SystemLog.info('UploadController', 'uploadImage', 
            `Image uploaded successfully: ${fileName} (${file.originalname}, ${(processedBuffer.length / 1024).toFixed(2)}KB)`);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                filename: fileName,
                original_name: file.originalname,
                size: processedBuffer.length,
                type: type
            }
        });

    } catch (error) {
        await SystemLog.error('UploadController', 'uploadImage', error.message);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum size is 5MB.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to upload image'
        });
    }
};

/**
 * DELETE /api/upload/:filename
 * Delete an uploaded file
 */
const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename (security check)
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        const filePath = path.join(uploadsDir, filename);

        try {
            await fs.access(filePath);
            await fs.unlink(filePath);

            await SystemLog.info('UploadController', 'deleteImage', 
                `Image deleted successfully: ${filename}`);

            res.json({
                success: true,
                message: 'Image deleted successfully'
            });

        } catch (fileError) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

    } catch (error) {
        await SystemLog.error('UploadController', 'deleteImage', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to delete image'
        });
    }
};

/**
 * GET /api/upload/info/:filename
 * Get information about an uploaded file
 */
const getImageInfo = async (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        const filePath = path.join(uploadsDir, filename);

        try {
            const stats = await fs.stat(filePath);
            
            res.json({
                success: true,
                data: {
                    filename: filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    url: `/uploads/${filename}`
                }
            });

        } catch (fileError) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

    } catch (error) {
        await SystemLog.error('UploadController', 'getImageInfo', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get image information'
        });
    }
};

module.exports = {
    upload,
    uploadImage,
    deleteImage,
    getImageInfo
};