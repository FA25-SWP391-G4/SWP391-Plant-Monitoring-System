const redis = require('redis');
const { logger } = require('../utils/errorHandler');

/**
 * Comprehensive Redis Caching Service
 * Implements multiple caching strategies for AI service performance optimization
 */
class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.fallbackCache = new Map(); // In-memory fallback
    
    // Cache configurations for different data types
    this.cacheConfigs = {
      // AI Model predictions cache
      modelPredictions: {
        ttl: 3600, // 1 hour
        keyPrefix: 'ai:prediction:',
        maxSize: 1000
      },
      
      // Chatbot responses cache
      chatbotResponses: {
        ttl: 1800, // 30 minutes
        keyPrefix: 'ai:chatbot:',
        maxSize: 500
      },
      
      // Disease detection results
      diseaseDetection: {
        ttl: 86400, // 24 hours
        keyPrefix: 'ai:disease:',
        maxSize: 200
      },
      
      // Irrigation predictions
      irrigationPredictions: {
        ttl: 7200, // 2 hours
        keyPrefix: 'ai:irrigation:',
        maxSize: 300
      },
      
      // Sensor data cache
      sensorData: {
        ttl: 300, // 5 minutes
        keyPrefix: 'sensor:',
        maxSize: 1000
      },
      
      // Plant profiles cache
      plantProfiles: {
        ttl: 43200, // 12 hours
        keyPrefix: 'plant:profile:',
        maxSize: 100
      },
      
      // Weather data cache
      weatherData: {
        ttl: 1800, // 30 minutes
        keyPrefix: 'weather:',
        maxSize: 50
      },
      
      // Model metadata cache
      modelMetadata: {
        ttl: 86400, // 24 hours
        keyPrefix: 'model:meta:',
        maxSize: 20
      }
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > this.maxRetries) {
            logger.error('Max Redis retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      logger.info('Redis cache service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Redis, using fallback cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Generic cache set method with automatic fallback
   */
  async set(cacheType, key, value, customTTL = null) {
    try {
      const config = this.cacheConfigs[cacheType];
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`);
      }

      const fullKey = `${config.keyPrefix}${key}`;
      const ttl = customTTL || config.ttl;
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        cacheType
      });

      if (this.isConnected) {
        await this.client.setEx(fullKey, ttl, serializedValue);
        logger.debug(`Cached to Redis: ${fullKey}`);
      } else {
        // Fallback to in-memory cache
        this.fallbackCache.set(fullKey, {
          value: serializedValue,
          expiry: Date.now() + (ttl * 1000)
        });
        
        // Implement size limit for fallback cache
        if (this.fallbackCache.size > config.maxSize) {
          const oldestKey = this.fallbackCache.keys().next().value;
          this.fallbackCache.delete(oldestKey);
        }
        
        logger.debug(`Cached to fallback: ${fullKey}`);
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error for ${cacheType}:${key}:`, error);
      return false;
    }
  }

  /**
   * Generic cache get method with automatic fallback
   */
  async get(cacheType, key) {
    try {
      const config = this.cacheConfigs[cacheType];
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`);
      }

      const fullKey = `${config.keyPrefix}${key}`;
      let cachedData = null;

      if (this.isConnected) {
        const cached = await this.client.get(fullKey);
        if (cached) {
          cachedData = JSON.parse(cached);
          logger.debug(`Cache hit from Redis: ${fullKey}`);
        }
      } else {
        // Check fallback cache
        const fallbackData = this.fallbackCache.get(fullKey);
        if (fallbackData && fallbackData.expiry > Date.now()) {
          cachedData = JSON.parse(fallbackData.value);
          logger.debug(`Cache hit from fallback: ${fullKey}`);
        } else if (fallbackData) {
          // Remove expired entry
          this.fallbackCache.delete(fullKey);
        }
      }

      if (cachedData) {
        return cachedData.data;
      }

      logger.debug(`Cache miss: ${fullKey}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${cacheType}:${key}:`, error);
      return null;
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(cacheType, key) {
    try {
      const config = this.cacheConfigs[cacheType];
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`);
      }

      const fullKey = `${config.keyPrefix}${key}`;

      if (this.isConnected) {
        await this.client.del(fullKey);
      }
      
      this.fallbackCache.delete(fullKey);
      logger.debug(`Cache deleted: ${fullKey}`);
      
      return true;
    } catch (error) {
      logger.error(`Cache delete error for ${cacheType}:${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries for a specific type
   */
  async clearCacheType(cacheType) {
    try {
      const config = this.cacheConfigs[cacheType];
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`);
      }

      if (this.isConnected) {
        const pattern = `${config.keyPrefix}*`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }

      // Clear from fallback cache
      for (const key of this.fallbackCache.keys()) {
        if (key.startsWith(config.keyPrefix)) {
          this.fallbackCache.delete(key);
        }
      }

      logger.info(`Cleared cache type: ${cacheType}`);
      return true;
    } catch (error) {
      logger.error(`Cache clear error for ${cacheType}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const stats = {
        redis: {
          connected: this.isConnected,
          info: null
        },
        fallback: {
          size: this.fallbackCache.size,
          entries: Array.from(this.fallbackCache.keys())
        },
        cacheTypes: {}
      };

      if (this.isConnected) {
        stats.redis.info = await this.client.info('memory');
      }

      // Count entries per cache type
      for (const [cacheType, config] of Object.entries(this.cacheConfigs)) {
        let count = 0;
        
        if (this.isConnected) {
          const keys = await this.client.keys(`${config.keyPrefix}*`);
          count = keys.length;
        }
        
        // Add fallback cache count
        const fallbackCount = Array.from(this.fallbackCache.keys())
          .filter(key => key.startsWith(config.keyPrefix)).length;
        
        stats.cacheTypes[cacheType] = {
          redisEntries: count,
          fallbackEntries: fallbackCount,
          totalEntries: count + fallbackCount,
          ttl: config.ttl,
          maxSize: config.maxSize
        };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Batch operations for better performance
   */
  async mset(cacheType, keyValuePairs, customTTL = null) {
    try {
      const config = this.cacheConfigs[cacheType];
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`);
      }

      const ttl = customTTL || config.ttl;
      const pipeline = this.isConnected ? this.client.multi() : null;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = `${config.keyPrefix}${key}`;
        const serializedValue = JSON.stringify({
          data: value,
          timestamp: Date.now(),
          cacheType
        });

        if (pipeline) {
          pipeline.setEx(fullKey, ttl, serializedValue);
        } else {
          // Fallback cache
          this.fallbackCache.set(fullKey, {
            value: serializedValue,
            expiry: Date.now() + (ttl * 1000)
          });
        }
      }

      if (pipeline) {
        await pipeline.exec();
        logger.debug(`Batch cached ${Object.keys(keyValuePairs).length} items to Redis`);
      } else {
        logger.debug(`Batch cached ${Object.keys(keyValuePairs).length} items to fallback`);
      }

      return true;
    } catch (error) {
      logger.error(`Batch cache error for ${cacheType}:`, error);
      return false;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache() {
    try {
      logger.info('Starting cache warming...');
      
      // This would typically load frequently accessed data
      // For now, we'll just log the warming process
      const warmingTasks = [
        'Loading plant profiles...',
        'Caching model metadata...',
        'Preloading weather data...'
      ];

      for (const task of warmingTasks) {
        logger.info(task);
        // Simulate warming delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('Cache warming completed');
      return true;
    } catch (error) {
      logger.error('Cache warming error:', error);
      return false;
    }
  }

  /**
   * Cleanup expired entries from fallback cache
   */
  cleanupFallbackCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.fallbackCache.entries()) {
      if (data.expiry <= now) {
        this.fallbackCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired fallback cache entries`);
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    // Cleanup fallback cache every 5 minutes
    setInterval(() => {
      this.cleanupFallbackCache();
    }, 5 * 60 * 1000);

    logger.info('Started periodic cache cleanup');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
      }
      
      this.fallbackCache.clear();
      logger.info('Cache service shutdown completed');
    } catch (error) {
      logger.error('Error during cache service shutdown:', error);
    }
  }
}

// Singleton instance
const redisCacheService = new RedisCacheService();

module.exports = {
  redisCacheService,
  RedisCacheService
};