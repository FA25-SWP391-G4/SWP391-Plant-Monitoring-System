const aiDatabaseHelpers = require('../database/aiDatabaseHelpers');
const imageStorageService = require('./imageStorageService');

/**
 * Analysis Logging Service
 * Handles comprehensive logging of disease detection analyses
 */
class AnalysisLoggingService {
  constructor() {
    this.logLevels = {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      SUCCESS: 'success'
    };
  }

  /**
   * Log disease detection analysis
   */
  async logDiseaseAnalysis(analysisData) {
    try {
      const {
        plantId,
        userId,
        imageFile,
        analysisResult,
        validationResult,
        processingTime,
        modelVersion = '1.0',
        confidence,
        errors = []
      } = analysisData;

      // Store image if provided
      let imageStorageResult = null;
      if (imageFile && imageFile.buffer) {
        try {
          imageStorageResult = await imageStorageService.storeImage(imageFile.buffer, {
            originalName: imageFile.originalname,
            userId,
            plantId,
            mimeType: imageFile.mimetype
          });
        } catch (storageError) {
          console.error('Error storing image during analysis logging:', storageError);
          errors.push('Image storage failed');
        }
      }

      // Prepare analysis data for database
      const dbAnalysisData = {
        plantId,
        userId,
        analysisType: 'disease_detection',
        inputData: {
          imageInfo: imageFile ? {
            originalName: imageFile.originalname,
            size: imageFile.size,
            mimeType: imageFile.mimetype,
            storedFilename: imageStorageResult?.filename || null
          } : null,
          validationResult,
          processingTime,
          modelVersion
        },
        resultData: {
          ...analysisResult,
          imageStorageInfo: imageStorageResult ? {
            filename: imageStorageResult.filename,
            thumbnailFilename: imageStorageResult.thumbnailFilename
          } : null
        },
        confidenceScore: confidence || analysisResult?.confidence || 0
      };

      // Save to database
      const analysisId = await aiDatabaseHelpers.saveAnalysis(dbAnalysisData);

      // Update image storage with analysis ID
      if (imageStorageResult && analysisId) {
        try {
          // This would update the metadata file with the analysis ID
          // Implementation depends on how imageStorageService handles metadata updates
        } catch (updateError) {
          console.warn('Could not update image metadata with analysis ID:', updateError);
        }
      }

      // Log the analysis event
      await this.logEvent({
        level: errors.length > 0 ? this.logLevels.WARNING : this.logLevels.SUCCESS,
        category: 'disease_analysis',
        message: `Disease analysis completed for plant ${plantId}`,
        data: {
          analysisId,
          plantId,
          userId,
          confidence,
          primaryDisease: analysisResult?.primaryDisease?.diseaseKey || 'unknown',
          processingTime,
          hasErrors: errors.length > 0,
          errorCount: errors.length
        }
      });

      return {
        success: true,
        analysisId,
        imageStorageResult,
        loggedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error logging disease analysis:', error);
      
      // Log the error
      await this.logEvent({
        level: this.logLevels.ERROR,
        category: 'disease_analysis_error',
        message: 'Failed to log disease analysis',
        data: {
          error: error.message,
          plantId: analysisData.plantId,
          userId: analysisData.userId
        }
      });

      throw new Error('Không thể ghi log phân tích bệnh cây');
    }
  }

  /**
   * Log user feedback
   */
  async logUserFeedback(feedbackData) {
    try {
      const {
        analysisId,
        userId,
        feedbackType,
        userComment,
        actualResult,
        accuracy
      } = feedbackData;

      // Save feedback to database
      const feedbackId = await aiDatabaseHelpers.saveFeedback({
        analysisId,
        userId,
        feedbackType,
        userComment,
        actualResult
      });

      // Log the feedback event
      await this.logEvent({
        level: this.logLevels.INFO,
        category: 'user_feedback',
        message: `User feedback received for analysis ${analysisId}`,
        data: {
          feedbackId,
          analysisId,
          userId,
          feedbackType,
          hasComment: !!userComment,
          hasActualResult: !!actualResult,
          accuracy
        }
      });

      return {
        success: true,
        feedbackId,
        loggedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error logging user feedback:', error);
      
      await this.logEvent({
        level: this.logLevels.ERROR,
        category: 'feedback_error',
        message: 'Failed to log user feedback',
        data: {
          error: error.message,
          analysisId: feedbackData.analysisId,
          userId: feedbackData.userId
        }
      });

      throw new Error('Không thể ghi log feedback người dùng');
    }
  }

  /**
   * Log system events
   */
  async logEvent(eventData) {
    try {
      const {
        level = this.logLevels.INFO,
        category,
        message,
        data = {},
        timestamp = new Date().toISOString()
      } = eventData;

      // Create comprehensive log entry
      const logEntry = {
        timestamp,
        level,
        category,
        message,
        data: {
          ...data,
          systemInfo: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version
          }
        }
      };

      // Log to console (in production, this would go to a proper logging system)
      console.log(`[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`, 
                  JSON.stringify(data, null, 2));

      // In a production system, you would also:
      // - Send to logging service (Winston, ELK stack, etc.)
      // - Store in database for analytics
      // - Send alerts for ERROR level events
      // - Aggregate metrics for monitoring

      return {
        success: true,
        logEntry
      };

    } catch (error) {
      console.error('Error logging event:', error);
      // Don't throw here to avoid infinite loops
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get analysis history with detailed logs
   */
  async getAnalysisHistory(filters = {}) {
    try {
      const {
        plantId,
        userId,
        analysisType = 'disease_detection',
        limit = 20,
        offset = 0,
        includeImages = false
      } = filters;

      // Get analysis history from database
      const history = await aiDatabaseHelpers.getAnalysisHistory({
        plantId,
        userId,
        analysisType,
        limit,
        offset
      });

      // Enhance with image information if requested
      if (includeImages) {
        for (const analysis of history) {
          if (analysis.result_data?.imageStorageInfo?.filename) {
            try {
              // Get thumbnail for quick preview
              const imageData = await imageStorageService.retrieveImage(
                analysis.result_data.imageStorageInfo.filename,
                true // get thumbnail
              );
              
              analysis.thumbnailData = {
                buffer: imageData.buffer.toString('base64'),
                mimeType: imageData.mimeType
              };
            } catch (imageError) {
              console.warn(`Could not retrieve thumbnail for analysis ${analysis.id}:`, imageError.message);
            }
          }
        }
      }

      return {
        success: true,
        history,
        pagination: {
          limit,
          offset,
          total: history.length
        }
      };

    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw new Error('Không thể lấy lịch sử phân tích');
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStatistics(timeRange = '30d') {
    try {
      // This would typically query the database for feedback statistics
      // For now, return mock data structure
      
      const stats = {
        timeRange,
        totalFeedback: 0,
        feedbackTypes: {
          correct: 0,
          incorrect: 0,
          partially_correct: 0
        },
        averageAccuracy: 0,
        topIssues: [],
        improvementSuggestions: []
      };

      // In a real implementation, you would:
      // 1. Query feedback from database within time range
      // 2. Calculate accuracy metrics
      // 3. Identify common issues
      // 4. Generate improvement suggestions

      await this.logEvent({
        level: this.logLevels.INFO,
        category: 'feedback_statistics',
        message: `Feedback statistics requested for ${timeRange}`,
        data: { timeRange, statsGenerated: true }
      });

      return {
        success: true,
        statistics: stats,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      throw new Error('Không thể lấy thống kê feedback');
    }
  }

  /**
   * Clean up old logs (data retention)
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // This would clean up old analysis records and associated images
      // Implementation depends on database structure and retention policies

      await this.logEvent({
        level: this.logLevels.INFO,
        category: 'log_cleanup',
        message: `Log cleanup initiated for data older than ${retentionDays} days`,
        data: { 
          cutoffDate: cutoffDate.toISOString(),
          retentionDays 
        }
      });

      // Clean up old images
      const imageCleanupResult = await imageStorageService.cleanupOldImages(retentionDays);

      return {
        success: true,
        imageCleanup: imageCleanupResult,
        cleanedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      throw new Error('Không thể dọn dẹp log cũ');
    }
  }

  /**
   * Export analysis data for research/improvement
   */
  async exportAnalysisData(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        plantId,
        includeImages = false,
        anonymize = true
      } = filters;

      // Get analysis data from database
      const analysisData = await aiDatabaseHelpers.getAnalysisHistory({
        ...filters,
        limit: 10000 // Large limit for export
      });

      // Process data for export
      const exportData = analysisData.map(analysis => {
        const processed = {
          id: analysis.id,
          timestamp: analysis.created_at,
          plantId: anonymize ? `plant_${analysis.plant_id}` : analysis.plant_id,
          userId: anonymize ? `user_${analysis.user_id}` : analysis.user_id,
          analysisType: analysis.analysis_type,
          confidence: analysis.confidence_score,
          result: analysis.result_data,
          inputData: analysis.input_data
        };

        // Remove sensitive information if anonymizing
        if (anonymize) {
          delete processed.result?.imageStorageInfo;
          delete processed.inputData?.imageInfo?.originalName;
        }

        return processed;
      });

      await this.logEvent({
        level: this.logLevels.INFO,
        category: 'data_export',
        message: `Analysis data exported`,
        data: {
          recordCount: exportData.length,
          includeImages,
          anonymize,
          filters
        }
      });

      return {
        success: true,
        data: exportData,
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: exportData.length,
          filters,
          anonymized: anonymize
        }
      };

    } catch (error) {
      console.error('Error exporting analysis data:', error);
      throw new Error('Không thể xuất dữ liệu phân tích');
    }
  }
}

module.exports = new AnalysisLoggingService();