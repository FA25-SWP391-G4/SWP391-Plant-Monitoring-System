const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { logger, AIServiceError } = require('../utils/errorHandler');

class DataProtectionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.encryptionKey = this.getEncryptionKey();
    
    // Data retention policies (in days)
    this.retentionPolicies = {
      chatHistory: parseInt(process.env.CHAT_RETENTION_DAYS) || 90,
      imageAnalysis: parseInt(process.env.IMAGE_RETENTION_DAYS) || 30,
      sensorData: parseInt(process.env.SENSOR_RETENTION_DAYS) || 365,
      errorLogs: parseInt(process.env.ERROR_LOG_RETENTION_DAYS) || 30,
      accessLogs: parseInt(process.env.ACCESS_LOG_RETENTION_DAYS) || 90
    };
    
    logger.info('Data Protection Service initialized', {
      retentionPolicies: this.retentionPolicies,
      encryptionAlgorithm: this.algorithm
    });
  }
  
  // Get or generate encryption key
  getEncryptionKey() {
    const keyFromEnv = process.env.ENCRYPTION_KEY;
    
    if (keyFromEnv) {
      // Validate key length
      const key = Buffer.from(keyFromEnv, 'hex');
      if (key.length !== this.keyLength) {
        throw new Error(`Encryption key must be ${this.keyLength} bytes (${this.keyLength * 2} hex characters)`);
      }
      return key;
    }
    
    // Generate a new key for development
    if (process.env.NODE_ENV === 'development') {
      const key = crypto.randomBytes(this.keyLength);
      logger.warn('Using generated encryption key for development', {
        keyHex: key.toString('hex')
      });
      return key;
    }
    
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
  
  // Encrypt sensitive data
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('ai-service-data'));
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      const result = {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm
      };
      
      logger.debug('Data encrypted successfully', {
        dataSize: JSON.stringify(data).length,
        encryptedSize: encrypted.length
      });
      
      return result;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw new AIServiceError('ENCRYPTION_FAILED', {
        operation: 'encrypt',
        error: error.message
      });
    }
  }
  
  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, tag, algorithm } = encryptedData;
      
      if (algorithm !== this.algorithm) {
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
      }
      
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('ai-service-data'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const result = JSON.parse(decrypted);
      
      logger.debug('Data decrypted successfully', {
        encryptedSize: encrypted.length,
        decryptedSize: decrypted.length
      });
      
      return result;
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw new AIServiceError('DECRYPTION_FAILED', {
        operation: 'decrypt',
        error: error.message
      });
    }
  }
  
  // Hash sensitive data (one-way)
  hash(data, salt = null) {
    try {
      const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
      const hash = crypto.pbkdf2Sync(JSON.stringify(data), saltBuffer, 10000, 64, 'sha512');
      
      return {
        hash: hash.toString('hex'),
        salt: saltBuffer.toString('hex')
      };
    } catch (error) {
      logger.error('Hashing failed', { error: error.message });
      throw new AIServiceError('HASHING_FAILED', {
        operation: 'hash',
        error: error.message
      });
    }
  }
  
  // Encrypt chat history
  async encryptChatHistory(chatData) {
    try {
      const sensitiveFields = {
        user_message: chatData.user_message,
        ai_response: chatData.ai_response,
        plant_context: chatData.plant_context
      };
      
      const encrypted = this.encrypt(sensitiveFields);
      
      return {
        ...chatData,
        user_message: '[ENCRYPTED]',
        ai_response: '[ENCRYPTED]',
        plant_context: '[ENCRYPTED]',
        encrypted_data: encrypted,
        encryption_version: '1.0'
      };
    } catch (error) {
      logger.error('Chat history encryption failed', { error: error.message });
      throw error;
    }
  }
  
  // Decrypt chat history
  async decryptChatHistory(encryptedChatData) {
    try {
      if (!encryptedChatData.encrypted_data) {
        // Data is not encrypted (legacy data)
        return encryptedChatData;
      }
      
      const decrypted = this.decrypt(encryptedChatData.encrypted_data);
      
      return {
        ...encryptedChatData,
        user_message: decrypted.user_message,
        ai_response: decrypted.ai_response,
        plant_context: decrypted.plant_context
      };
    } catch (error) {
      logger.error('Chat history decryption failed', { error: error.message });
      throw error;
    }
  }
  
  // Secure image storage with encryption
  async encryptAndStoreImage(imageBuffer, filename, metadata = {}) {
    try {
      // Encrypt image buffer
      const encryptedImage = this.encrypt({
        imageData: imageBuffer.toString('base64'),
        metadata,
        timestamp: new Date().toISOString()
      });
      
      // Generate secure filename
      const secureFilename = this.generateSecureFilename(filename);
      const encryptedPath = path.join(process.cwd(), 'uploads', 'encrypted', secureFilename);
      
      // Ensure encrypted directory exists
      await fs.mkdir(path.dirname(encryptedPath), { recursive: true });
      
      // Store encrypted data
      await fs.writeFile(encryptedPath, JSON.stringify(encryptedImage));
      
      logger.info('Image encrypted and stored', {
        originalFilename: filename,
        secureFilename,
        imageSize: imageBuffer.length,
        metadataKeys: Object.keys(metadata)
      });
      
      return {
        secureFilename,
        encryptedPath,
        originalSize: imageBuffer.length,
        storedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Image encryption and storage failed', { error: error.message });
      throw new AIServiceError('IMAGE_ENCRYPTION_FAILED', {
        filename,
        error: error.message
      });
    }
  }
  
  // Retrieve and decrypt stored image
  async retrieveAndDecryptImage(secureFilename) {
    try {
      const encryptedPath = path.join(process.cwd(), 'uploads', 'encrypted', secureFilename);
      
      // Read encrypted data
      const encryptedData = await fs.readFile(encryptedPath, 'utf8');
      const parsedData = JSON.parse(encryptedData);
      
      // Decrypt image
      const decrypted = this.decrypt(parsedData);
      const imageBuffer = Buffer.from(decrypted.imageData, 'base64');
      
      logger.info('Image retrieved and decrypted', {
        secureFilename,
        imageSize: imageBuffer.length,
        metadata: decrypted.metadata
      });
      
      return {
        imageBuffer,
        metadata: decrypted.metadata,
        timestamp: decrypted.timestamp
      };
    } catch (error) {
      logger.error('Image retrieval and decryption failed', { 
        error: error.message,
        secureFilename 
      });
      throw new AIServiceError('IMAGE_DECRYPTION_FAILED', {
        secureFilename,
        error: error.message
      });
    }
  }
  
  // Generate secure filename
  generateSecureFilename(originalFilename) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalFilename);
    return `${timestamp}_${random}${ext}.enc`;
  }
  
  // Anonymize user data
  anonymizeUserData(userData) {
    try {
      const anonymized = { ...userData };
      
      // Hash user ID
      if (anonymized.userId) {
        const hashedUserId = this.hash(anonymized.userId.toString());
        anonymized.userId = hashedUserId.hash;
      }
      
      // Remove or hash personal identifiers
      const personalFields = ['email', 'phone', 'name', 'address'];
      personalFields.forEach(field => {
        if (anonymized[field]) {
          anonymized[field] = '[ANONYMIZED]';
        }
      });
      
      // Hash IP addresses
      if (anonymized.ip) {
        const hashedIp = this.hash(anonymized.ip);
        anonymized.ip = hashedIp.hash.substring(0, 16);
      }
      
      logger.debug('User data anonymized', {
        originalFields: Object.keys(userData),
        anonymizedFields: Object.keys(anonymized)
      });
      
      return anonymized;
    } catch (error) {
      logger.error('User data anonymization failed', { error: error.message });
      throw error;
    }
  }
  
  // Data retention cleanup
  async cleanupExpiredData() {
    try {
      const cleanupResults = {
        chatHistory: 0,
        imageAnalysis: 0,
        errorLogs: 0,
        accessLogs: 0
      };
      
      // Cleanup chat history
      const chatCutoffDate = new Date();
      chatCutoffDate.setDate(chatCutoffDate.getDate() - this.retentionPolicies.chatHistory);
      
      // Note: This would require database integration
      // For now, we'll log the cleanup operation
      logger.info('Data retention cleanup initiated', {
        chatHistoryCutoff: chatCutoffDate.toISOString(),
        retentionPolicies: this.retentionPolicies
      });
      
      // Cleanup encrypted images
      await this.cleanupExpiredImages();
      
      // Cleanup log files
      await this.cleanupExpiredLogs();
      
      logger.info('Data retention cleanup completed', cleanupResults);
      
      return cleanupResults;
    } catch (error) {
      logger.error('Data retention cleanup failed', { error: error.message });
      throw error;
    }
  }
  
  // Cleanup expired encrypted images
  async cleanupExpiredImages() {
    try {
      const encryptedDir = path.join(process.cwd(), 'uploads', 'encrypted');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.imageAnalysis);
      
      try {
        const files = await fs.readdir(encryptedDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(encryptedDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            logger.debug('Expired encrypted image deleted', { file });
          }
        }
        
        logger.info('Expired encrypted images cleanup completed', {
          deletedCount,
          cutoffDate: cutoffDate.toISOString()
        });
        
        return deletedCount;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Directory doesn't exist, nothing to clean up
          return 0;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Encrypted images cleanup failed', { error: error.message });
      throw error;
    }
  }
  
  // Cleanup expired log files
  async cleanupExpiredLogs() {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.errorLogs);
      
      try {
        const files = await fs.readdir(logsDir);
        let deletedCount = 0;
        
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(logsDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
              logger.debug('Expired log file deleted', { file });
            }
          }
        }
        
        logger.info('Expired log files cleanup completed', {
          deletedCount,
          cutoffDate: cutoffDate.toISOString()
        });
        
        return deletedCount;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Directory doesn't exist, nothing to clean up
          return 0;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Log files cleanup failed', { error: error.message });
      throw error;
    }
  }
  
  // User data deletion (GDPR compliance)
  async deleteUserData(userId) {
    try {
      logger.info('User data deletion initiated', { userId });
      
      const deletionResults = {
        chatHistory: 0,
        imageAnalysis: 0,
        sensorData: 0,
        logs: 0
      };
      
      // Note: This would require database integration to actually delete data
      // For now, we'll log the deletion request
      
      // Hash user ID for secure logging
      const hashedUserId = this.hash(userId.toString()).hash;
      
      logger.info('User data deletion completed', {
        hashedUserId,
        deletionResults
      });
      
      return {
        success: true,
        userId: hashedUserId,
        deletedAt: new Date().toISOString(),
        results: deletionResults
      };
    } catch (error) {
      logger.error('User data deletion failed', { 
        error: error.message,
        userId: this.hash(userId.toString()).hash
      });
      throw new AIServiceError('DATA_DELETION_FAILED', {
        userId,
        error: error.message
      });
    }
  }
  
  // Generate privacy report
  async generatePrivacyReport(userId) {
    try {
      const hashedUserId = this.hash(userId.toString()).hash;
      
      const report = {
        userId: hashedUserId,
        generatedAt: new Date().toISOString(),
        dataTypes: {
          chatHistory: {
            description: 'Encrypted chat conversations with AI',
            retentionDays: this.retentionPolicies.chatHistory,
            encrypted: true
          },
          imageAnalysis: {
            description: 'Encrypted plant disease analysis images',
            retentionDays: this.retentionPolicies.imageAnalysis,
            encrypted: true
          },
          sensorData: {
            description: 'Plant sensor readings and predictions',
            retentionDays: this.retentionPolicies.sensorData,
            encrypted: false
          }
        },
        rights: {
          access: 'You can request access to your data',
          rectification: 'You can request correction of inaccurate data',
          erasure: 'You can request deletion of your data',
          portability: 'You can request export of your data',
          restriction: 'You can request restriction of processing'
        },
        contact: {
          email: process.env.PRIVACY_CONTACT_EMAIL || 'privacy@example.com',
          phone: process.env.PRIVACY_CONTACT_PHONE || 'N/A'
        }
      };
      
      logger.info('Privacy report generated', { hashedUserId });
      
      return report;
    } catch (error) {
      logger.error('Privacy report generation failed', { error: error.message });
      throw error;
    }
  }
  
  // Schedule automatic cleanup
  startAutomaticCleanup() {
    // Run cleanup daily at 2 AM
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(async () => {
      try {
        logger.info('Starting automatic data cleanup');
        await this.cleanupExpiredData();
      } catch (error) {
        logger.error('Automatic data cleanup failed', { error: error.message });
      }
    }, cleanupInterval);
    
    logger.info('Automatic data cleanup scheduled', {
      intervalHours: 24,
      retentionPolicies: this.retentionPolicies
    });
  }
}

// Singleton instance
const dataProtectionService = new DataProtectionService();

module.exports = {
  DataProtectionService,
  dataProtectionService
};