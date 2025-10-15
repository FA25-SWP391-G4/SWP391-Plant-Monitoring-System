const { logger, AIServiceError } = require('../utils/errorHandler');
const { validateAndSanitize } = require('./securityMiddleware');

// Chatbot-specific security validation
const validateChatbotRequest = (req, res, next) => {
  try {
    const { message, userId, plantId, sessionId, language } = req.body;
    
    // Validate and sanitize message
    if (message) {
      req.body.message = validateAndSanitize.validateMessage(message);
    }
    
    // Validate user ID
    if (userId) {
      req.body.userId = validateAndSanitize.validateUserId(userId);
    }
    
    // Validate plant ID
    if (plantId !== undefined) {
      req.body.plantId = validateAndSanitize.validatePlantId(plantId);
    }
    
    // Validate session ID
    if (sessionId && typeof sessionId !== 'string') {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'sessionId',
        value: typeof sessionId,
        requirement: 'Session ID must be a string'
      });
    }
    
    // Validate language
    if (language && !['vi', 'en'].includes(language)) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'language',
        value: language,
        requirement: 'Language must be "vi" or "en"'
      });
    }
    
    // Check for plant-related content
    if (message) {
      const plantKeywords = [
        'cây', 'plant', 'lá', 'leaf', 'tưới', 'water', 'bệnh', 'disease',
        'phân', 'fertilizer', 'đất', 'soil', 'ánh sáng', 'light', 'nhiệt độ', 'temperature',
        'độ ẩm', 'humidity', 'sâu', 'pest', 'trồng', 'grow', 'chăm sóc', 'care'
      ];
      
      const messageWords = message.toLowerCase().split(/\s+/);
      const hasPlantKeyword = plantKeywords.some(keyword => 
        messageWords.some(word => word.includes(keyword.toLowerCase()))
      );
      
      // Log non-plant questions for monitoring
      if (!hasPlantKeyword) {
        logger.info('Non-plant question detected', {
          message: message.substring(0, 100),
          userId,
          plantId
        });
      }
    }
    
    logger.info('Chatbot request validated', {
      userId,
      plantId,
      messageLength: message?.length,
      hasSessionId: !!sessionId
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// Disease detection security validation
const validateDiseaseDetectionRequest = (req, res, next) => {
  try {
    const { plantId } = req.params;
    const file = req.file;
    
    // Validate plant ID from params
    if (plantId) {
      req.params.plantId = validateAndSanitize.validatePlantId(plantId);
    }
    
    // Validate file upload
    if (file) {
      validateAndSanitize.validateFileUpload(file);
      
      // Additional security checks for image files
      const suspiciousExtensions = ['.php', '.asp', '.jsp', '.exe', '.bat', '.cmd'];
      const filename = file.originalname.toLowerCase();
      
      for (const ext of suspiciousExtensions) {
        if (filename.includes(ext)) {
          throw new AIServiceError('VALIDATION_ERROR', {
            field: 'file.extension',
            value: ext,
            requirement: 'File contains suspicious extension'
          });
        }
      }
      
      // Check for double extensions (e.g., image.jpg.php)
      const parts = filename.split('.');
      if (parts.length > 2) {
        logger.warn('File with multiple extensions detected', {
          filename: file.originalname,
          parts
        });
      }
    }
    
    logger.info('Disease detection request validated', {
      plantId: req.params.plantId,
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.mimetype
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// Irrigation prediction security validation
const validateIrrigationRequest = (req, res, next) => {
  try {
    const { plantId } = req.params;
    const { sensorData, weatherData } = req.body;
    
    // Validate plant ID
    if (plantId) {
      req.params.plantId = validateAndSanitize.validatePlantId(plantId);
    }
    
    // Validate sensor data structure
    if (sensorData) {
      const requiredFields = ['soilMoisture', 'temperature', 'humidity'];
      const numericFields = ['soilMoisture', 'temperature', 'humidity', 'lightLevel'];
      
      for (const field of requiredFields) {
        if (sensorData[field] === undefined || sensorData[field] === null) {
          throw new AIServiceError('VALIDATION_ERROR', {
            field: `sensorData.${field}`,
            value: sensorData[field],
            requirement: `${field} is required in sensor data`
          });
        }
      }
      
      for (const field of numericFields) {
        if (sensorData[field] !== undefined) {
          const value = parseFloat(sensorData[field]);
          if (isNaN(value)) {
            throw new AIServiceError('VALIDATION_ERROR', {
              field: `sensorData.${field}`,
              value: sensorData[field],
              requirement: `${field} must be a valid number`
            });
          }
          
          // Validate reasonable ranges
          const ranges = {
            soilMoisture: [0, 100],
            temperature: [-50, 80],
            humidity: [0, 100],
            lightLevel: [0, 100000]
          };
          
          if (ranges[field]) {
            const [min, max] = ranges[field];
            if (value < min || value > max) {
              throw new AIServiceError('VALIDATION_ERROR', {
                field: `sensorData.${field}`,
                value: value,
                requirement: `${field} must be between ${min} and ${max}`
              });
            }
          }
          
          sensorData[field] = value;
        }
      }
    }
    
    // Validate weather data if provided
    if (weatherData) {
      const numericWeatherFields = ['temperature', 'humidity', 'precipitation'];
      
      for (const field of numericWeatherFields) {
        if (weatherData[field] !== undefined) {
          const value = parseFloat(weatherData[field]);
          if (isNaN(value)) {
            throw new AIServiceError('VALIDATION_ERROR', {
              field: `weatherData.${field}`,
              value: weatherData[field],
              requirement: `Weather ${field} must be a valid number`
            });
          }
          weatherData[field] = value;
        }
      }
    }
    
    logger.info('Irrigation request validated', {
      plantId: req.params.plantId,
      hasSensorData: !!sensorData,
      hasWeatherData: !!weatherData
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// API key validation for protected endpoints
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    logger.warn('API request without key', {
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // For development, allow requests without API key but log them
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    throw new AIServiceError('AUTHENTICATION_FAILED', {
      reason: 'API key is required'
    });
  }
  
  // Validate API key format and value
  const validApiKeys = [
    process.env.API_KEY,
    process.env.FRONTEND_API_KEY,
    'development-key' // For development only
  ].filter(Boolean);
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    throw new AIServiceError('AUTHENTICATION_FAILED', {
      reason: 'Invalid API key'
    });
  }
  
  logger.info('API key validated successfully', {
    keyPrefix: apiKey.substring(0, 8) + '...',
    ip: req.ip
  });
  
  next();
};

// Content Security Policy for file uploads
const validateUploadSecurity = (req, res, next) => {
  if (req.file) {
    const file = req.file;
    
    // Check file headers for additional security
    if (file.buffer) {
      const fileHeader = file.buffer.slice(0, 10);
      
      // Check for common image file signatures
      const imageSignatures = {
        'jpeg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47],
        'webp': [0x52, 0x49, 0x46, 0x46]
      };
      
      let isValidImage = false;
      for (const [format, signature] of Object.entries(imageSignatures)) {
        if (signature.every((byte, index) => fileHeader[index] === byte)) {
          isValidImage = true;
          break;
        }
      }
      
      if (!isValidImage) {
        logger.warn('File with invalid image signature detected', {
          filename: file.originalname,
          mimetype: file.mimetype,
          headerBytes: Array.from(fileHeader.slice(0, 4))
        });
        
        throw new AIServiceError('VALIDATION_ERROR', {
          field: 'file.content',
          reason: 'File content does not match image format'
        });
      }
    }
  }
  
  next();
};

module.exports = {
  validateChatbotRequest,
  validateDiseaseDetectionRequest,
  validateIrrigationRequest,
  validateApiKey,
  validateUploadSecurity
};