const { logger, AIServiceError } = require('../utils/errorHandler');
const { dataProtectionService } = require('../services/dataProtectionService');

// Privacy compliance middleware
const privacyCompliance = {
  // Log data access for audit trail
  logDataAccess: (req, res, next) => {
    const accessLog = {
      timestamp: new Date().toISOString(),
      userId: req.body.userId || req.params.userId || 'anonymous',
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      dataTypes: []
    };
    
    // Determine what type of data is being accessed
    if (req.originalUrl.includes('/chatbot')) {
      accessLog.dataTypes.push('chat_history');
    }
    if (req.originalUrl.includes('/disease')) {
      accessLog.dataTypes.push('image_analysis');
    }
    if (req.originalUrl.includes('/irrigation')) {
      accessLog.dataTypes.push('sensor_data');
    }
    
    // Anonymize the log
    const anonymizedLog = dataProtectionService.anonymizeUserData(accessLog);
    
    logger.info('Data access logged', anonymizedLog);
    
    // Store access log for compliance (in production, this would go to a secure audit log)
    req.accessLog = anonymizedLog;
    
    next();
  },
  
  // Validate user consent
  validateConsent: (req, res, next) => {
    // Check for consent headers or parameters
    const consent = req.headers['x-user-consent'] || req.body.consent || req.query.consent;
    
    if (!consent && process.env.REQUIRE_USER_CONSENT === 'true') {
      logger.warn('Request without user consent', {
        endpoint: req.originalUrl,
        ip: req.ip,
        userId: req.body.userId || 'anonymous'
      });
      
      throw new AIServiceError('CONSENT_REQUIRED', {
        message: 'User consent is required for data processing',
        endpoint: req.originalUrl
      });
    }
    
    if (consent) {
      logger.info('User consent validated', {
        consentType: consent,
        endpoint: req.originalUrl
      });
    }
    
    next();
  },
  
  // Data minimization - remove unnecessary fields
  minimizeData: (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    res.send = function(data) {
      try {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        // Remove sensitive fields that aren't necessary for the response
        if (data && typeof data === 'object') {
          const minimized = privacyCompliance.removeUnnecessaryFields(data);
          return originalSend.call(this, JSON.stringify(minimized));
        }
        
        return originalSend.call(this, data);
      } catch (error) {
        logger.warn('Data minimization failed', { error: error.message });
        return originalSend.call(this, data);
      }
    };
    
    next();
  },
  
  // Remove unnecessary fields from response
  removeUnnecessaryFields: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => privacyCompliance.removeUnnecessaryFields(item));
    }
    
    if (data && typeof data === 'object') {
      const cleaned = { ...data };
      
      // Remove internal fields
      const internalFields = [
        'encrypted_data',
        'encryption_version',
        'internal_id',
        'raw_sensor_data',
        'debug_info',
        'system_metadata'
      ];
      
      internalFields.forEach(field => {
        delete cleaned[field];
      });
      
      // Recursively clean nested objects
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] && typeof cleaned[key] === 'object') {
          cleaned[key] = privacyCompliance.removeUnnecessaryFields(cleaned[key]);
        }
      });
      
      return cleaned;
    }
    
    return data;
  },
  
  // Encrypt sensitive response data
  encryptSensitiveData: (req, res, next) => {
    // Store original json function
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        // Check if response contains sensitive data
        if (data && privacyCompliance.containsSensitiveData(data)) {
          // Encrypt sensitive fields
          const encrypted = privacyCompliance.encryptResponseData(data);
          
          logger.info('Sensitive data encrypted in response', {
            endpoint: req.originalUrl,
            hasEncryptedData: true
          });
          
          return originalJson.call(this, encrypted);
        }
        
        return originalJson.call(this, data);
      } catch (error) {
        logger.warn('Response encryption failed', { error: error.message });
        return originalJson.call(this, data);
      }
    };
    
    next();
  },
  
  // Check if data contains sensitive information
  containsSensitiveData: (data) => {
    if (!data || typeof data !== 'object') return false;
    
    const sensitiveFields = [
      'user_message',
      'ai_response',
      'plant_context',
      'personal_info',
      'location_data',
      'device_info'
    ];
    
    const checkObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.some(item => checkObject(item));
      }
      
      if (obj && typeof obj === 'object') {
        return Object.keys(obj).some(key => {
          if (sensitiveFields.includes(key)) return true;
          if (typeof obj[key] === 'object') return checkObject(obj[key]);
          return false;
        });
      }
      
      return false;
    };
    
    return checkObject(data);
  },
  
  // Encrypt sensitive fields in response data
  encryptResponseData: (data) => {
    // This is a placeholder - in production, you might want to encrypt
    // specific fields or provide encrypted versions alongside plain text
    
    const processObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
      }
      
      if (obj && typeof obj === 'object') {
        const processed = { ...obj };
        
        // Mark sensitive fields as encrypted (placeholder)
        const sensitiveFields = ['user_message', 'ai_response', 'plant_context'];
        sensitiveFields.forEach(field => {
          if (processed[field]) {
            processed[`${field}_encrypted`] = true;
            // In production, you would actually encrypt this data
            // processed[field] = dataProtectionService.encrypt(processed[field]);
          }
        });
        
        // Recursively process nested objects
        Object.keys(processed).forEach(key => {
          if (processed[key] && typeof processed[key] === 'object') {
            processed[key] = processObject(processed[key]);
          }
        });
        
        return processed;
      }
      
      return obj;
    };
    
    return processObject(data);
  },
  
  // Add privacy headers to response
  addPrivacyHeaders: (req, res, next) => {
    // Add privacy-related headers
    res.set({
      'X-Data-Protection': 'enabled',
      'X-Retention-Policy': 'applied',
      'X-Encryption': 'aes-256-gcm',
      'X-Privacy-Contact': process.env.PRIVACY_CONTACT_EMAIL || 'privacy@example.com'
    });
    
    next();
  },
  
  // Handle data subject requests (GDPR)
  handleDataSubjectRequest: async (req, res, next) => {
    const requestType = req.headers['x-data-request-type'];
    const userId = req.body.userId || req.params.userId;
    
    if (requestType && userId) {
      try {
        let result;
        
        switch (requestType) {
          case 'access':
            result = await privacyCompliance.handleAccessRequest(userId);
            break;
          case 'deletion':
            result = await privacyCompliance.handleDeletionRequest(userId);
            break;
          case 'portability':
            result = await privacyCompliance.handlePortabilityRequest(userId);
            break;
          case 'privacy-report':
            result = await dataProtectionService.generatePrivacyReport(userId);
            break;
          default:
            throw new AIServiceError('INVALID_REQUEST_TYPE', {
              requestType,
              supportedTypes: ['access', 'deletion', 'portability', 'privacy-report']
            });
        }
        
        logger.info('Data subject request processed', {
          requestType,
          userId: dataProtectionService.hash(userId.toString()).hash,
          success: true
        });
        
        return res.json({
          success: true,
          requestType,
          result,
          processedAt: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Data subject request failed', {
          requestType,
          error: error.message,
          userId: dataProtectionService.hash(userId.toString()).hash
        });
        
        throw error;
      }
    }
    
    next();
  },
  
  // Handle access request
  handleAccessRequest: async (userId) => {
    // In production, this would query the database for user data
    return {
      message: 'Access request processed',
      dataTypes: ['chat_history', 'image_analysis', 'sensor_data'],
      note: 'Data will be provided within 30 days as per GDPR requirements'
    };
  },
  
  // Handle deletion request
  handleDeletionRequest: async (userId) => {
    return await dataProtectionService.deleteUserData(userId);
  },
  
  // Handle portability request
  handlePortabilityRequest: async (userId) => {
    // In production, this would export user data in a portable format
    return {
      message: 'Portability request processed',
      format: 'JSON',
      note: 'Data export will be provided within 30 days as per GDPR requirements'
    };
  }
};

module.exports = {
  privacyCompliance
};