const request = require('supertest');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import modules to test
const { 
  rateLimiters, 
  validateAndSanitize, 
  corsOptions, 
  securityHeaders, 
  authenticateToken, 
  sanitizeRequest 
} = require('../middleware/securityMiddleware');

const {
  validateChatbotRequest,
  validateDiseaseDetectionRequest,
  validateIrrigationRequest,
  validateApiKey,
  validateUploadSecurity
} = require('../middleware/aiSecurityMiddleware');

const { 
  AIServiceError, 
  errorHandlerMiddleware, 
  GracefulDegradation,
  FallbackResponses 
} = require('../utils/errorHandler');

const { dataProtectionService } = require('../services/dataProtectionService');
const { privacyCompliance } = require('../middleware/privacyMiddleware');
const { dataRetentionService } = require('../services/dataRetentionService');

describe('Security and Error Handling Tests', () => {
  let app;
  let testImageBuffer;
  
  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Create test image buffer
    testImageBuffer = Buffer.from('fake-image-data');
    
    // Ensure test directories exist
    const testDirs = [
      path.join(__dirname, '../uploads/temp'),
      path.join(__dirname, '../uploads/encrypted'),
      path.join(__dirname, '../logs')
    ];
    
    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  });
  
  afterAll(async () => {
    // Cleanup test files
    const testDirs = [
      path.join(__dirname, '../uploads/temp'),
      path.join(__dirname, '../uploads/encrypted')
    ];
    
    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    }
  });

  describe('Rate Limiting Tests', () => {
    let testApp;
    
    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });
    
    test('should allow requests within rate limit', async () => {
      testApp.use(rateLimiters.general.middleware());
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
    
    test('should block requests exceeding rate limit', async () => {
      // Create a very restrictive rate limiter for testing
      const testRateLimiter = rateLimiters.general;
      testRateLimiter.max = 2; // Only allow 2 requests
      
      testApp.use(testRateLimiter.middleware());
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      // Make requests up to the limit
      await request(testApp).get('/test').expect(200);
      await request(testApp).get('/test').expect(200);
      
      // This should be blocked
      const response = await request(testApp)
        .get('/test')
        .expect(429);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_006');
      expect(response.body.error.message).toContain('giới hạn');
    });
    
    test('should have different rate limits for different endpoints', () => {
      expect(rateLimiters.general.max).toBe(100);
      expect(rateLimiters.chatbot.max).toBe(30);
      expect(rateLimiters.imageUpload.max).toBe(10);
      expect(rateLimiters.health.max).toBe(60);
    });
    
    test('should reset rate limit after window expires', async () => {
      // This test would require time manipulation or a very short window
      // For now, we'll test the logic structure
      const rateLimiter = rateLimiters.general;
      expect(rateLimiter.windowMs).toBe(60000); // 1 minute
      expect(rateLimiter.requests).toBeInstanceOf(Map);
    });
  });

  describe('Authentication Tests', () => {
    let testApp;
    
    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });
    
    test('should allow requests with valid API key', async () => {
      testApp.use(validateApiKey);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .set('x-api-key', 'development-key')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should reject requests with invalid API key', async () => {
      process.env.NODE_ENV = 'production'; // Force API key requirement
      
      testApp.use(validateApiKey);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .set('x-api-key', 'invalid-key')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_007');
      
      process.env.NODE_ENV = 'test'; // Reset
    });
    
    test('should allow requests without API key in development', async () => {
      process.env.NODE_ENV = 'development';
      
      testApp.use(validateApiKey);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should validate JWT token format', async () => {
      testApp.use(authenticateToken);
      testApp.get('/test', (req, res) => res.json({ 
        success: true, 
        authenticated: req.authenticated 
      }));
      
      const response = await request(testApp)
        .get('/test')
        .set('Authorization', 'Bearer development-token')
        .expect(200);
      
      expect(response.body.authenticated).toBe(true);
    });
  });

  describe('Input Validation and Sanitization Tests', () => {
    test('should sanitize malicious string input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = validateAndSanitize.sanitizeString(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });
    
    test('should validate message content', () => {
      // Valid message
      expect(() => {
        validateAndSanitize.validateMessage('Cây của tôi có lá vàng');
      }).not.toThrow();
      
      // Empty message
      expect(() => {
        validateAndSanitize.validateMessage('');
      }).toThrow(AIServiceError);
      
      // Too long message
      expect(() => {
        validateAndSanitize.validateMessage('a'.repeat(2001));
      }).toThrow(AIServiceError);
      
      // Malicious content
      expect(() => {
        validateAndSanitize.validateMessage('<script>alert("xss")</script>');
      }).toThrow(AIServiceError);
    });
    
    test('should validate user ID', () => {
      // Valid user IDs
      expect(validateAndSanitize.validateUserId(123)).toBe(123);
      expect(validateAndSanitize.validateUserId('456')).toBe(456);
      
      // Invalid user IDs
      expect(() => {
        validateAndSanitize.validateUserId(null);
      }).toThrow(AIServiceError);
      
      expect(() => {
        validateAndSanitize.validateUserId(-1);
      }).toThrow(AIServiceError);
      
      expect(() => {
        validateAndSanitize.validateUserId('invalid');
      }).toThrow(AIServiceError);
    });
    
    test('should validate plant ID with default', () => {
      expect(validateAndSanitize.validatePlantId(123)).toBe(123);
      expect(validateAndSanitize.validatePlantId(undefined)).toBe(1); // Default
      expect(validateAndSanitize.validatePlantId(null)).toBe(1); // Default
      
      expect(() => {
        validateAndSanitize.validatePlantId(-1);
      }).toThrow(AIServiceError);
    });
    
    test('should validate file upload', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };
      
      expect(() => {
        validateAndSanitize.validateFileUpload(validFile);
      }).not.toThrow();
      
      // File too large
      const largeFile = {
        ...validFile,
        size: 11 * 1024 * 1024 // 11MB
      };
      
      expect(() => {
        validateAndSanitize.validateFileUpload(largeFile);
      }).toThrow(AIServiceError);
      
      // Invalid file type
      const invalidFile = {
        ...validFile,
        mimetype: 'application/exe'
      };
      
      expect(() => {
        validateAndSanitize.validateFileUpload(invalidFile);
      }).toThrow(AIServiceError);
      
      // Suspicious filename
      const suspiciousFile = {
        ...validFile,
        originalname: '../../../etc/passwd'
      };
      
      expect(() => {
        validateAndSanitize.validateFileUpload(suspiciousFile);
      }).toThrow(AIServiceError);
    });
  });

  describe('AI-Specific Security Validation Tests', () => {
    let testApp;
    
    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });
    
    test('should validate chatbot requests', async () => {
      testApp.post('/chatbot', validateChatbotRequest, (req, res) => {
        res.json({ success: true, validated: true });
      });
      testApp.use(errorHandlerMiddleware);
      
      const validRequest = {
        message: 'Cây của tôi có lá vàng',
        userId: 123,
        plantId: 1,
        sessionId: 'test-session',
        language: 'vi'
      };
      
      const response = await request(testApp)
        .post('/chatbot')
        .send(validRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should reject invalid chatbot requests', async () => {
      testApp.post('/chatbot', validateChatbotRequest, (req, res) => {
        res.json({ success: true });
      });
      testApp.use(errorHandlerMiddleware);
      
      const invalidRequest = {
        message: '<script>alert("xss")</script>',
        userId: 'invalid',
        language: 'invalid'
      };
      
      const response = await request(testApp)
        .post('/chatbot')
        .send(invalidRequest)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_005');
    });
    
    test('should validate irrigation requests', async () => {
      testApp.post('/irrigation/:plantId', validateIrrigationRequest, (req, res) => {
        res.json({ success: true, validated: true });
      });
      testApp.use(errorHandlerMiddleware);
      
      const validRequest = {
        sensorData: {
          soilMoisture: 45.5,
          temperature: 25.0,
          humidity: 60.0,
          lightLevel: 1000
        },
        weatherData: {
          temperature: 24.0,
          humidity: 65.0,
          precipitation: 0
        }
      };
      
      const response = await request(testApp)
        .post('/irrigation/123')
        .send(validRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should reject irrigation requests with invalid sensor data', async () => {
      testApp.post('/irrigation/:plantId', validateIrrigationRequest, (req, res) => {
        res.json({ success: true });
      });
      testApp.use(errorHandlerMiddleware);
      
      const invalidRequest = {
        sensorData: {
          soilMoisture: 150, // Invalid range
          temperature: 'invalid',
          humidity: -10 // Invalid range
        }
      };
      
      const response = await request(testApp)
        .post('/irrigation/123')
        .send(invalidRequest)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_005');
    });
  });

  describe('Error Handling and Fallback Tests', () => {
    test('should handle AIServiceError correctly', async () => {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        const error = new AIServiceError('AI_SERVICE_UNAVAILABLE', {
          service: 'test-service'
        });
        next(error);
      });
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .expect(503);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_001');
      expect(response.body.error.retryable).toBe(true);
      expect(response.body.fallback).toBeDefined();
    });
    
    test('should provide chatbot fallback responses', () => {
      const fallbackResponse = GracefulDegradation.chatbotFallback(
        'Cây của tôi có lá vàng',
        { userId: 123, plantId: 1 }
      );
      
      expect(fallbackResponse.success).toBe(false);
      expect(fallbackResponse.fallback).toBe(true);
      expect(fallbackResponse.response).toContain('sức khỏe cây');
      expect(fallbackResponse.specificTips).toBeInstanceOf(Array);
    });
    
    test('should provide disease detection fallback', () => {
      const fallbackResponse = GracefulDegradation.diseaseDetectionFallback({
        filename: 'test.jpg',
        size: 1024
      });
      
      expect(fallbackResponse.success).toBe(false);
      expect(fallbackResponse.fallback).toBe(true);
      expect(fallbackResponse.message).toContain('Không thể phân tích ảnh');
      expect(fallbackResponse.recommendations).toBeInstanceOf(Array);
    });
    
    test('should provide irrigation prediction fallback', () => {
      const fallbackResponse = GracefulDegradation.irrigationPredictionFallback({
        soilMoisture: 25,
        temperature: 35,
        humidity: 40
      });
      
      expect(fallbackResponse.success).toBe(false);
      expect(fallbackResponse.fallback).toBe(true);
      expect(fallbackResponse.prediction.shouldWater).toBe(true);
      expect(fallbackResponse.prediction.reason).toContain('Độ ẩm đất thấp');
    });
    
    test('should handle validation errors', async () => {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        next(error);
      });
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_005');
    });
    
    test('should handle multer file size errors', async () => {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        const error = new Error('File too large');
        error.code = 'LIMIT_FILE_SIZE';
        next(error);
      });
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .get('/test')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_004');
      expect(response.body.error.message).toContain('10MB');
    });
  });

  describe('Data Encryption and Privacy Tests', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = {
        message: 'Cây của tôi có lá vàng',
        userId: 123,
        timestamp: new Date().toISOString()
      };
      
      const encrypted = dataProtectionService.encrypt(testData);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      
      const decrypted = dataProtectionService.decrypt(encrypted);
      expect(decrypted).toEqual(testData);
    });
    
    test('should hash data with salt', () => {
      const testData = { userId: 123 };
      
      const hashed = dataProtectionService.hash(testData);
      expect(hashed.hash).toBeDefined();
      expect(hashed.salt).toBeDefined();
      expect(hashed.hash.length).toBe(128); // 64 bytes in hex
      expect(hashed.salt.length).toBe(32); // 16 bytes in hex
      
      // Same data should produce same hash with same salt
      const hashed2 = dataProtectionService.hash(testData, hashed.salt);
      expect(hashed2.hash).toBe(hashed.hash);
    });
    
    test('should encrypt chat history', async () => {
      const chatData = {
        user_message: 'Cây của tôi có lá vàng',
        ai_response: 'Lá vàng có thể do thiếu nước hoặc dinh dưỡng',
        plant_context: { plantId: 1, soilMoisture: 30 },
        userId: 123,
        timestamp: new Date().toISOString()
      };
      
      const encrypted = await dataProtectionService.encryptChatHistory(chatData);
      
      expect(encrypted.user_message).toBe('[ENCRYPTED]');
      expect(encrypted.ai_response).toBe('[ENCRYPTED]');
      expect(encrypted.plant_context).toBe('[ENCRYPTED]');
      expect(encrypted.encrypted_data).toBeDefined();
      expect(encrypted.encryption_version).toBe('1.0');
      
      const decrypted = await dataProtectionService.decryptChatHistory(encrypted);
      expect(decrypted.user_message).toBe(chatData.user_message);
      expect(decrypted.ai_response).toBe(chatData.ai_response);
    });
    
    test('should encrypt and store images securely', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const filename = 'test-image.jpg';
      const metadata = { plantId: 1, analysisType: 'disease' };
      
      const result = await dataProtectionService.encryptAndStoreImage(
        imageBuffer, 
        filename, 
        metadata
      );
      
      expect(result.secureFilename).toBeDefined();
      expect(result.encryptedPath).toBeDefined();
      expect(result.originalSize).toBe(imageBuffer.length);
      expect(result.storedAt).toBeDefined();
      
      // Verify file was created
      expect(fs.existsSync(result.encryptedPath)).toBe(true);
      
      // Retrieve and decrypt
      const retrieved = await dataProtectionService.retrieveAndDecryptImage(
        result.secureFilename
      );
      
      expect(retrieved.imageBuffer).toEqual(imageBuffer);
      expect(retrieved.metadata).toEqual(metadata);
      
      // Cleanup
      fs.unlinkSync(result.encryptedPath);
    });
    
    test('should anonymize user data', () => {
      const userData = {
        userId: 123,
        email: 'user@example.com',
        name: 'John Doe',
        ip: '192.168.1.1',
        phone: '+1234567890',
        message: 'Cây của tôi có lá vàng'
      };
      
      const anonymized = dataProtectionService.anonymizeUserData(userData);
      
      expect(anonymized.userId).not.toBe(userData.userId);
      expect(anonymized.email).toBe('[ANONYMIZED]');
      expect(anonymized.name).toBe('[ANONYMIZED]');
      expect(anonymized.ip).not.toBe(userData.ip);
      expect(anonymized.ip.length).toBe(16); // Hashed and truncated
      expect(anonymized.message).toBe(userData.message); // Not anonymized
    });
    
    test('should generate privacy report', async () => {
      const userId = 123;
      const report = await dataProtectionService.generatePrivacyReport(userId);
      
      expect(report.userId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.dataTypes).toBeDefined();
      expect(report.dataTypes.chatHistory).toBeDefined();
      expect(report.dataTypes.imageAnalysis).toBeDefined();
      expect(report.rights).toBeDefined();
      expect(report.contact).toBeDefined();
    });
  });

  describe('Privacy Middleware Tests', () => {
    let testApp;
    
    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });
    
    test('should log data access', async () => {
      testApp.use(privacyCompliance.logDataAccess);
      testApp.post('/chatbot', (req, res) => {
        expect(req.accessLog).toBeDefined();
        expect(req.accessLog.dataTypes).toContain('chat_history');
        res.json({ success: true });
      });
      
      await request(testApp)
        .post('/chatbot')
        .send({ userId: 123, message: 'test' })
        .expect(200);
    });
    
    test('should validate user consent', async () => {
      process.env.REQUIRE_USER_CONSENT = 'true';
      
      testApp.use(privacyCompliance.validateConsent);
      testApp.post('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      // Without consent
      const response1 = await request(testApp)
        .post('/test')
        .send({ userId: 123 })
        .expect(400);
      
      expect(response1.body.error.category).toBe('CONSENT_REQUIRED');
      
      // With consent
      const response2 = await request(testApp)
        .post('/test')
        .set('x-user-consent', 'data-processing')
        .send({ userId: 123 })
        .expect(200);
      
      expect(response2.body.success).toBe(true);
      
      process.env.REQUIRE_USER_CONSENT = 'false'; // Reset
    });
    
    test('should minimize response data', async () => {
      testApp.use(privacyCompliance.minimizeData);
      testApp.get('/test', (req, res) => {
        res.send({
          success: true,
          data: 'public data',
          encrypted_data: 'sensitive',
          internal_id: 'should-be-removed',
          debug_info: 'should-be-removed'
        });
      });
      
      const response = await request(testApp)
        .get('/test')
        .expect(200);
      
      const data = JSON.parse(response.text);
      expect(data.success).toBe(true);
      expect(data.data).toBe('public data');
      expect(data.encrypted_data).toBeUndefined();
      expect(data.internal_id).toBeUndefined();
      expect(data.debug_info).toBeUndefined();
    });
    
    test('should add privacy headers', async () => {
      testApp.use(privacyCompliance.addPrivacyHeaders);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      
      const response = await request(testApp)
        .get('/test')
        .expect(200);
      
      expect(response.headers['x-data-protection']).toBe('enabled');
      expect(response.headers['x-retention-policy']).toBe('applied');
      expect(response.headers['x-encryption']).toBe('aes-256-gcm');
      expect(response.headers['x-privacy-contact']).toBeDefined();
    });
    
    test('should handle data subject requests', async () => {
      testApp.use(privacyCompliance.handleDataSubjectRequest);
      testApp.post('/privacy-request', (req, res) => {
        res.json({ success: true, message: 'Request processed' });
      });
      
      const response = await request(testApp)
        .post('/privacy-request')
        .set('x-data-request-type', 'privacy-report')
        .send({ userId: 123 })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.requestType).toBe('privacy-report');
      expect(response.body.result).toBeDefined();
    });
  });

  describe('Data Retention Tests', () => {
    test('should have correct retention policies', () => {
      const status = dataRetentionService.getRetentionStatus();
      
      expect(status.retentionPolicies).toBeDefined();
      expect(status.retentionPolicies.chatHistory).toBe(90);
      expect(status.retentionPolicies.imageAnalysis).toBe(30);
      expect(status.retentionPolicies.sensorData).toBe(365);
      expect(status.retentionPolicies.errorLogs).toBe(30);
    });
    
    test('should perform manual cleanup', async () => {
      const result = await dataRetentionService.performManualCleanup('daily');
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('daily');
      expect(result.results).toBeDefined();
    });
    
    test('should reject invalid cleanup types', async () => {
      await expect(
        dataRetentionService.performManualCleanup('invalid')
      ).rejects.toThrow(AIServiceError);
    });
    
    test('should start and stop retention service', () => {
      const initialStatus = dataRetentionService.getRetentionStatus();
      
      if (!initialStatus.isRunning) {
        dataRetentionService.start();
        expect(dataRetentionService.getRetentionStatus().isRunning).toBe(true);
      }
      
      dataRetentionService.stop();
      expect(dataRetentionService.getRetentionStatus().isRunning).toBe(false);
    });
  });

  describe('Security Headers and CORS Tests', () => {
    let testApp;
    
    beforeEach(() => {
      testApp = express();
    });
    
    test('should add security headers', async () => {
      testApp.use(securityHeaders);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      
      const response = await request(testApp)
        .get('/test')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
    
    test('should validate CORS origins', () => {
      const allowedOrigins = corsOptions.origin;
      
      // Test with allowed origin
      const mockCallback = jest.fn();
      if (typeof allowedOrigins === 'function') {
        allowedOrigins('http://localhost:3000', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      }
    });
  });

  describe('File Upload Security Tests', () => {
    test('should validate image file headers', async () => {
      // Create a fake JPEG file with proper header
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const fakeJpegData = Buffer.concat([jpegHeader, Buffer.alloc(100)]);
      
      const mockFile = {
        buffer: fakeJpegData,
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: fakeJpegData.length
      };
      
      const testApp = express();
      testApp.use((req, res, next) => {
        req.file = mockFile;
        next();
      });
      testApp.use(validateUploadSecurity);
      testApp.post('/upload', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .post('/upload')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should reject files with invalid headers', async () => {
      // Create a fake file with invalid header
      const invalidHeader = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const fakeData = Buffer.concat([invalidHeader, Buffer.alloc(100)]);
      
      const mockFile = {
        buffer: fakeData,
        originalname: 'fake.jpg',
        mimetype: 'image/jpeg',
        size: fakeData.length
      };
      
      const testApp = express();
      testApp.use((req, res, next) => {
        req.file = mockFile;
        next();
      });
      testApp.use(validateUploadSecurity);
      testApp.post('/upload', (req, res) => res.json({ success: true }));
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .post('/upload')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_005');
    });
  });

  describe('Integration Security Tests', () => {
    test('should handle complete security pipeline', async () => {
      const testApp = express();
      testApp.use(express.json());
      
      // Apply all security middleware
      testApp.use(securityHeaders);
      testApp.use(sanitizeRequest);
      testApp.use(privacyCompliance.logDataAccess);
      testApp.use(privacyCompliance.addPrivacyHeaders);
      testApp.use(rateLimiters.general.middleware());
      
      testApp.post('/secure-endpoint', validateChatbotRequest, (req, res) => {
        res.json({
          success: true,
          message: 'Security pipeline passed',
          sanitized: req.body.message
        });
      });
      
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .post('/secure-endpoint')
        .send({
          message: 'Cây của tôi có lá vàng',
          userId: 123,
          plantId: 1
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.headers['x-data-protection']).toBe('enabled');
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
    
    test('should handle security violations gracefully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(rateLimiters.general.middleware());
      
      testApp.post('/test', validateChatbotRequest, (req, res) => {
        res.json({ success: true });
      });
      
      testApp.use(errorHandlerMiddleware);
      
      const response = await request(testApp)
        .post('/test')
        .send({
          message: '<script>alert("xss")</script>',
          userId: 'invalid'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AI_005');
    });
  });
});