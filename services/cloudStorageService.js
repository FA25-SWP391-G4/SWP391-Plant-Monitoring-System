const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Cloud Storage Service for handling image uploads
 * Supports local storage with cloud storage interface for future migration
 */
class CloudStorageService {
    constructor() {
        this.storageType = process.env.STORAGE_TYPE || 'local'; // 'local', 'aws', 'azure', 'gcp'
        this.baseDir = process.env.STORAGE_BASE_DIR || path.join(__dirname, '..', 'storage');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'tiff'];
        
        this.initializeStorage();
    }

    /**
     * Initialize storage directories
     */
    initializeStorage() {
        const directories = [
            path.join(this.baseDir, 'images'),
            path.join(this.baseDir, 'thumbnails'),
            path.join(this.baseDir, 'processed'),
            path.join(this.baseDir, 'temp')
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created storage directory: ${dir}`);
            }
        });
    }

    /**
     * Upload and store image file
     * @param {Object} file - Multer file object
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result with file info
     */
    async uploadImage(file, options = {}) {
        try {
            const { userId, plantId, category = 'analysis' } = options;
            
            // Generate secure filename
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const timestamp = Date.now();
            const randomId = crypto.randomBytes(8).toString('hex');
            const secureFilename = `${category}_${userId}_${timestamp}_${randomId}${fileExtension}`;
            
            // Determine storage path
            const relativePath = path.join('images', secureFilename);
            const fullPath = path.join(this.baseDir, relativePath);
            
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
            }

            // Move file to storage location
            if (file.path) {
                // Move from temp location
                fs.renameSync(file.path, fullPath);
            } else if (file.buffer) {
                // Write buffer to file
                fs.writeFileSync(fullPath, file.buffer);
            } else {
                throw new Error('No file data provided');
            }

            // Generate thumbnail
            const thumbnailPath = await this.generateThumbnail(fullPath, secureFilename);
            
            // Create file record
            const fileRecord = {
                id: randomId,
                originalName: file.originalname,
                filename: secureFilename,
                path: relativePath,
                fullPath: fullPath,
                thumbnailPath: thumbnailPath,
                size: file.size,
                mimeType: file.mimetype,
                userId: userId,
                plantId: plantId,
                category: category,
                uploadedAt: new Date(),
                url: this.getFileUrl(relativePath),
                thumbnailUrl: this.getFileUrl(thumbnailPath)
            };

            console.log(`✅ Image uploaded successfully: ${secureFilename}`);
            return fileRecord;

        } catch (error) {
            console.error('❌ Error uploading image:', error);
            
            // Cleanup on error
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            
            throw error;
        }
    }

    /**
     * Generate thumbnail for uploaded image
     * @param {string} imagePath - Path to original image
     * @param {string} filename - Original filename
     * @returns {Promise<string>} Thumbnail path
     */
    async generateThumbnail(imagePath, filename) {
        try {
            const sharp = require('sharp');
            const thumbnailFilename = `thumb_${filename}`;
            const thumbnailPath = path.join('thumbnails', thumbnailFilename);
            const fullThumbnailPath = path.join(this.baseDir, thumbnailPath);

            await sharp(imagePath)
                .resize(150, 150, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(fullThumbnailPath);

            return thumbnailPath;
        } catch (error) {
            console.warn('⚠️ Failed to generate thumbnail:', error.message);
            return null;
        }
    }

    /**
     * Validate uploaded file
     * @param {Object} file - File object
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
        }

        if (file.size < 1024) {
            warnings.push('File size is very small, may affect analysis quality');
        }

        // Check file extension
        const extension = path.extname(file.originalname).toLowerCase().substring(1);
        if (!this.allowedFormats.includes(extension)) {
            errors.push(`Invalid file format. Allowed: ${this.allowedFormats.join(', ')}`);
        }

        // Check MIME type
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 
            'image/webp', 'image/tiff'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            errors.push(`Invalid MIME type: ${file.mimetype}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Get file URL for serving
     * @param {string} relativePath - Relative file path
     * @returns {string} File URL
     */
    getFileUrl(relativePath) {
        if (!relativePath) return null;
        
        const baseUrl = process.env.STORAGE_BASE_URL || '/storage';
        return `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
    }

    /**
     * Delete file from storage
     * @param {string} filePath - File path to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(filePath) {
        try {
            const fullPath = path.isAbsolute(filePath) ? 
                filePath : 
                path.join(this.baseDir, filePath);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ Deleted file: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error deleting file:', error);
            return false;
        }
    }

    /**
     * Get file information
     * @param {string} filePath - File path
     * @returns {Promise<Object>} File information
     */
    async getFileInfo(filePath) {
        try {
            const fullPath = path.isAbsolute(filePath) ? 
                filePath : 
                path.join(this.baseDir, filePath);

            if (!fs.existsSync(fullPath)) {
                return null;
            }

            const stats = fs.statSync(fullPath);
            return {
                path: filePath,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                exists: true
            };
        } catch (error) {
            console.error('❌ Error getting file info:', error);
            return null;
        }
    }

    /**
     * Clean up old files
     * @param {number} maxAgeMs - Maximum age in milliseconds
     * @returns {Promise<Object>} Cleanup results
     */
    async cleanupOldFiles(maxAgeMs = 24 * 60 * 60 * 1000) {
        try {
            const directories = ['images', 'thumbnails', 'processed', 'temp'];
            let totalDeleted = 0;
            let totalSize = 0;

            for (const dir of directories) {
                const dirPath = path.join(this.baseDir, dir);
                if (!fs.existsSync(dirPath)) continue;

                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    
                    if (Date.now() - stats.mtime.getTime() > maxAgeMs) {
                        totalSize += stats.size;
                        fs.unlinkSync(filePath);
                        totalDeleted++;
                    }
                }
            }

            console.log(`🧹 Cleanup completed: ${totalDeleted} files deleted, ${this.formatBytes(totalSize)} freed`);
            
            return {
                filesDeleted: totalDeleted,
                sizeFreed: totalSize,
                sizeFeedFormatted: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStats() {
        try {
            const directories = ['images', 'thumbnails', 'processed', 'temp'];
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                byDirectory: {}
            };

            for (const dir of directories) {
                const dirPath = path.join(this.baseDir, dir);
                const dirStats = { files: 0, size: 0 };

                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const fileStats = fs.statSync(filePath);
                        dirStats.files++;
                        dirStats.size += fileStats.size;
                    }
                }

                stats.byDirectory[dir] = dirStats;
                stats.totalFiles += dirStats.files;
                stats.totalSize += dirStats.size;
            }

            stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
            return stats;
        } catch (error) {
            console.error('❌ Error getting storage stats:', error);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Migrate to cloud storage (placeholder for future implementation)
     * @param {string} provider - Cloud provider ('aws', 'azure', 'gcp')
     * @returns {Promise<boolean>} Migration success
     */
    async migrateToCloud(provider) {
        console.log(`🚀 Cloud migration to ${provider} - Feature coming soon!`);
        // TODO: Implement cloud storage migration
        return false;
    }
}

// Export singleton instance
module.exports = new CloudStorageService();