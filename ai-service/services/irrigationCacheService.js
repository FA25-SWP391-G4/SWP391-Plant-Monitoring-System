const { logger } = require('../utils/errorHandler');
const { redisCacheService } = require('./redisCacheService');

class IrrigationCacheService {
  constructor() {
    // Use the centralized Redis cache service
    this.cacheService = redisCacheService;
    
    // Cache configuration
    this.config = {
      // TTL in seconds
      predictionTTL: 300,      // 5 minutes
      sensorDataTTL: 60,       // 1 minute
      plantProfileTTL: 3600,   // 1 hour
      weatherTTL: 1800,        // 30 minutes
      scheduleTTL: 7200,       // 2 hours
      
      // Performance settings
      batchSize: 10,
      compressionThreshold: 1024 // bytes
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    logger.info('Irrigation cache service initialized with centralized Redis cache');
  }

  async initializeRedis() {
    try {
      // Try to initialize Redis client
      // In a real implementation, you would use 'redis' package
      // For now, we'll simulate Redis availability
      const redisAvailable = process.env.REDIS_URL || process.env.REDIS_HOST;
      
      if (redisAvailable) {
        logger.info('Redis configuration detected, but using in-memory cache for demo');
        // this.redisClient = redis.createClient(process.env.REDIS_URL);
        // await this.redisClient.connect();
        // this.isRedisAvailable = true;
      } else {
        logger.info('Redis not configured, using in-memory cache');
      }
      
      this.isRedisAvailable = false; // Force in-memory for demo
      
      // Start cleanup interval
      this.startCleanupInterval();
      
      logger.info('Irrigation cache service initialized', {
        redisAvailable: this.isRedisAvailable,
        cacheType: this.isRedisAvailable ? 'redis' : 'in-memory'
      });
      
    } catch (error) {
      logger.error('Failed to initialize Redis, falling back to in-memory cache:', error);
      this.isRedisAvailable = false;
    }
  }

  // Prediction caching
  async cachePrediction(plantId, sensorDataHash, prediction) {
    try {
      const key = `prediction:${plantId}:${sensorDataHash}`;
      const value = {
        prediction,
        timestamp: Date.now(),
        ttl: this.config.predictionTTL
      };

      if (this.isRedisAvailable) {
        await this.redisClient.setEx(key, this.config.predictionTTL, JSON.stringify(value));
      } else {
        // In-memory cache with size limit
        if (this.cache.size >= this.config.maxPredictions) {
          this.evictOldestEntries('prediction:', this.config.maxPredictions * 0.8);
        }
        this.cache.set(key, value);
      }

      this.stats.sets++;
      logger.debug('Cached prediction', { plantId, key });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching prediction:', error);
    }
  }

  async getCachedPrediction(plantId, sensorDataHash) {
    try {
      const key = `prediction:${plantId}:${sensorDataHash}`;
      let value = null;

      if (this.isRedisAvailable) {
        const cached = await this.redisClient.get(key);
        value = cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        if (cached && !this.isExpired(cached)) {
          value = cached;
        } else if (cached) {
          this.cache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        logger.debug('Cache hit for prediction', { plantId, key });
        return value.prediction;
      } else {
        this.stats.misses++;
        logger.debug('Cache miss for prediction', { plantId, key });
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached prediction:', error);
      return null;
    }
  }

  // Sensor data caching
  async cacheSensorData(plantId, sensorData) {
    try {
      const key = `sensor:${plantId}:latest`;
      const value = {
        sensorData,
        timestamp: Date.now(),
        ttl: this.config.sensorDataTTL
      };

      if (this.isRedisAvailable) {
        await this.redisClient.setEx(key, this.config.sensorDataTTL, JSON.stringify(value));
      } else {
        this.cache.set(key, value);
      }

      this.stats.sets++;
      logger.debug('Cached sensor data', { plantId });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching sensor data:', error);
    }
  }

  async getCachedSensorData(plantId) {
    try {
      const key = `sensor:${plantId}:latest`;
      let value = null;

      if (this.isRedisAvailable) {
        const cached = await this.redisClient.get(key);
        value = cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        if (cached && !this.isExpired(cached)) {
          value = cached;
        } else if (cached) {
          this.cache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        return value.sensorData;
      } else {
        this.stats.misses++;
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached sensor data:', error);
      return null;
    }
  }

  // Plant profile caching
  async cachePlantProfile(plantType, profile) {
    try {
      const key = `profile:${plantType}`;
      const value = {
        profile,
        timestamp: Date.now(),
        ttl: this.config.plantProfileTTL
      };

      if (this.isRedisAvailable) {
        await this.redisClient.setEx(key, this.config.plantProfileTTL, JSON.stringify(value));
      } else {
        this.cache.set(key, value);
      }

      this.stats.sets++;
      logger.debug('Cached plant profile', { plantType });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching plant profile:', error);
    }
  }

  async getCachedPlantProfile(plantType) {
    try {
      const key = `profile:${plantType}`;
      let value = null;

      if (this.isRedisAvailable) {
        const cached = await this.redisClient.get(key);
        value = cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        if (cached && !this.isExpired(cached)) {
          value = cached;
        } else if (cached) {
          this.cache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        return value.profile;
      } else {
        this.stats.misses++;
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached plant profile:', error);
      return null;
    }
  }

  // Weather data caching
  async cacheWeatherData(location, weatherData) {
    try {
      const locationKey = `${location.lat}_${location.lon}`;
      const key = `weather:${locationKey}`;
      const value = {
        weatherData,
        timestamp: Date.now(),
        ttl: this.config.weatherTTL
      };

      if (this.isRedisAvailable) {
        await this.redisClient.setEx(key, this.config.weatherTTL, JSON.stringify(value));
      } else {
        this.cache.set(key, value);
      }

      this.stats.sets++;
      logger.debug('Cached weather data', { location: locationKey });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching weather data:', error);
    }
  }

  async getCachedWeatherData(location) {
    try {
      const locationKey = `${location.lat}_${location.lon}`;
      const key = `weather:${locationKey}`;
      let value = null;

      if (this.isRedisAvailable) {
        const cached = await this.redisClient.get(key);
        value = cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        if (cached && !this.isExpired(cached)) {
          value = cached;
        } else if (cached) {
          this.cache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        return value.weatherData;
      } else {
        this.stats.misses++;
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached weather data:', error);
      return null;
    }
  }

  // Schedule caching
  async cacheSchedule(plantId, schedule) {
    try {
      const key = `schedule:${plantId}`;
      const value = {
        schedule,
        timestamp: Date.now(),
        ttl: this.config.scheduleTTL
      };

      if (this.isRedisAvailable) {
        await this.redisClient.setEx(key, this.config.scheduleTTL, JSON.stringify(value));
      } else {
        this.cache.set(key, value);
      }

      this.stats.sets++;
      logger.debug('Cached schedule', { plantId });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching schedule:', error);
    }
  }

  async getCachedSchedule(plantId) {
    try {
      const key = `schedule:${plantId}`;
      let value = null;

      if (this.isRedisAvailable) {
        const cached = await this.redisClient.get(key);
        value = cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        if (cached && !this.isExpired(cached)) {
          value = cached;
        } else if (cached) {
          this.cache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        return value.schedule;
      } else {
        this.stats.misses++;
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached schedule:', error);
      return null;
    }
  }

  // Batch operations for performance
  async batchCachePredictions(predictions) {
    try {
      const promises = predictions.map(({ plantId, sensorDataHash, prediction }) =>
        this.cachePrediction(plantId, sensorDataHash, prediction)
      );

      await Promise.all(promises);
      logger.info('Batch cached predictions', { count: predictions.length });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error batch caching predictions:', error);
    }
  }

  async batchGetPredictions(requests) {
    try {
      const promises = requests.map(({ plantId, sensorDataHash }) =>
        this.getCachedPrediction(plantId, sensorDataHash)
      );

      const results = await Promise.all(promises);
      const hits = results.filter(r => r !== null).length;
      
      logger.debug('Batch retrieved predictions', { 
        total: requests.length, 
        hits, 
        hitRate: (hits / requests.length * 100).toFixed(1) + '%'
      });
      
      return results;
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error batch getting predictions:', error);
      return requests.map(() => null);
    }
  }

  // Cache invalidation
  async invalidatePlantCache(plantId) {
    try {
      const patterns = [
        `prediction:${plantId}:*`,
        `sensor:${plantId}:*`,
        `schedule:${plantId}`
      ];

      if (this.isRedisAvailable) {
        for (const pattern of patterns) {
          const keys = await this.redisClient.keys(pattern);
          if (keys.length > 0) {
            await this.redisClient.del(keys);
          }
        }
      } else {
        // In-memory cache invalidation
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
          if (patterns.some(pattern => this.matchPattern(key, pattern))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
      }

      this.stats.deletes += patterns.length;
      logger.info('Invalidated plant cache', { plantId });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error invalidating plant cache:', error);
    }
  }

  async invalidateAllCache() {
    try {
      if (this.isRedisAvailable) {
        await this.redisClient.flushAll();
      } else {
        this.cache.clear();
      }

      this.stats.deletes++;
      logger.info('Invalidated all cache');
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error invalidating all cache:', error);
    }
  }

  // Utility methods
  generateSensorDataHash(sensorData) {
    // Simple hash function for sensor data
    const key = `${sensorData.soilMoisture}_${sensorData.temperature}_${sensorData.humidity}_${sensorData.plantType}`;
    return this.simpleHash(key);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  isExpired(cachedItem) {
    const now = Date.now();
    const expiry = cachedItem.timestamp + (cachedItem.ttl * 1000);
    return now > expiry;
  }

  matchPattern(key, pattern) {
    const regex = pattern.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`).test(key);
  }

  evictOldestEntries(prefix, targetSize) {
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(prefix))
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = entries.length - targetSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.debug('Evicted old cache entries', { 
      prefix, 
      removed: toRemove, 
      remaining: targetSize 
    });
  }

  startCleanupInterval() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  cleanupExpiredEntries() {
    if (this.isRedisAvailable) {
      // Redis handles TTL automatically
      return;
    }

    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (this.isExpired(value)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned up expired cache entries', { cleaned });
    }
  }

  // Performance monitoring
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.isRedisAvailable ? 'N/A (Redis)' : this.cache.size,
      cacheType: this.isRedisAvailable ? 'redis' : 'in-memory'
    };
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  // Health check
  async healthCheck() {
    try {
      const testKey = 'health_check_test';
      const testValue = { test: true, timestamp: Date.now() };

      // Test set operation
      if (this.isRedisAvailable) {
        await this.redisClient.setEx(testKey, 10, JSON.stringify(testValue));
        const retrieved = await this.redisClient.get(testKey);
        await this.redisClient.del(testKey);
        
        return {
          healthy: retrieved !== null,
          cacheType: 'redis',
          latency: Date.now() - testValue.timestamp
        };
      } else {
        this.cache.set(testKey, testValue);
        const retrieved = this.cache.get(testKey);
        this.cache.delete(testKey);
        
        return {
          healthy: retrieved !== null,
          cacheType: 'in-memory',
          latency: Date.now() - testValue.timestamp
        };
      }

    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        cacheType: this.isRedisAvailable ? 'redis' : 'in-memory'
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.quit();
      }
      
      this.cache.clear();
      logger.info('Cache service cleaned up');
      
    } catch (error) {
      logger.error('Error during cache cleanup:', error);
    }
  }
}

module.exports = IrrigationCacheService;