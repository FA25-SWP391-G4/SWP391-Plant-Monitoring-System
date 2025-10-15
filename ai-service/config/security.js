const { logger } = require('../utils/errorHandler');

// Security configuration
const securityConfig = {
  // Rate limiting settings
  rateLimiting: {
    general: {
      windowMs: 60000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
    },
    chatbot: {
      windowMs: 60000, // 1 minute
      max: 30, // 30 requests per minute for chatbot
      message: 'Quá nhiều tin nhắn, vui lòng chờ một chút trước khi gửi tiếp'
    },
    imageUpload: {
      windowMs: 60000, // 1 minute
      max: 10, // 10 image uploads per minute
      message: 'Quá nhiều ảnh được tải lên, vui lòng chờ một chút'
    },
    health: {
      windowMs: 60000, // 1 minute
      max: 60, // 60 health checks per minute
      message: 'Quá nhiều kiểm tra sức khỏe hệ thống'
    }
  },
  
  // File upload security
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFiles: 1,
    // Virus scanning (placeholder for future implementation)
    virusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true',
    // Image validation
    validateImageHeaders: true,
    // Quarantine suspicious files
    quarantineSuspicious: true
  },
  
  // Input validation
  validation: {
    message: {
      maxLength: 2000,
      minLength: 1,
      allowedCharacters: /^[\w\s\u00C0-\u024F\u1E00-\u1EFF\u0100-\u017F\u0180-\u024F.,!?()-]+$/,
      suspiciousPatterns: [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.cookie/i,
        /window\.location/i
      ]
    },
    userId: {
      type: 'number',
      min: 1,
      max: 999999999
    },
    plantId: {
      type: 'number',
      min: 1,
      max: 999999999,
      default: 1
    },
    sensorData: {
      soilMoisture: { min: 0, max: 100 },
      temperature: { min: -50, max: 80 },
      humidity: { min: 0, max: 100 },
      lightLevel: { min: 0, max: 100000 }
    }
  },
  
  // CORS settings
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3010',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:3010'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ]
  },
  
  // Authentication settings
  authentication: {
    // JWT settings (for future implementation)
    jwt: {
      secret: process.env.JWT_SECRET || 'ai-service-secret-key',
      expiresIn: '24h',
      issuer: 'ai-service',
      audience: 'plant-monitoring-system'
    },
    
    // API Key settings
    apiKey: {
      required: process.env.NODE_ENV === 'production',
      keys: [
        process.env.API_KEY,
        process.env.FRONTEND_API_KEY,
        process.env.NODE_ENV === 'development' ? 'development-key' : null
      ].filter(Boolean),
      headerName: 'x-api-key',
      queryParam: 'apiKey'
    }
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Permitted-Cross-Domain-Policies': 'none'
  },
  
  // Logging and monitoring
  logging: {
    logSuspiciousActivity: true,
    logFailedAuthentication: true,
    logRateLimitExceeded: true,
    logFileUploadAttempts: true,
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Content filtering
  contentFiltering: {
    // Plant-related keywords for chatbot validation
    plantKeywords: [
      'cây', 'plant', 'lá', 'leaf', 'leaves', 'tưới', 'water', 'watering',
      'bệnh', 'disease', 'sick', 'phân', 'fertilizer', 'đất', 'soil',
      'ánh sáng', 'light', 'sunlight', 'nhiệt độ', 'temperature',
      'độ ẩm', 'humidity', 'moisture', 'sâu', 'pest', 'insect',
      'trồng', 'grow', 'growing', 'chăm sóc', 'care', 'caring',
      'hoa', 'flower', 'bloom', 'quả', 'fruit', 'rễ', 'root',
      'thân', 'stem', 'cành', 'branch', 'nụ', 'bud'
    ],
    
    // Minimum plant relevance score (0-1)
    minPlantRelevanceScore: 0.3,
    
    // Enable strict plant-only mode
    strictPlantMode: process.env.STRICT_PLANT_MODE === 'true'
  }
};

// Validate security configuration
const validateSecurityConfig = () => {
  const errors = [];
  
  // Check required environment variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
    
    if (!process.env.API_KEY) {
      errors.push('API_KEY is required in production');
    }
  }
  
  // Validate rate limiting settings
  Object.entries(securityConfig.rateLimiting).forEach(([key, config]) => {
    if (!config.windowMs || !config.max) {
      errors.push(`Invalid rate limiting config for ${key}`);
    }
  });
  
  // Validate file upload settings
  if (securityConfig.fileUpload.maxSize <= 0) {
    errors.push('File upload max size must be positive');
  }
  
  if (securityConfig.fileUpload.allowedTypes.length === 0) {
    errors.push('At least one file type must be allowed');
  }
  
  if (errors.length > 0) {
    logger.error('Security configuration validation failed', { errors });
    throw new Error(`Security configuration errors: ${errors.join(', ')}`);
  }
  
  logger.info('Security configuration validated successfully');
};

// Initialize security configuration
const initializeSecurity = () => {
  try {
    validateSecurityConfig();
    
    // Add environment-specific origins to CORS
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
      securityConfig.cors.origin.push(...envOrigins);
    }
    
    logger.info('Security configuration initialized', {
      environment: process.env.NODE_ENV,
      rateLimitingEnabled: true,
      corsOriginsCount: securityConfig.cors.origin.length,
      authenticationRequired: securityConfig.authentication.apiKey.required,
      fileUploadMaxSize: securityConfig.fileUpload.maxSize,
      strictPlantMode: securityConfig.contentFiltering.strictPlantMode
    });
    
    return securityConfig;
  } catch (error) {
    logger.error('Failed to initialize security configuration', { error: error.message });
    throw error;
  }
};

module.exports = {
  securityConfig,
  validateSecurityConfig,
  initializeSecurity
};