const cron = require('node-cron');
const { logger, AIServiceError } = require('../utils/errorHandler');
const { dataProtectionService } = require('./dataProtectionService');

class DataRetentionService {
  constructor() {
    this.isRunning = false;
    this.scheduledTasks = new Map();
    
    // Default retention policies (in days)
    this.retentionPolicies = {
      chatHistory: parseInt(process.env.CHAT_RETENTION_DAYS) || 90,
      imageAnalysis: parseInt(process.env.IMAGE_RETENTION_DAYS) || 30,
      sensorData: parseInt(process.env.SENSOR_RETENTION_DAYS) || 365,
      errorLogs: parseInt(process.env.ERROR_LOG_RETENTION_DAYS) || 30,
      accessLogs: parseInt(process.env.ACCESS_LOG_RETENTION_DAYS) || 90,
      tempFiles: parseInt(process.env.TEMP_FILES_RETENTION_DAYS) || 1
    };
    
    logger.info('Data Retention Service initialized', {
      retentionPolicies: this.retentionPolicies
    });
  }
  
  // Start the data retention scheduler
  start() {
    if (this.isRunning) {
      logger.warn('Data retention service is already running');
      return;
    }
    
    try {
      // Schedule daily cleanup at 2:00 AM
      const dailyCleanupTask = cron.schedule('0 2 * * *', async () => {
        await this.performDailyCleanup();
      }, {
        scheduled: false,
        timezone: process.env.TIMEZONE || 'UTC'
      });
      
      // Schedule weekly deep cleanup on Sundays at 3:00 AM
      const weeklyCleanupTask = cron.schedule('0 3 * * 0', async () => {
        await this.performWeeklyCleanup();
      }, {
        scheduled: false,
        timezone: process.env.TIMEZONE || 'UTC'
      });
      
      // Schedule monthly audit on the 1st of each month at 4:00 AM
      const monthlyAuditTask = cron.schedule('0 4 1 * *', async () => {
        await this.performMonthlyAudit();
      }, {
        scheduled: false,
        timezone: process.env.TIMEZONE || 'UTC'
      });
      
      // Start all scheduled tasks
      dailyCleanupTask.start();
      weeklyCleanupTask.start();
      monthlyAuditTask.start();
      
      // Store task references
      this.scheduledTasks.set('daily', dailyCleanupTask);
      this.scheduledTasks.set('weekly', weeklyCleanupTask);
      this.scheduledTasks.set('monthly', monthlyAuditTask);
      
      this.isRunning = true;
      
      logger.info('Data retention scheduler started', {
        dailyCleanup: '2:00 AM daily',
        weeklyCleanup: '3:00 AM Sundays',
        monthlyAudit: '4:00 AM 1st of month',
        timezone: process.env.TIMEZONE || 'UTC'
      });
      
      // Perform initial cleanup
      setTimeout(() => {
        this.performDailyCleanup();
      }, 5000); // Wait 5 seconds after startup
      
    } catch (error) {
      logger.error('Failed to start data retention scheduler', { error: error.message });
      throw error;
    }
  }
  
  // Stop the data retention scheduler
  stop() {
    if (!this.isRunning) {
      logger.warn('Data retention service is not running');
      return;
    }
    
    try {
      // Stop all scheduled tasks
      for (const [name, task] of this.scheduledTasks) {
        task.stop();
        logger.info(`Stopped ${name} cleanup task`);
      }
      
      this.scheduledTasks.clear();
      this.isRunning = false;
      
      logger.info('Data retention scheduler stopped');
    } catch (error) {
      logger.error('Failed to stop data retention scheduler', { error: error.message });
      throw error;
    }
  }
  
