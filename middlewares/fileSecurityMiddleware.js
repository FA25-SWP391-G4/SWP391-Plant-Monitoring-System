const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Enhanced file security middleware for image uploads
 */
class FileSecurityMiddleware {
    constructor() {
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp',
            'image/tiff'
        ];
        
        this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.minFileSize = 1024; // 1KB minimum
    }

    /**
     * Validate file upload with enhanced security checks
     */
    validateFileUpload = (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const file = req.file;
            const errors = [];
            const warnings = [];

            // 1. File size validation
            if (file.size > this.maxFileSize) {
                errors.push(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
            }
            
            if (file.size < this.minFileSize) {
                errors.push(`File size too small (minimum ${this.minFileSize} bytes)`);
            }

            // 2. MIME type validation
            if (!this.allowedMimeTypes.includes(file.mimetype)) {
                errors.push(`Invalid file type: ${file.mimetype}. Allowed: ${this.allowedMimeTypes.join(', ')}`);
            }

            // 3. File extension validation
            const fileExtension = path.extname(file.originalname).toLowerCase();
            if (!this.allowedExtensions.includes(fileExtension)) {
                errors.push(`Invalid file extension: ${fileExtension}. Allowed: ${this.allowedExtensions.join(', ')}`);
            }

            // 4. Filename security check
            const sanitizedName = this.sanitizeFilename(file.originalname);
            if (sanitizedName !== file.originalname) {
                warnings.push('Filename contains potentially unsafe characters');
                file.originalname = sanitizedName;
            }

            // 5. File header validation (magic bytes)
            const isValidImage = this.validateImageHeader(file.path);
            if (!isValidImage) {
                errors.push('File header does not match image format');
            }

            // 6. Check for executable content
            if (this.containsExecutableContent(file.path)) {
                errors.push('File contains potentially malicious content');
            }

            if (errors.length > 0) {
                // Clean up uploaded file
                this.cleanupFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: 'File validation failed',
                    errors: errors,
                    warnings: warnings
                });
            }

            // Add validation results to request
            req.fileValidation = {
                isValid: true,
                warnings: warnings,
                sanitizedFilename: sanitizedName
            };

            next();
        } catch (error) {
            console.error('File validation error:', error);
            if (req.file && req.file.path) {
                this.cleanupFile(req.file.path);
            }
            return res.status(500).json({
                success: false,
                message: 'File validation failed',
                error: error.message
            });
        }
    };

    /**
     * Sanitize filename to prevent path traversal
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars
            .replace(/\.{2,}/g, '.') // Remove multiple dots
            .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
            .substring(0, 255); // Limit length
    }

    /**
     * Validate image file header (magic bytes)
     */
    validateImageHeader(filePath) {
        try {
            // Handle both file path and buffer
            let buffer;
            
            if (Buffer.isBuffer(filePath)) {
                buffer = filePath.slice(0, 10);
            } else if (typeof filePath === 'string') {
                if (!fs.existsSync(filePath)) {
                    console.warn('File does not exist for validation:', filePath);
                    return false;
                }
                buffer = fs.readFileSync(filePath, { start: 0, end: 10 });
            } else {
                console.warn('Invalid input for image header validation');
                return false;
            }
            
            // Check magic bytes for common image formats
            const magicBytes = {
                jpeg: [0xFF, 0xD8, 0xFF],
                png: [0x89, 0x50, 0x4E, 0x47],
                webp: [0x52, 0x49, 0x46, 0x46], // RIFF
                gif: [0x47, 0x49, 0x46],
                bmp: [0x42, 0x4D],
                tiff_le: [0x49, 0x49, 0x2A, 0x00], // Little endian
                tiff_be: [0x4D, 0x4D, 0x00, 0x2A]  // Big endian
            };

            for (const [format, bytes] of Object.entries(magicBytes)) {
                if (this.matchesBytes(buffer, bytes)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error validating image header:', error);
            return false;
        }
    }

    /**
     * Check if buffer matches expected bytes
     */
    matchesBytes(buffer, expectedBytes) {
        for (let i = 0; i < expectedBytes.length; i++) {
            if (buffer[i] !== expectedBytes[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check for potentially malicious content
     */
    containsExecutableContent(filePath) {
        try {
            const buffer = fs.readFileSync(filePath);
            const content = buffer.toString('ascii', 0, Math.min(1024, buffer.length));
            
            // Check for common executable signatures
            const maliciousPatterns = [
                'MZ', // PE executable
                '#!/', // Shell script
                '<?php', // PHP code
                '<script', // JavaScript
                'eval(', // Code evaluation
                'exec(', // Code execution
            ];

            return maliciousPatterns.some(pattern => 
                content.toLowerCase().includes(pattern.toLowerCase())
            );
        } catch (error) {
            console.error('Error checking executable content:', error);
            return true; // Err on the side of caution
        }
    }

    /**
     * Clean up uploaded file
     */
    cleanupFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    }

    /**
     * Generate secure filename
     */
    generateSecureFilename(originalName) {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalName).toLowerCase();
        
        return `plant-image-${timestamp}-${randomBytes}${extension}`;
    }
}

module.exports = new FileSecurityMiddleware();