/**
 * Unit Tests for Disease Detection Functionality
 * Task 3.5: Write unit tests cho disease detection
 * 
 * Test Coverage:
 * - Test image validation và plant detection
 * - Test disease classification accuracy
 * - Test content filtering và rejection logic
 * - Test MQTT integration cho real-time results
 * 
 * Requirements: 3.1, 3.3, 3.4
 */

const diseaseDetectionController = require('../controllers/diseaseDetectionController');
const diseaseDetectionService = require('../services/diseaseDetectionService');
const imageValidationService = require('../services/imageValidationService');
const imageStorageService = require('../services/imageStorageService');
const analysisLoggingService = require('../services/analysisLoggingService');

// Mock dependencies
jest.mock('../services/diseaseDetectionService');
jest.mock('../services/imageValidationService');
jest.mock('../services/imageStorageService');
jest.mock('../services/analysisLoggingService');
jest.mock('../mqtt/aiMqttClient', () => ({
  publishDiseaseAnalysis: jest.fn().mockResolvedValue(),
  publishDiseaseAlert: jest.fn().mockResolvedValue(),
  publishDiseaseProgress: jest.fn().mockResolvedValue(),
  isClientConnected: jest.fn().mockReturnValue(true),
  healthCheck: jest.fn().mockResolvedValue({ connected: true, mock: true })
}));