  // Perform daily cleanup
  async performDailyCleanup() {
    try {
      logger.info('Starting daily data retention cleanup');
      
      const cleanupResults = {
        tempFiles: 0,
        expiredSessions: 0,
        oldLogs: 0,
        totalFreedSpace: 0
      };
      
      // Clean up temporary files
      cleanupResults.tempFiles = await this.cleanupTempFiles();
      
      // Clean up expired sessions
      cleanupResults.expiredSessions = await this.cleanupExpiredSessions();
      
      // Clean up old log files
      cleanupResults.oldLogs = await this.cleanupOldLogs();
      
      // Use data protection service for comprehensive cleanup
      const dataProtectionResults = await dataProtectionService.cleanupExpiredData();
      
      logger.info('Daily data retention cleanup completed', {
        cleanupResults,
        dataProtectionResults,
        completedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        type: 'daily',
        results: cleanupResults,
        dataProtectionResults
      };
      
    } catch (error) {
      logger.error('Daily cleanup failed', { error: error.message });
      throw new AIServiceError('CLEANUP_FAILED', {
        type: 'daily',
        error: error.message
      });
    }
  }
  
  // Perform weekly cleanup
  async performWeeklyCleanup() {
    try {
      logger.info('Starting weekly data retention cleanup');
      
      const cleanupResults = {
        chatHistory: 0,
        imageAnalysis: 0,
        archivedData: 0
      };
      
      // Clean up old chat history
      cleanupResults.chatHistory = await this.cleanupOldChatHistory();
      
      // Clean up old image analysis data
      cleanupResults.imageAnalysis = await this.cleanupOldImageAnalysis();
      
      // Archive old data
      cleanupResults.archivedData = await this.archiveOldData();
      
      logger.info('Weekly data retention cleanup completed', {
        cleanupResults,
        completedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        type: 'weekly',
        results: cleanupResults
      };
      
    } catch (error) {
      logger.error('Weekly cleanup failed', { error: error.message });
      throw new AIServiceError('CLEANUP_FAILED', {
        type: 'weekly',
        error: error.message
      });
    }
  }
  
  // Perform monthly audit
  async performMonthlyAudit() {
    try {
      logger.info('Starting monthly data retention audit');
      
      const auditResults = {
        totalDataSize: 0,
        retentionCompliance: {},
        recommendations: []
      };
      
      // Audit data retention compliance
      auditResults.retentionCompliance = await this.auditRetentionCompliance();
      
      // Calculate total data size
      auditResults.totalDataSize = await this.calculateTotalDataSize();
      
      // Generate recommendations
      auditResults.recommendations = await this.generateRetentionRecommendations();
      
      logger.info('Monthly data retention audit completed', {
        auditResults,
        completedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        type: 'monthly_audit',
        results: auditResults
      };
      
    } catch (error) {
      logger.error('Monthly audit failed', { error: error.message });
      throw new AIServiceError('AUDIT_FAILED', {
        type: 'monthly',
        error: error.message
      });
    }
  }
  
  // Clean up temporary files
  async cleanupTempFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const tempDirs = [
        path.join(process.cwd(), 'uploads', 'temp'),
        path.join(process.cwd(), 'temp'),
        path.join(process.cwd(), 'cache')
      ];
      
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.tempFiles);
      
      for (const tempDir of tempDirs) {
        try {
          const files = await fs.readdir(tempDir);
          
          for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
              logger.debug('Temporary file deleted', { file: filePath });
            }
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            logger.warn('Error cleaning temp directory', { 
              directory: tempDir, 
              error: error.message 
            });
          }
        }
      }
      
      logger.info('Temporary files cleanup completed', {
        deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });
      
