const { Pool } = require('pg');
const { logger } = require('../utils/errorHandler');
const { redisCacheService } = require('./redisCacheService');

/**
 * Database Optimization Service
 * Handles query optimization, connection pooling, and caching strategies
 */
class DatabaseOptimizationService {
  constructor() {
    this.pool = null;
    this.queryCache = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.connectionPoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'plant_monitoring',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      // Connection pool settings
      max: 20, // Maximum number of connections
      min: 5,  // Minimum number of connections
      idleTimeoutMillis: 30000, // 30 seconds
      connectionTimeoutMillis: 2000, // 2 seconds
      maxUses: 7500, // Maximum uses per connection
      allowExitOnIdle: true
    };
    
    // Prepared statements for common queries
    this.preparedStatements = {
      // AI analyses queries
      insertAiAnalysis: `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, confidence_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `,
      
      getAiAnalysesByPlant: `
        SELECT id, analysis_type, result_data, confidence_score, created_at
        FROM ai_analyses
        WHERE plant_id = $1 AND analysis_type = $2
        ORDER BY created_at DESC
        LIMIT $3
      `,
      
      getRecentAnalyses: `
        SELECT a.*, p.name as plant_name, u.username
        FROM ai_analyses a
        JOIN plants p ON a.plant_id = p.id
        JOIN users u ON a.user_id = u.id
        WHERE a.created_at >= $1
        ORDER BY a.created_at DESC
        LIMIT $2
      `,
      
      // Chat history queries
      insertChatHistory: `
        INSERT INTO chat_histories (user_id, plant_id, session_id, message, response, ai_confidence, topic_category, plant_context)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `,
      
      getChatHistory: `
        SELECT message, response, ai_confidence, topic_category, created_at
        FROM chat_histories
        WHERE session_id = $1
        ORDER BY created_at ASC
        LIMIT $2
      `,
      
      // Sensor data queries
      getLatestSensorData: `
        SELECT sensor_type, value, unit, recorded_at
        FROM sensor_data
        WHERE plant_id = $1 AND recorded_at >= $2
        ORDER BY recorded_at DESC
      `,
      
      getSensorDataAggregated: `
        SELECT 
          sensor_type,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as reading_count
        FROM sensor_data
        WHERE plant_id = $1 AND recorded_at >= $2
        GROUP BY sensor_type
      `,
      
      // Plant profile queries
      getPlantProfile: `
        SELECT p.*, pp.optimal_temperature, pp.optimal_humidity, pp.watering_frequency
        FROM plants p
        LEFT JOIN plant_profiles pp ON p.plant_type = pp.plant_type
        WHERE p.id = $1
      `,
      
      // Feedback queries
      insertAiFeedback: `
        INSERT INTO ai_feedback (analysis_id, user_id, feedback_type, user_comment, actual_result)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `,
      
      // Disease image queries
      insertDiseaseImage: `
        INSERT INTO plant_disease_images (plant_id, user_id, image_path, analysis_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, upload_timestamp
      `
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      // Create connection pool
      this.pool = new Pool(this.connectionPoolConfig);
      
      // Handle pool events
      this.pool.on('connect', (client) => {
        logger.debug('New database client connected');
      });
      
      this.pool.on('error', (err, client) => {
        logger.error('Database pool error:', err);
      });
      
      this.pool.on('remove', (client) => {
        logger.debug('Database client removed from pool');
      });
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Database optimization service initialized', {
        maxConnections: this.connectionPoolConfig.max,
        minConnections: this.connectionPoolConfig.min
      });
      
      // Create indexes if they don't exist
      await this.createOptimizedIndexes();
      
    } catch (error) {
      logger.error('Failed to initialize database optimization service:', error);
      throw error;
    }
  }

  /**
   * Create optimized database indexes
   */
  async createOptimizedIndexes() {
    const indexes = [
      // AI analyses indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analyses_plant_type ON ai_analyses(plant_id, analysis_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analyses_confidence ON ai_analyses(confidence_score DESC) WHERE confidence_score IS NOT NULL',
      
      // Chat histories indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_histories_session ON chat_histories(session_id, created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_histories_user_plant ON chat_histories(user_id, plant_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_histories_topic ON chat_histories(topic_category) WHERE topic_category IS NOT NULL',
      
      // Sensor data indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sensor_data_plant_time ON sensor_data(plant_id, recorded_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sensor_data_type_time ON sensor_data(sensor_type, recorded_at DESC)',
      
      // Plant disease images indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disease_images_plant ON plant_disease_images(plant_id, upload_timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disease_images_analysis ON plant_disease_images(analysis_id)',
      
      // AI feedback indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_feedback_analysis ON ai_feedback(analysis_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type)',
      
      // Composite indexes for common query patterns
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analyses_composite ON ai_analyses(plant_id, analysis_type, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sensor_data_composite ON sensor_data(plant_id, sensor_type, recorded_at DESC)'
    ];

    for (const indexQuery of indexes) {
      try {
        await this.pool.query(indexQuery);
        logger.debug(`Index created: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        if (error.code !== '42P07') { // Index already exists
          logger.warn(`Failed to create index: ${error.message}`);
        }
      }
    }

    logger.info('Database indexes optimization completed');
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeQuery(queryName, params = [], options = {}) {
    const startTime = Date.now();
    const cacheKey = options.cache ? `${queryName}:${JSON.stringify(params)}` : null;
    
    try {
      // Check cache first
      if (cacheKey && options.cacheTTL) {
        const cached = await redisCacheService.get('sensorData', cacheKey);
        if (cached) {
          logger.debug(`Query cache hit: ${queryName}`);
          return cached;
        }
      }

      // Get prepared statement
      const query = this.preparedStatements[queryName];
      if (!query) {
        throw new Error(`Unknown prepared statement: ${queryName}`);
      }

      // Execute query
      const result = await this.pool.query(query, params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryName,
          duration: `${duration}ms`,
          params: params.length
        });
      }

      // Cache result if requested
      if (cacheKey && options.cacheTTL && result.rows) {
        await redisCacheService.set('sensorData', cacheKey, result.rows, options.cacheTTL);
      }

      logger.debug(`Query executed: ${queryName} (${duration}ms)`);
      return result.rows;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Query failed: ${queryName} (${duration}ms)`, {
        error: error.message,
        params: params.length
      });
      throw error;
    }
  }

  /**
   * Batch insert with transaction support
   */
  async batchInsert(tableName, records, options = {}) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      const batchSize = options.batchSize || 100;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (const record of batch) {
          let query, values;
          
          switch (tableName) {
            case 'ai_analyses':
              query = this.preparedStatements.insertAiAnalysis;
              values = [
                record.plant_id,
                record.user_id,
                record.analysis_type,
                JSON.stringify(record.input_data),
                JSON.stringify(record.result_data),
                record.confidence_score
              ];
              break;
              
            case 'chat_histories':
              query = this.preparedStatements.insertChatHistory;
              values = [
                record.user_id,
                record.plant_id,
                record.session_id,
                record.message,
                record.response,
                record.ai_confidence,
                record.topic_category,
                JSON.stringify(record.plant_context)
              ];
              break;
              
            default:
              throw new Error(`Unsupported table for batch insert: ${tableName}`);
          }
          
          const result = await client.query(query, values);
          results.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      logger.info(`Batch insert completed: ${records.length} records to ${tableName}`);
      
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Batch insert failed for ${tableName}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get AI analysis history with optimized query
   */
  async getAiAnalysisHistory(plantId, analysisType, limit = 10, useCache = true) {
    const options = useCache ? { cache: true, cacheTTL: 300 } : {}; // 5 minutes cache
    
    return await this.executeQuery(
      'getAiAnalysesByPlant',
      [plantId, analysisType, limit],
      options
    );
  }

  /**
   * Get recent sensor data with aggregation
   */
  async getSensorDataOptimized(plantId, hoursBack = 24, aggregate = false) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const queryName = aggregate ? 'getSensorDataAggregated' : 'getLatestSensorData';
    
    return await this.executeQuery(
      queryName,
      [plantId, since],
      { cache: true, cacheTTL: 300 } // 5 minutes cache
    );
  }

  /**
   * Get plant profile with caching
   */
  async getPlantProfileOptimized(plantId) {
    return await this.executeQuery(
      'getPlantProfile',
      [plantId],
      { cache: true, cacheTTL: 3600 } // 1 hour cache
    );
  }

  /**
   * Insert AI analysis with automatic caching invalidation
   */
  async insertAiAnalysis(analysisData) {
    const result = await this.executeQuery('insertAiAnalysis', [
      analysisData.plant_id,
      analysisData.user_id,
      analysisData.analysis_type,
      JSON.stringify(analysisData.input_data),
      JSON.stringify(analysisData.result_data),
      analysisData.confidence_score
    ]);

    // Invalidate related cache
    await this.invalidateAnalysisCache(analysisData.plant_id, analysisData.analysis_type);
    
    return result[0];
  }

  /**
   * Insert chat history with session management
   */
  async insertChatHistory(chatData) {
    return await this.executeQuery('insertChatHistory', [
      chatData.user_id,
      chatData.plant_id,
      chatData.session_id,
      chatData.message,
      chatData.response,
      chatData.ai_confidence,
      chatData.topic_category,
      JSON.stringify(chatData.plant_context)
    ]);
  }

  /**
   * Get chat history with pagination
   */
  async getChatHistoryOptimized(sessionId, limit = 50) {
    return await this.executeQuery(
      'getChatHistory',
      [sessionId, limit],
      { cache: true, cacheTTL: 600 } // 10 minutes cache
    );
  }

  /**
   * Invalidate cache for specific analysis type
   */
  async invalidateAnalysisCache(plantId, analysisType) {
    const patterns = [
      `getAiAnalysesByPlant:${JSON.stringify([plantId, analysisType])}`,
      `getRecentAnalyses:*`
    ];

    for (const pattern of patterns) {
      await redisCacheService.delete('sensorData', pattern);
    }
  }

  /**
   * Database health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.pool.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;
      
      const poolStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      return {
        status: 'healthy',
        responseTime,
        poolStats,
        result: result.rows[0]
      };
      
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
      `);

      const indexStats = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20
      `);

      return {
        tableStats: stats.rows,
        indexStats: indexStats.rows,
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
      
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(query, params = []) {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await this.pool.query(explainQuery, params);
      
      return {
        executionPlan: result.rows[0]['QUERY PLAN'][0],
        recommendations: this._generateQueryRecommendations(result.rows[0]['QUERY PLAN'][0])
      };
      
    } catch (error) {
      logger.error('Query analysis failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate query optimization recommendations
   */
  _generateQueryRecommendations(executionPlan) {
    const recommendations = [];
    
    if (executionPlan['Execution Time'] > 1000) {
      recommendations.push('Query execution time is high (>1s). Consider adding indexes or optimizing WHERE clauses.');
    }
    
    if (executionPlan['Planning Time'] > 100) {
      recommendations.push('Query planning time is high. Consider using prepared statements.');
    }
    
    // Check for sequential scans
    const planStr = JSON.stringify(executionPlan);
    if (planStr.includes('Seq Scan')) {
      recommendations.push('Sequential scan detected. Consider adding appropriate indexes.');
    }
    
    if (planStr.includes('Sort') && planStr.includes('external')) {
      recommendations.push('External sort detected. Consider increasing work_mem or optimizing the query.');
    }
    
    return recommendations;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.pool) {
        await this.pool.end();
        logger.info('Database connection pool closed');
      }
    } catch (error) {
      logger.error('Error during database service shutdown:', error);
    }
  }
}

// Singleton instance
const databaseOptimizationService = new DatabaseOptimizationService();

module.exports = {
  databaseOptimizationService,
  DatabaseOptimizationService
};