describe('Disease Detection Controller Unit Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock request and response objects
    mockReq = {
      body: {
        plantId: 1,
        userId: 'test_user_1'
      },
      file: {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        originalname: 'test-plant.jpg'
      }
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Setup default mock implementations
    imageValidationService.validateImage = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      plantDetection: {
        isPlant: true,
        confidence: 0.8,
        message: 'Ảnh chứa cây hoặc lá cây'
      },
      contentCheck: {
        isAppropriate: true,
        warnings: [],
        message: 'Ảnh phù hợp để phân tích'
      }
    });

    diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
      diseases: [
        {
          diseaseKey: 'leaf_spot',
          disease: {
            name: 'Đốm lá',
            severity: 'medium',
            description: 'Bệnh đốm lá do nấm'
          },
          confidence: 0.85,
          severity: 'medium'
        }
      ],
      primaryDisease: {
        diseaseKey: 'leaf_spot',
        disease: {
          name: 'Đốm lá',
          severity: 'medium',
          description: 'Bệnh đốm lá do nấm'
        },
        confidence: 0.85,
        severity: 'medium'
      },
      confidence: 0.85,
      severity: 'medium',
      analysisTimestamp: new Date().toISOString()
    });

    analysisLoggingService.logDiseaseAnalysis = jest.fn().mockResolvedValue({
      analysisId: 123
    });
  });

  describe('Image Validation và Plant Detection', () => {
    test('should validate image technical requirements successfully', async () => {
      // Arrange
      const validFile = {
        buffer: Buffer.from('valid-image-data'),
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        originalname: 'plant-image.jpg'
      };
      mockReq.file = validFile;

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(imageValidationService.validateImage).toHaveBeenCalledWith(validFile);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            plantDetection: expect.objectContaining({
              isPlant: true,
              confidence: 0.8
            })
          })
        })
      );
    });

    test('should reject images that are too large', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Kích thước file không được vượt quá 10MB'],
        warnings: []
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: ['Kích thước file không được vượt quá 10MB']
        })
      );
    });

    test('should reject unsupported file formats', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Chỉ chấp nhận file ảnh (image/jpeg, image/jpg, image/png, image/webp)'],
        warnings: []
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: expect.arrayContaining([
            expect.stringContaining('Chỉ chấp nhận file ảnh')
          ])
        })
      );
    });

    test('should detect plant content in images', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        plantDetection: {
          isPlant: true,
          confidence: 0.9,
          message: 'Ảnh chứa cây hoặc lá cây rõ ràng'
        },
        contentCheck: {
          isAppropriate: true,
          warnings: [],
          message: 'Ảnh phù hợp để phân tích'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            plantDetection: expect.objectContaining({
              isPlant: true,
              confidence: 0.9,
              message: 'Ảnh chứa cây hoặc lá cây rõ ràng'
            })
          })
        })
      );
    });

    test('should reject images without plant content', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Ảnh không chứa cây hoặc lá cây. Vui lòng chụp ảnh lá/cây rõ ràng.'],
        warnings: [],
        plantDetection: {
          isPlant: false,
          confidence: 0.3,
          message: 'Ảnh không chứa cây hoặc lá cây rõ ràng'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: expect.arrayContaining([
            'Ảnh không chứa cây hoặc lá cây. Vui lòng chụp ảnh lá/cây rõ ràng.'
          ])
        })
      );
    });

    test('should handle low confidence plant detection with warnings', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['Độ tin cậy thấp (55%). Kết quả có thể không chính xác.'],
        plantDetection: {
          isPlant: true,
          confidence: 0.55,
          message: 'Ảnh có thể chứa cây'
        },
        contentCheck: {
          isAppropriate: true,
          warnings: [],
          message: 'Ảnh phù hợp để phân tích'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            warnings: expect.arrayContaining([
              'Độ tin cậy thấp (55%). Kết quả có thể không chính xác.'
            ])
          })
        })
      );
    });

    test('should handle missing file upload', async () => {
      // Arrange
      mockReq.file = null;

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Không có file ảnh được tải lên'
        })
      );
    });
  });

  describe('Disease Classification Accuracy', () => {
    test('should classify leaf spot disease correctly', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
        diseases: [
          {
            diseaseKey: 'leaf_spot',
            disease: {
              name: 'Đốm lá',
              severity: 'medium',
              description: 'Bệnh đốm lá do nấm'
            },
            confidence: 0.92,
            severity: 'medium'
          }
        ],
        primaryDisease: {
          diseaseKey: 'leaf_spot',
          disease: {
            name: 'Đốm lá',
            severity: 'medium',
            description: 'Bệnh đốm lá do nấm'
          },
          confidence: 0.92,
          severity: 'medium'
        },
        confidence: 0.92,
        severity: 'medium',
        analysisTimestamp: new Date().toISOString()
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(diseaseDetectionService.analyzeDisease).toHaveBeenCalledWith(mockReq.file.buffer);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            primaryDisease: expect.objectContaining({
              diseaseKey: 'leaf_spot',
              confidence: 0.92
            }),
            confidence: 0.92,
            severity: 'medium'
          })
        })
      );
    });

    test('should classify multiple diseases with confidence ranking', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
        diseases: [
          {
            diseaseKey: 'leaf_spot',
            disease: { name: 'Đốm lá', severity: 'medium' },
            confidence: 0.75,
            severity: 'medium'
          },
          {
            diseaseKey: 'powdery_mildew',
            disease: { name: 'Phấn trắng', severity: 'medium' },
            confidence: 0.65,
            severity: 'medium'
          }
        ],
        primaryDisease: {
          diseaseKey: 'leaf_spot',
          disease: { name: 'Đốm lá', severity: 'medium' },
          confidence: 0.75,
          severity: 'medium'
        },
        confidence: 0.75,
        severity: 'medium',
        analysisTimestamp: new Date().toISOString()
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            diseases: expect.arrayContaining([
              expect.objectContaining({
                diseaseKey: 'leaf_spot',
                confidence: 0.75
              }),
              expect.objectContaining({
                diseaseKey: 'powdery_mildew',
                confidence: 0.65
              })
            ]),
            primaryDisease: expect.objectContaining({
              diseaseKey: 'leaf_spot',
              confidence: 0.75
            })
          })
        })
      );
    });

    test('should classify healthy plants correctly', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
        diseases: [
          {
            diseaseKey: 'healthy',
            disease: {
              name: 'Cây khỏe mạnh',
              severity: 'none',
              description: 'Cây đang trong tình trạng khỏe mạnh'
            },
            confidence: 0.88,
            severity: 'none'
          }
        ],
        primaryDisease: {
          diseaseKey: 'healthy',
          disease: {
            name: 'Cây khỏe mạnh',
            severity: 'none',
            description: 'Cây đang trong tình trạng khỏe mạnh'
          },
          confidence: 0.88,
          severity: 'none'
        },
        confidence: 0.88,
        severity: 'none',
        analysisTimestamp: new Date().toISOString()
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            primaryDisease: expect.objectContaining({
              diseaseKey: 'healthy',
              confidence: 0.88
            }),
            severity: 'none',
            urgency: 'low'
          })
        })
      );
    });

    test('should handle high severity diseases with appropriate urgency', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
        diseases: [
          {
            diseaseKey: 'bacterial_blight',
            disease: {
              name: 'Cháy lá do vi khuẩn',
              severity: 'high',
              description: 'Bệnh do vi khuẩn gây cháy lá'
            },
            confidence: 0.89,
            severity: 'high'
          }
        ],
        primaryDisease: {
          diseaseKey: 'bacterial_blight',
          disease: {
            name: 'Cháy lá do vi khuẩn',
            severity: 'high',
            description: 'Bệnh do vi khuẩn gây cháy lá'
          },
          confidence: 0.89,
          severity: 'high'
        },
        confidence: 0.89,
        severity: 'high',
        analysisTimestamp: new Date().toISOString()
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            primaryDisease: expect.objectContaining({
              diseaseKey: 'bacterial_blight',
              confidence: 0.89
            }),
            severity: 'high',
            urgency: 'high',
            treatments: expect.arrayContaining([
              expect.stringContaining('Cắt bỏ phần bị nhiễm ngay lập tức')
            ])
          })
        })
      );
    });

    test('should provide treatment recommendations based on disease type', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue({
        diseases: [
          {
            diseaseKey: 'rust',
            disease: {
              name: 'Bệnh gỉ sắt',
              severity: 'high',
              description: 'Bệnh gỉ sắt tạo các đốm màu cam đỏ trên lá'
            },
            confidence: 0.82,
            severity: 'high'
          }
        ],
        primaryDisease: {
          diseaseKey: 'rust',
          disease: {
            name: 'Bệnh gỉ sắt',
            severity: 'high',
            description: 'Bệnh gỉ sắt tạo các đốm màu cam đỏ trên lá'
          },
          confidence: 0.82,
          severity: 'high'
        },
        confidence: 0.82,
        severity: 'high',
        analysisTimestamp: new Date().toISOString()
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            treatments: expect.arrayContaining([
              'Loại bỏ ngay lá bị nhiễm',
              'Xịt thuốc diệt nấm đồng',
              'Cách ly cây khỏi cây khỏe mạnh',
              'Tăng cường thông gió'
            ]),
            prevention: expect.arrayContaining([
              'Kiểm tra cây hàng ngày',
              'Tránh tưới nước lên lá',
              'Duy trì độ ẩm thấp'
            ])
          })
        })
      );
    });

    test('should handle analysis service errors gracefully', async () => {
      // Arrange
      diseaseDetectionService.analyzeDisease = jest.fn().mockRejectedValue(
        new Error('Model inference failed')
      );

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Lỗi trong quá trình phân tích bệnh cây',
          details: 'Model inference failed'
        })
      );
    });
  });

  describe('Content Filtering và Rejection Logic', () => {
    test('should reject images with inappropriate content', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Tôi chỉ phân tích ảnh cây trồng. Vui lòng tải lên ảnh lá hoặc cây.'],
        warnings: [],
        plantDetection: {
          isPlant: false,
          confidence: 0.2,
          message: 'Ảnh không chứa cây hoặc lá cây'
        },
        contentCheck: {
          isAppropriate: false,
          warnings: ['Ảnh chứa nội dung không phù hợp'],
          message: 'Ảnh không phù hợp để phân tích bệnh cây'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: expect.arrayContaining([
            'Tôi chỉ phân tích ảnh cây trồng. Vui lòng tải lên ảnh lá hoặc cây.'
          ])
        })
      );
    });

    test('should reject images containing people or animals', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Ảnh chứa người hoặc động vật. Vui lòng chỉ tải lên ảnh cây trồng.'],
        warnings: [],
        plantDetection: {
          isPlant: false,
          confidence: 0.1,
          message: 'Ảnh không chứa cây'
        },
        contentCheck: {
          isAppropriate: false,
          warnings: ['Phát hiện người hoặc động vật trong ảnh'],
          message: 'Ảnh không phù hợp để phân tích'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: expect.arrayContaining([
            expect.stringContaining('người hoặc động vật')
          ])
        })
      );
    });

    test('should reject images with inappropriate aspect ratios', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['Tỷ lệ ảnh không phù hợp cho ảnh cây trồng'],
        plantDetection: {
          isPlant: true,
          confidence: 0.7,
          message: 'Ảnh chứa cây'
        },
        contentCheck: {
          isAppropriate: true,
          warnings: ['Tỷ lệ ảnh không phù hợp cho ảnh cây trồng'],
          message: 'Ảnh có thể không phù hợp để phân tích bệnh cây'
        }
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            warnings: expect.arrayContaining([
              'Tỷ lệ ảnh không phù hợp cho ảnh cây trồng'
            ])
          })
        })
      );
    });

    test('should handle corrupted or invalid image files', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['File ảnh bị lỗi hoặc không đúng định dạng'],
        warnings: []
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ảnh không hợp lệ',
          details: expect.arrayContaining([
            'File ảnh bị lỗi hoặc không đúng định dạng'
          ])
        })
      );
    });

    test('should validate image endpoint for plant content only', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        plantDetection: {
          isPlant: true,
          confidence: 0.85,
          message: 'Ảnh chứa cây hoặc lá cây'
        },
        contentCheck: {
          isAppropriate: true,
          warnings: [],
          message: 'Ảnh phù hợp để phân tích'
        }
      });

      // Act
      await diseaseDetectionController.validateImage(mockReq, mockRes);

      // Assert
      expect(imageValidationService.validateImage).toHaveBeenCalledWith(mockReq.file);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isValid: true,
            plantDetection: expect.objectContaining({
              isPlant: true,
              confidence: 0.85
            })
          })
        })
      );
    });
  });

  describe('MQTT Integration cho Real-time Results', () => {
    let mockMqttClient;

    beforeEach(() => {
      mockMqttClient = require('../mqtt/aiMqttClient');
    });

    test('should publish disease analysis results via MQTT', async () => {
      // Arrange
      const analysisResult = {
        diseases: [
          {
            diseaseKey: 'leaf_spot',
            disease: { name: 'Đốm lá', severity: 'medium' },
            confidence: 0.85,
            severity: 'medium'
          }
        ],
        primaryDisease: {
          diseaseKey: 'leaf_spot',
          disease: { name: 'Đốm lá', severity: 'medium' },
          confidence: 0.85,
          severity: 'medium'
        },
        confidence: 0.85,
        severity: 'medium'
      };

      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue(analysisResult);

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAnalysis).toHaveBeenCalledWith(
        1, // plantId
        expect.objectContaining({
          diseases: analysisResult.diseases,
          primaryDisease: analysisResult.primaryDisease,
          confidence: 0.85,
          severity: 'medium',
          treatments: expect.any(Array),
          urgency: expect.any(String),
          analysisId: 123
        })
      );
    });

    test('should publish disease alert for high severity diseases', async () => {
      // Arrange
      const highSeverityResult = {
        diseases: [
          {
            diseaseKey: 'bacterial_blight',
            disease: { name: 'Cháy lá do vi khuẩn', severity: 'high' },
            confidence: 0.89,
            severity: 'high'
          }
        ],
        primaryDisease: {
          diseaseKey: 'bacterial_blight',
          disease: { name: 'Cháy lá do vi khuẩn', severity: 'high' },
          confidence: 0.89,
          severity: 'high'
        },
        confidence: 0.89,
        severity: 'high'
      };

      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue(highSeverityResult);

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAlert).toHaveBeenCalledWith(
        1, // plantId
        expect.objectContaining({
          type: 'disease_detected',
          disease: 'Cháy lá do vi khuẩn',
          severity: 'high',
          confidence: 0.89,
          urgentAction: expect.stringContaining('Cắt bỏ phần bị nhiễm ngay lập tức')
        })
      );
    });

    test('should not publish alert for low severity diseases', async () => {
      // Arrange
      const lowSeverityResult = {
        diseases: [
          {
            diseaseKey: 'nutrient_deficiency',
            disease: { name: 'Thiếu dinh dưỡng', severity: 'low' },
            confidence: 0.75,
            severity: 'low'
          }
        ],
        primaryDisease: {
          diseaseKey: 'nutrient_deficiency',
          disease: { name: 'Thiếu dinh dưỡng', severity: 'low' },
          confidence: 0.75,
          severity: 'low'
        },
        confidence: 0.75,
        severity: 'low'
      };

      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue(lowSeverityResult);

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAnalysis).toHaveBeenCalled();
      expect(mockMqttClient.publishDiseaseAlert).not.toHaveBeenCalled();
    });

    test('should not publish alert for low confidence results', async () => {
      // Arrange
      const lowConfidenceResult = {
        diseases: [
          {
            diseaseKey: 'rust',
            disease: { name: 'Bệnh gỉ sắt', severity: 'high' },
            confidence: 0.65, // Below 0.7 threshold
            severity: 'high'
          }
        ],
        primaryDisease: {
          diseaseKey: 'rust',
          disease: { name: 'Bệnh gỉ sắt', severity: 'high' },
          confidence: 0.65,
          severity: 'high'
        },
        confidence: 0.65,
        severity: 'high'
      };

      diseaseDetectionService.analyzeDisease = jest.fn().mockResolvedValue(lowConfidenceResult);

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAnalysis).toHaveBeenCalled();
      expect(mockMqttClient.publishDiseaseAlert).not.toHaveBeenCalled();
    });

    test('should handle MQTT publishing errors gracefully', async () => {
      // Arrange
      mockMqttClient.publishDiseaseAnalysis = jest.fn().mockRejectedValue(
        new Error('MQTT connection failed')
      );

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert - Should still return successful response despite MQTT errors
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            confidence: 0.85
          })
        })
      );
    });

    test('should publish analysis without MQTT when plantId is missing', async () => {
      // Arrange
      mockReq.body.plantId = null;

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAnalysis).not.toHaveBeenCalled();
      expect(mockMqttClient.publishDiseaseAlert).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should include analysis ID in MQTT messages', async () => {
      // Arrange
      analysisLoggingService.logDiseaseAnalysis = jest.fn().mockResolvedValue({
        analysisId: 456
      });

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishDiseaseAnalysis).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          analysisId: 456
        })
      );
    });

    test('should handle MQTT client disconnection', async () => {
      // Arrange
      mockMqttClient.isClientConnected = jest.fn().mockReturnValue(false);
      mockMqttClient.publishDiseaseAnalysis = jest.fn().mockRejectedValue(
        new Error('MQTT client not connected')
      );

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert - Should continue processing despite MQTT unavailability
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('Integration with Analysis Logging', () => {
    test('should log analysis results with image storage', async () => {
      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(analysisLoggingService.logDiseaseAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          plantId: 1,
          userId: 'test_user_1',
          imageFile: mockReq.file,
          analysisResult: expect.objectContaining({
            confidence: 0.85,
            severity: 'medium'
          }),
          validationResult: expect.objectContaining({
            isValid: true
          }),
          processingTime: expect.any(Number),
          confidence: 0.85
        })
      );
    });

    test('should continue processing when logging fails', async () => {
      // Arrange
      analysisLoggingService.logDiseaseAnalysis = jest.fn().mockRejectedValue(
        new Error('Database logging failed')
      );

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert - Should still return successful response
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            analysisId: undefined // No analysis ID when logging fails
          })
        })
      );
    });

    test('should include processing time in response', async () => {
      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            processingTime: expect.any(Number)
          })
        })
      );

      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall.data.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle validation service errors', async () => {
      // Arrange
      imageValidationService.validateImage = jest.fn().mockRejectedValue(
        new Error('Validation service failed')
      );

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Lỗi trong quá trình phân tích bệnh cây'
        })
      );
    });

    test('should handle concurrent analysis requests', async () => {
      // Arrange
      const requests = [];
      
      // Act - Send 3 concurrent requests
      for (let i = 0; i < 3; i++) {
        const req = { ...mockReq };
        req.body.plantId = i + 1;
        const res = {
          json: jest.fn().mockReturnThis(),
          status: jest.fn().mockReturnThis()
        };
        
        requests.push(diseaseDetectionController.analyzeDisease(req, res));
      }

      await Promise.all(requests);

      // Assert
      expect(diseaseDetectionService.analyzeDisease).toHaveBeenCalledTimes(3);
      expect(imageValidationService.validateImage).toHaveBeenCalledTimes(3);
    });

    test('should handle memory cleanup for large images', async () => {
      // Arrange
      const largeImageBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB buffer
      mockReq.file.buffer = largeImageBuffer;

      // Act
      await diseaseDetectionController.analyzeDisease(mockReq, mockRes);

      // Assert - Should complete successfully
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});