      return deletedCount;
    } catch (error) {
      logger.error('Temporary files cleanup failed', { error: error.message });
      return 0;
    }
  }
  
  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      // This would typically involve database cleanup
      // For now, we'll simulate the cleanup
      
      const expiredSessionsCount = 0; // Placeholder
      
      logger.info('Expired sessions cleanup completed', {
        deletedCount: expiredSessionsCount
      });
      
      return expiredSessionsCount;
    } catch (error) {
      logger.error('Expired sessions cleanup failed', { error: error.message });
      return 0;
    }
  }
  
  // Clean up old log files
  async cleanupOldLogs() {
    try {
      return await dataProtectionService.cleanupExpiredLogs();
    } catch (error) {
      logger.error('Old logs cleanup failed', { error: error.message });
      return 0;
    }
  }
  
  // Clean up old chat history
  async cleanupOldChatHistory() {
    try {
      // This would involve database operations
      // For now, we'll log the operation
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.chatHistory);
      
      logger.info('Chat history cleanup would be performed', {
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: this.retentionPolicies.chatHistory
      });
      
      return 0; // Placeholder
    } catch (error) {
      logger.error('Chat history cleanup failed', { error: error.message });
      return 0;
    }
  }
  
  // Clean up old image analysis data
  async cleanupOldImageAnalysis() {
    try {
      return await dataProtectionService.cleanupExpiredImages();
    } catch (error) {
      logger.error('Image analysis cleanup failed', { error: error.message });
      return 0;
    }
  }
  
  // Archive old data
  async archiveOldData() {
    try {
      // This would involve moving old data to archive storage
      // For now, we'll log the operation
      
      logger.info('Data archiving would be performed');
      
      return 0; // Placeholder
    } catch (error) {
      logger.error('Data archiving failed', { error: error.message });
      return 0;
    }
  }
  
  // Audit retention compliance
  async auditRetentionCompliance() {
    try {
      const compliance = {};
      
      for (const [dataType, retentionDays] of Object.entries(this.retentionPolicies)) {
        compliance[dataType] = {
          retentionDays,
          compliant: true, // Placeholder
          lastCleanup: new Date().toISOString(),
          nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      }
      
      return compliance;
    } catch (error) {
      logger.error('Retention compliance audit failed', { error: error.message });
      return {};
    }
  }
  
  // Calculate total data size
  async calculateTotalDataSize() {
    try {
      // This would calculate actual data sizes
      // For now, we'll return a placeholder
      
      return {
        totalBytes: 0,
        totalMB: 0,
        breakdown: {
          chatHistory: 0,
          imageAnalysis: 0,
          sensorData: 0,
          logs: 0
        }
      };
    } catch (error) {
      logger.error('Data size calculation failed', { error: error.message });
      return { totalBytes: 0, totalMB: 0, breakdown: {} };
    }
  }
  
  // Generate retention recommendations
  async generateRetentionRecommendations() {
    try {
      const recommendations = [];
      
      // Check if retention periods are too long
      if (this.retentionPolicies.chatHistory > 365) {
        recommendations.push({
          type: 'retention_period',
          dataType: 'chatHistory',
          current: this.retentionPolicies.chatHistory,
          recommended: 90,
          reason: 'Chat history retention period is longer than recommended for privacy compliance'
        });
      }
      
      if (this.retentionPolicies.imageAnalysis > 90) {
        recommendations.push({
          type: 'retention_period',
          dataType: 'imageAnalysis',
          current: this.retentionPolicies.imageAnalysis,
          recommended: 30,
          reason: 'Image analysis data retention period is longer than necessary'
        });
      }
      
      return recommendations;
    } catch (error) {
      logger.error('Retention recommendations generation failed', { error: error.message });
      return [];
    }
  }
  
  // Manual cleanup trigger
  async performManualCleanup(cleanupType = 'daily') {
    try {
      logger.info('Manual cleanup triggered', { cleanupType });
      
      let result;
      switch (cleanupType) {
        case 'daily':
          result = await this.performDailyCleanup();
          break;
        case 'weekly':
          result = await this.performWeeklyCleanup();
          break;
        case 'monthly':
          result = await this.performMonthlyAudit();
          break;
        default:
          throw new AIServiceError('INVALID_CLEANUP_TYPE', {
            cleanupType,
            supportedTypes: ['daily', 'weekly', 'monthly']
          });
      }
      
      return result;
    } catch (error) {
      logger.error('Manual cleanup failed', { 
        cleanupType, 
        error: error.message 
      });
      throw error;
    }
  }
  
  // Get retention status
  getRetentionStatus() {
    return {
      isRunning: this.isRunning,
      retentionPolicies: this.retentionPolicies,
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      nextCleanup: {
        daily: '2:00 AM daily',
        weekly: '3:00 AM Sundays',
        monthly: '4:00 AM 1st of month'
      }
    };
  }
}

// Singleton instance
const dataRetentionService = new DataRetentionService();

module.exports = {
  DataRetentionService,
  dataRetentionService
};