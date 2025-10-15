const { logger, AIServiceError } = require('../utils/errorHandler');

// Simple rate limiting implementation
class RateLimiter {
  constructor(windowMs = 60000, max = 100) {
    this.windowMs = windowMs;
    this.max = max;
    this.requests = new Map();
    
    // Clean up old entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > this.windowMs) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }
  
  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      let requestData = this.requests.get(key);
      
      if (!requestData || now - requestData.resetTime > this.windowMs) {
        requestData = {
          count: 0,
          resetTime: now
        };
        this.requests.set(key, requestData);
      }
      
      requestData.count++;
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.max,
        'X-RateLimit-Remaining': Math.max(0, this.max - requestData.count),
        'X-RateLimit-Reset': new Date(requestData.resetTime + this.windowMs)
      });
      
      if (requestData.count > this.max) {
        logger.warn('Rate limit exceeded', {
          key,
          count: requestData.count,
          limit: this.max,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        const error = new AIServiceError('RATE_LIMIT_EXCEEDED', {
          limit: this.max,
          windowMs: this.windowMs,
          current: requestData.count
        });
        
        return next(error);
      }
      
      next();
    };
  }
  
  getKey(req) {
    // Use IP address and user agent for rate limiting key
    return `${req.ip}:${req.get('User-Agent') || 'unknown'}`;
  }
}

// Input validation and sanitization
const validateAndSanitize = {
  // Sanitize string input
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },
  
  // Validate message content
  validateMessage: (message) => {
    if (!message || typeof message !== 'string') {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'message',
        value: message,
        requirement: 'Message must be a non-empty string'
      });
    }
    
    if (message.length > 2000) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'message',
        value: `${message.length} characters`,
        requirement: 'Message must be less than 2000 characters'
      });
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        logger.warn('Suspicious content detected in message', {
          pattern: pattern.toString(),
          message: message.substring(0, 100)
        });
        
        throw new AIServiceError('VALIDATION_ERROR', {
          field: 'message',
          reason: 'Suspicious content detected'
        });
      }
    }
    
    return validateAndSanitize.sanitizeString(message);
  },
  
  // Validate user ID
  validateUserId: (userId) => {
    if (!userId) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'userId',
        value: userId,
        requirement: 'User ID is required'
      });
    }
    
    if (typeof userId !== 'number' && typeof userId !== 'string') {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'userId',
        value: typeof userId,
        requirement: 'User ID must be a number or string'
      });
    }
    
    // Convert to number if string
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'userId',
        value: userId,
        requirement: 'User ID must be a positive number'
      });
    }
    
    return numericUserId;
  },
  
  // Validate plant ID
  validatePlantId: (plantId) => {
    if (plantId === undefined || plantId === null) {
      return 1; // Default plant ID
    }
    
    const numericPlantId = typeof plantId === 'string' ? parseInt(plantId) : plantId;
    
    if (isNaN(numericPlantId) || numericPlantId <= 0) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'plantId',
        value: plantId,
        requirement: 'Plant ID must be a positive number'
      });
    }
    
    return numericPlantId;
  },
  
  // Validate file upload
  validateFileUpload: (file) => {
    if (!file) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'file',
        value: 'null',
        requirement: 'File is required'
      });
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'file.size',
        value: `${file.size} bytes`,
        requirement: `File size must be less than ${maxSize} bytes (10MB)`
      });
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'file.mimetype',
        value: file.mimetype,
        requirement: `File type must be one of: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check filename for suspicious patterns
    const suspiciousFilenamePatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /\.(exe|bat|cmd|scr|pif|com)$/i  // Executable files
    ];
    
    for (const pattern of suspiciousFilenamePatterns) {
      if (pattern.test(file.originalname)) {
        throw new AIServiceError('VALIDATION_ERROR', {
          field: 'file.filename',
          value: file.originalname,
          requirement: 'Filename contains invalid characters'
        });
      }
    }
    
    return file;
  }
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3010',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:3010'
    ];
    
    // Add environment-specific origins
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS origin blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
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
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Permitted-Cross-Domain-Policies': 'none'
  });
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// Simple JWT authentication (basic implementation)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    // For now, allow requests without token but log them
    logger.info('Request without authentication token', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    return next();
  }
  
  try {
    // Basic token validation (in production, use proper JWT verification)
    if (token === process.env.API_KEY || token === 'development-token') {
      req.authenticated = true;
      req.user = { id: 'api-user' };
    } else {
      logger.warn('Invalid authentication token', {
        token: token.substring(0, 10) + '...',
        ip: req.ip
      });
    }
  } catch (error) {
    logger.error('Token authentication error', { error: error.message });
  }
  
  next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      if (req.body.message) {
        req.body.message = validateAndSanitize.sanitizeString(req.body.message);
      }
      
      if (req.body.userId) {
        req.body.userId = validateAndSanitize.validateUserId(req.body.userId);
      }
      
      if (req.body.plantId) {
        req.body.plantId = validateAndSanitize.validatePlantId(req.body.plantId);
      }
    }
    
    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = validateAndSanitize.sanitizeString(value);
        }
      }
    }
    
    // Sanitize params
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = validateAndSanitize.sanitizeString(value);
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Create rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter - 100 requests per minute
  general: new RateLimiter(60000, 100),
  
  // Chatbot rate limiter - 30 requests per minute (more restrictive)
  chatbot: new RateLimiter(60000, 30),
  
  // Image upload rate limiter - 10 requests per minute (most restrictive)
  imageUpload: new RateLimiter(60000, 10),
  
  // Health check rate limiter - 60 requests per minute
  health: new RateLimiter(60000, 60)
};

module.exports = {
  RateLimiter,
  rateLimiters,
  validateAndSanitize,
  corsOptions,
  securityHeaders,
  authenticateToken,
  sanitizeRequest
};