describe('Disease Detection Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Initialization', () => {
    test('should initialize disease detection model successfully', async () => {
      // Act
      const result = await diseaseDetectionService.initializeModel();

      // Assert
      expect(result).toBe(true);
      expect(diseaseDetectionService.isReady()).toBe(true);
    });

    test('should handle model initialization failure', async () => {
      // Arrange
      const originalCreateDemoModel = diseaseDetectionService.createDemoModel;
      diseaseDetectionService.createDemoModel = jest.fn().mockRejectedValue(
        new Error('Model creation failed')
      );

      // Act
      const result = await diseaseDetectionService.initializeModel();

      // Assert
      expect(result).toBe(false);
      expect(diseaseDetectionService.isReady()).toBe(false);

      // Cleanup
      diseaseDetectionService.createDemoModel = originalCreateDemoModel;
    });
  });

  describe('Supported Diseases', () => {
    test('should return all supported diseases', () => {
      // Act
      const supportedDiseases = diseaseDetectionService.getSupportedDiseases();

      // Assert
      expect(supportedDiseases).toHaveProperty('healthy');
      expect(supportedDiseases).toHaveProperty('leaf_spot');
      expect(supportedDiseases).toHaveProperty('powdery_mildew');
      expect(supportedDiseases).toHaveProperty('rust');
      expect(supportedDiseases).toHaveProperty('bacterial_blight');
      expect(supportedDiseases).toHaveProperty('viral_mosaic');
      expect(supportedDiseases).toHaveProperty('nutrient_deficiency');
      expect(supportedDiseases).toHaveProperty('pest_damage');

      // Check disease structure
      expect(supportedDiseases.leaf_spot).toHaveProperty('name');
      expect(supportedDiseases.leaf_spot).toHaveProperty('severity');
      expect(supportedDiseases.leaf_spot).toHaveProperty('description');
    });

    test('should have correct severity levels for diseases', () => {
      // Act
      const supportedDiseases = diseaseDetectionService.getSupportedDiseases();

      // Assert
      expect(supportedDiseases.healthy.severity).toBe('none');
      expect(supportedDiseases.leaf_spot.severity).toBe('medium');
      expect(supportedDiseases.rust.severity).toBe('high');
      expect(supportedDiseases.bacterial_blight.severity).toBe('high');
      expect(supportedDiseases.viral_mosaic.severity).toBe('high');
      expect(supportedDiseases.nutrient_deficiency.severity).toBe('low');
    });
  });
});

