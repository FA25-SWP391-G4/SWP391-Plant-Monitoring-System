const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const diseaseDetectionService = require('../services/diseaseDetectionService');
const imageValidationService = require('../services/imageValidationService');
const imageStorageService = require('../services/imageStorageService');
const analysisLoggingService = require('../services/analysisLoggingService');
const aiDatabaseHelpers = require('../database/aiDatabaseHelpers');
const aiMqttClient = require('../mqtt/aiMqttClient');
const monitoringService = require('../services/monitoringService');

/**
 * Disease Detection Controller
 * Handles all disease detection related endpoints
 */
class DiseaseDetectionController {
  constructor() {
    this.setupMulter();
    this.treatmentRecommendations = this.initializeTreatmentRecommendations();
  }

  /**
   * Setup Multer for file upload
   */
  setupMulter() {
    // Memory storage for processing
    const storage = multer.memoryStorage();
    
    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)'), false);
        }
      }
    });
  }

  /**
   * Initialize treatment recommendations
   */
  initializeTreatmentRecommendations() {
    return {
      'healthy': {
        treatments: [
          'Tiếp tục chăm sóc như hiện tại',
          'Duy trì độ ẩm đất phù hợp',
          'Đảm bảo ánh sáng đầy đủ',
          'Bón phân định kỳ theo lịch'
        ],
        prevention: [
          'Kiểm tra cây định kỳ',
          'Tưới nước đúng cách',
          'Đảm bảo thông gió tốt'
        ],
        urgency: 'low'
      },
      'leaf_spot': {
        treatments: [
          'Loại bỏ lá bị nhiễm bệnh',
          'Xịt thuốc diệt nấm chuyên dụng',
          'Cải thiện thông gió xung quanh cây',
          'Tránh tưới nước lên lá'
        ],
        prevention: [
          'Tưới nước vào gốc, không lên lá',
          'Đảm bảo khoảng cách giữa các cây',
          'Loại bỏ lá khô, lá rụng'
        ],
        urgency: 'medium'
      },
      'powdery_mildew': {
        treatments: [
          'Xịt dung dịch baking soda (1 tsp/1 lít nước)',
          'Sử dụng thuốc diệt nấm hệ thống',
          'Cải thiện lưu thông không khí',
          'Giảm độ ẩm xung quanh cây'
        ],
        prevention: [
          'Tránh tưới nước vào buổi tối',
          'Đảm bảo ánh sáng đầy đủ',
          'Không trồng cây quá dày'
        ],
        urgency: 'medium'
      },
      'rust': {
        treatments: [
          'Loại bỏ ngay lá bị nhiễm',
          'Xịt thuốc diệt nấm đồng',
          'Cách ly cây khỏi cây khỏe mạnh',
          'Tăng cường thông gió'
        ],
        prevention: [
          'Kiểm tra cây hàng ngày',
          'Tránh tưới nước lên lá',
          'Duy trì độ ẩm thấp'
        ],
        urgency: 'high'
      },
      'bacterial_blight': {
        treatments: [
          'Cắt bỏ phần bị nhiễm ngay lập tức',
          'Xịt thuốc kháng khuẩn đồng',
          'Cách ly cây bị nhiễm',
          'Khử trùng dụng cụ cắt tỉa'
        ],
        prevention: [
          'Tránh làm tổn thương cây',
          'Không tưới nước khi trời mưa',
          'Đảm bảo dẫn nước tốt'
        ],
        urgency: 'high'
      },
      'viral_mosaic': {
        treatments: [
          'Không có thuốc chữa trị cụ thể',
          'Loại bỏ cây bị nhiễm nặng',
          'Kiểm soát côn trùng truyền bệnh',
          'Tăng cường dinh dưỡng cho cây'
        ],
        prevention: [
          'Kiểm soát rệp, bọ chét',
          'Sử dụng giống kháng bệnh',
          'Khử trùng dụng cụ làm vườn'
        ],
        urgency: 'high'
      },
      'nutrient_deficiency': {
        treatments: [
          'Bón phân bổ sung dinh dưỡng',
          'Kiểm tra pH đất',
          'Sử dụng phân hữu cơ',
          'Bón phân vi lượng nếu cần'
        ],
        prevention: [
          'Bón phân định kỳ',
          'Kiểm tra đất thường xuyên',
          'Sử dụng phân cân bằng NPK'
        ],
        urgency: 'low'
      },
      'pest_damage': {
        treatments: [
          'Xác định loại sâu hại cụ thể',
          'Sử dụng thuốc trừ sâu phù hợp',
          'Loại bỏ sâu bằng tay nếu ít',
          'Xịt dầu neem tự nhiên'
        ],
        prevention: [
          'Kiểm tra cây thường xuyên',
          'Trồng cây đuổi sâu xung quanh',
          'Duy trì vệ sinh vườn sạch'
        ],
        urgency: 'medium'
      }
    };
  }

  /**
   * POST /api/ai/disease/analyze - Phân tích ảnh bệnh cây
   */
  async analyzeDisease(req, res) {
    const startTime = Date.now();
    
    try {
      const { plantId, userId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Không có file ảnh được tải lên'
        });
      }

      // Validate image
      const validationResult = await imageValidationService.validateImage(req.file);
      
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: validationResult.errors,
          warnings: validationResult.warnings
        });
      }

      // Analyze disease
      const analysisResult = await diseaseDetectionService.analyzeDisease(req.file.buffer);
      
      // Get treatment recommendations
      const primaryDisease = analysisResult.primaryDisease;
      const treatments = this.treatmentRecommendations[primaryDisease.diseaseKey] || 
                        this.treatmentRecommendations['healthy'];

      // Prepare response data
      const responseData = {
        ...analysisResult,
        treatments: treatments.treatments,
        prevention: treatments.prevention,
        urgency: treatments.urgency,
        plantDetection: validationResult.plantDetection,
        warnings: validationResult.warnings
      };

      const processingTime = Date.now() - startTime;

      // Track metrics for monitoring
      monitoringService.trackDiseaseDetection(
        startTime,
        Date.now(),
        analysisResult.confidence,
        analysisResult.diseases || [analysisResult.primaryDisease]
      );

      // Log analysis with image storage
      let loggingResult = null;
      try {
        loggingResult = await analysisLoggingService.logDiseaseAnalysis({
          plantId: plantId || null,
          userId: userId || null,
          imageFile: req.file,
          analysisResult: responseData,
          validationResult,
          processingTime,
          confidence: analysisResult.confidence
        });
      } catch (loggingError) {
        console.error('Error logging analysis:', loggingError);
        // Continue without logging
      }

      // Publish real-time results via MQTT
      if (plantId) {
        try {
          await this.publishAnalysisResults(plantId, {
            ...responseData,
            analysisId: loggingResult?.analysisId
          });
        } catch (mqttError) {
          console.error('Error publishing MQTT results:', mqttError);
          // Continue without MQTT
        }
      }

      res.json({
        success: true,
        data: {
          analysisId: loggingResult?.analysisId,
          processingTime,
          ...responseData
        }
      });

    } catch (error) {
      console.error('Error in disease analysis:', error);
      
      // Track error metrics
      monitoringService.trackError(error, { 
        context: 'disease_detection_analysis',
        plantId: req.body.plantId,
        userId: req.body.userId
      });

      res.status(500).json({
        success: false,
        error: 'Lỗi trong quá trình phân tích bệnh cây',
        details: error.message
      });
    }
  }

  /**
   * GET /api/ai/disease/history/:plantId - Lấy lịch sử phân tích
   */
  async getDiseaseHistory(req, res) {
    try {
      const { plantId } = req.params;
      const { limit = 10, offset = 0, includeImages = false } = req.query;

      if (!plantId) {
        return res.status(400).json({
          success: false,
          error: 'Plant ID là bắt buộc'
        });
      }

      const historyResult = await analysisLoggingService.getAnalysisHistory({
        plantId: parseInt(plantId),
        analysisType: 'disease_detection',
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeImages: includeImages === 'true'
      });

      res.json({
        success: true,
        data: historyResult
      });

    } catch (error) {
      console.error('Error getting disease history:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy lịch sử phân tích',
        details: error.message
      });
    }
  }

  /**
   * GET /api/ai/disease/treatments/:diseaseType - Lấy phương pháp điều trị
   */
  async getTreatments(req, res) {
    try {
      const { diseaseType } = req.params;

      if (!diseaseType) {
        return res.status(400).json({
          success: false,
          error: 'Disease type là bắt buộc'
        });
      }

      const treatments = this.treatmentRecommendations[diseaseType];
      
      if (!treatments) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy phương pháp điều trị cho loại bệnh này'
        });
      }

      const diseaseInfo = diseaseDetectionService.getSupportedDiseases()[diseaseType];

      res.json({
        success: true,
        data: {
          diseaseType,
          diseaseInfo,
          ...treatments
        }
      });

    } catch (error) {
      console.error('Error getting treatments:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy thông tin điều trị',
        details: error.message
      });
    }
  }

  /**
   * POST /api/ai/disease/validate-image - Kiểm tra ảnh có phải cây không
   */
  async validateImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Không có file ảnh được tải lên'
        });
      }

      const validationResult = await imageValidationService.validateImage(req.file);

      res.json({
        success: true,
        data: validationResult
      });

    } catch (error) {
      console.error('Error validating image:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi xác thực ảnh',
        details: error.message
      });
    }
  }

  /**
   * POST /api/ai/disease/feedback/:analysisId - Feedback từ user
   */
  async submitFeedback(req, res) {
    try {
      const { analysisId } = req.params;
      const { feedbackType, userComment, actualResult, userId } = req.body;

      if (!analysisId) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID là bắt buộc'
        });
      }

      if (!feedbackType || !['correct', 'incorrect', 'partially_correct'].includes(feedbackType)) {
        return res.status(400).json({
          success: false,
          error: 'Feedback type không hợp lệ'
        });
      }

      // Log feedback using analysis logging service
      const feedbackResult = await analysisLoggingService.logUserFeedback({
        analysisId: parseInt(analysisId),
        userId: userId || null,
        feedbackType,
        userComment: userComment || null,
        actualResult: actualResult || null
      });

      res.json({
        success: true,
        data: {
          feedbackId: feedbackResult.feedbackId,
          message: 'Cảm ơn bạn đã đóng góp feedback!'
        }
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi gửi feedback',
        details: error.message
      });
    }
  }

  /**
   * GET /api/ai/disease/supported - Lấy danh sách bệnh được hỗ trợ
   */
  async getSupportedDiseases(req, res) {
    try {
      const supportedDiseases = diseaseDetectionService.getSupportedDiseases();
      const validationStats = imageValidationService.getValidationStats();
      const storageStats = await imageStorageService.getStorageStats();

      res.json({
        success: true,
        data: {
          supportedDiseases,
          validationRequirements: validationStats,
          storageInfo: storageStats,
          modelStatus: {
            diseaseDetection: diseaseDetectionService.isReady(),
            imageValidation: imageValidationService.isModelLoaded
          }
        }
      });

    } catch (error) {
      console.error('Error getting supported diseases:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy thông tin bệnh được hỗ trợ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/ai/disease/image/:filename - Lấy ảnh đã lưu trữ
   */
  async getStoredImage(req, res) {
    try {
      const { filename } = req.params;
      const { thumbnail = false } = req.query;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename là bắt buộc'
        });
      }

      const imageData = await imageStorageService.retrieveImage(filename, thumbnail === 'true');

      res.set({
        'Content-Type': imageData.mimeType,
        'Content-Length': imageData.buffer.length,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      res.send(imageData.buffer);

    } catch (error) {
      console.error('Error retrieving stored image:', error);
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ảnh',
        details: error.message
      });
    }
  }

  /**
   * GET /api/ai/disease/statistics - Lấy thống kê phân tích
   */
  async getAnalysisStatistics(req, res) {
    try {
      const { timeRange = '30d' } = req.query;

      const feedbackStats = await analysisLoggingService.getFeedbackStatistics(timeRange);
      const storageStats = await imageStorageService.getStorageStats();

      res.json({
        success: true,
        data: {
          feedback: feedbackStats.statistics,
          storage: storageStats,
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting analysis statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy thống kê phân tích',
        details: error.message
      });
    }
  }

  /**
   * Publish analysis results via MQTT
   */
  async publishAnalysisResults(plantId, analysisData) {
    try {
      const topic = `ai/disease/analysis/${plantId}`;
      const message = {
        plantId,
        diseases: analysisData.diseases,
        primaryDisease: analysisData.primaryDisease,
        confidence: analysisData.confidence,
        severity: analysisData.severity,
        treatments: analysisData.treatments,
        urgency: analysisData.urgency,
        timestamp: new Date().toISOString(),
        analysisId: analysisData.analysisId
      };

      await aiMqttClient.publish(topic, JSON.stringify(message));

      // Publish alert if high severity
      if (analysisData.severity === 'high' && analysisData.confidence > 0.7) {
        const alertTopic = `ai/disease/alert/${plantId}`;
        const alertMessage = {
          type: 'disease_detected',
          plantId,
          disease: analysisData.primaryDisease.disease.name,
          severity: 'high',
          confidence: analysisData.confidence,
          urgentAction: analysisData.treatments[0],
          timestamp: new Date().toISOString()
        };

        await aiMqttClient.publish(alertTopic, JSON.stringify(alertMessage));
      }

    } catch (error) {
      console.error('Error publishing MQTT analysis results:', error);
      throw error;
    }
  }

  /**
   * Get middleware for file upload
   */
  getUploadMiddleware() {
    return this.upload.single('image');
  }
}

module.exports = new DiseaseDetectionController();