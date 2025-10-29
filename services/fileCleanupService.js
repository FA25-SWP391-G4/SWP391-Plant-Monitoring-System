const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

/**
 * File cleanup service for managing uploaded images
 */
class FileCleanupService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
        this.maxFileAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.cleanupInterval = '0 2 * * *'; // Run at 2 AM daily
        
        this.startCleanupScheduler();
    }

    /**
     * Start the automatic cleanup scheduler
     */
    startCleanupScheduler() {
        console.log('🧹 Starting file cleanup scheduler...');
        
        cron.schedule(this.cleanupInterval, () => {
            console.log('🧹 Running scheduled file cleanup...');
            this.cleanupOldFiles();
        });
    }

    /**
     * Clean up files older than maxFileAge
     */
    async cleanupOldFiles() {
        try {
            if (!fs.existsSync(this.uploadsDir)) {
                console.log('📁 Uploads directory does not exist');
                return;
            }

            const files = fs.readdirSync(this.uploadsDir);
            let deletedCount = 0;
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                
                try {
                    const stats = fs.statSync(filePath);
                    const fileAge = Date.now() - stats.mtime.getTime();
                    
                    if (fileAge > this.maxFileAge) {
                        totalSize += stats.size;
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        console.log(`🗑️ Deleted old file: ${file}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing file ${file}:`, error.message);
                }
            }

            console.log(`✅ Cleanup completed: ${deletedCount} files deleted, ${this.formatBytes(totalSize)} freed`);
            
            // Log cleanup statistics
            const SystemLog = require('../models/SystemLog');
            await SystemLog.create({
                log_level: 'INFO',
                source: 'FileCleanupService',
                message: `Cleanup completed: ${deletedCount} files deleted, ${this.formatBytes(totalSize)} freed`
            });

        } catch (error) {
            console.error('❌ Error during file cleanup:', error);
            
            // Log cleanup error
            try {
                const SystemLog = require('../models/SystemLog');
                await SystemLog.create({
                    log_level: 'ERROR',
                    source: 'FileCleanupService',
                    message: `Cleanup failed: ${error.message}`
                });
            } catch (logError) {
                console.error('Failed to log cleanup error:', logError);
            }
        }
    }

    /**
     * Clean up specific file after processing
     */
    async scheduleFileCleanup(filePath, delayMs = 60000) {
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Cleaned up processed file: ${path.basename(filePath)}`);
                }
            } catch (error) {
                console.error(`❌ Error cleaning up file ${filePath}:`, error.message);
            }
        }, delayMs);
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            if (!fs.existsSync(this.uploadsDir)) {
                return {
                    totalFiles: 0,
                    totalSize: 0,
                    oldFiles: 0,
                    oldFilesSize: 0
                };
            }

            const files = fs.readdirSync(this.uploadsDir);
            let totalSize = 0;
            let oldFiles = 0;
            let oldFilesSize = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                
                try {
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    
                    const fileAge = Date.now() - stats.mtime.getTime();
                    if (fileAge > this.maxFileAge) {
                        oldFiles++;
                        oldFilesSize += stats.size;
                    }
                } catch (error) {
                    console.error(`Error getting stats for ${file}:`, error.message);
                }
            }

            return {
                totalFiles: files.length,
                totalSize: totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                oldFiles: oldFiles,
                oldFilesSize: oldFilesSize,
                oldFilesSizeFormatted: this.formatBytes(oldFilesSize)
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Manual cleanup trigger
     */
    async triggerManualCleanup() {
        console.log('🧹 Manual cleanup triggered...');
        await this.cleanupOldFiles();
    }

    /**
     * Emergency cleanup - remove all files
     */
    async emergencyCleanup() {
        try {
            console.log('🚨 Emergency cleanup initiated...');
            
            if (!fs.existsSync(this.uploadsDir)) {
                console.log('📁 Uploads directory does not exist');
                return;
            }

            const files = fs.readdirSync(this.uploadsDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (error) {
                    console.error(`Error deleting ${file}:`, error.message);
                }
            }

            console.log(`🚨 Emergency cleanup completed: ${deletedCount} files deleted`);
            
        } catch (error) {
            console.error('❌ Emergency cleanup failed:', error);
        }
    }
}

// Export singleton instance
module.exports = new FileCleanupService();