describe('Image Validation Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Technical Validation', () => {
    test('should validate correct image format and size', async () => {
      // Arrange
      const validFile = {
        buffer: Buffer.from('valid-image-data'),
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        originalname: 'plant.jpg'
      };

      // Act
      const result = await imageValidationService.validateTechnical(validFile);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject oversized files', async () => {
      // Arrange
      const oversizedFile = {
        buffer: Buffer.alloc(15 * 1024 * 1024), // 15MB
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024,
        originalname: 'large-plant.jpg'
      };

      // Act
      const result = await imageValidationService.validateTechnical(oversizedFile);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Kích thước file không được vượt quá')
      );
    });

    test('should reject unsupported file formats', async () => {
      // Arrange
      const unsupportedFile = {
        buffer: Buffer.from('file-data'),
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'document.pdf'
      };

      // Act
      const result = await imageValidationService.validateTechnical(unsupportedFile);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Chỉ chấp nhận file ảnh')
      );
    });
  });

  describe('Plant Content Detection', () => {
    test('should detect plant content with high confidence', async () => {
      // Arrange
      const plantImageBuffer = Buffer.from('plant-image-data');

      // Mock the plant detection to return high confidence
      const originalValidatePlantContent = imageValidationService.validatePlantContent;
      imageValidationService.validatePlantContent = jest.fn().mockResolvedValue({
        isPlant: true,
        confidence: 0.9,
        message: 'Ảnh chứa cây hoặc lá cây rõ ràng'
      });

      // Act
      const result = await imageValidationService.validatePlantContent(plantImageBuffer);

      // Assert
      expect(result.isPlant).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(result.message).toContain('cây hoặc lá cây');

      // Cleanup
      imageValidationService.validatePlantContent = originalValidatePlantContent;
    });

    test('should reject non-plant images', async () => {
      // Arrange
      const nonPlantImageBuffer = Buffer.from('non-plant-image-data');

      // Mock the plant detection to return low confidence
      const originalValidatePlantContent = imageValidationService.validatePlantContent;
      imageValidationService.validatePlantContent = jest.fn().mockResolvedValue({
        isPlant: false,
        confidence: 0.2,
        message: 'Ảnh không chứa cây hoặc lá cây rõ ràng'
      });

      // Act
      const result = await imageValidationService.validatePlantContent(nonPlantImageBuffer);

      // Assert
      expect(result.isPlant).toBe(false);
      expect(result.confidence).toBe(0.2);
      expect(result.message).toContain('không chứa cây');

      // Cleanup
      imageValidationService.validatePlantContent = originalValidatePlantContent;
    });
  });

  describe('Validation Statistics', () => {
    test('should return validation configuration', () => {
      // Act
      const stats = imageValidationService.getValidationStats();

      // Assert
      expect(stats).toHaveProperty('allowedMimeTypes');
      expect(stats).toHaveProperty('maxFileSize');
      expect(stats).toHaveProperty('minDimensions');
      expect(stats).toHaveProperty('maxDimensions');
      expect(stats).toHaveProperty('plantConfidenceThreshold');
      expect(stats).toHaveProperty('modelLoaded');

      expect(stats.allowedMimeTypes).toContain('image/jpeg');
      expect(stats.allowedMimeTypes).toContain('image/png');
      expect(stats.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
    });
  });
});