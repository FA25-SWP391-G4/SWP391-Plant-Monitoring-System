const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');
const mqtt = require('mqtt');
const fs = require('fs').promises;
const path = require('path');

// Health check endpoint
router.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {},
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  try {
    // Check database connection
    healthStatus.services.database = await checkDatabase();
    
    // Check Redis connection
    healthStatus.services.redis = await checkRedis();
    
    // Check MQTT connection
    healthStatus.services.mqtt = await checkMqtt();
    
    // Check OpenRouter API
    healthStatus.services.openrouter = await checkOpenRouter();
    
    // Check TensorFlow.js models
    healthStatus.services.tensorflow = await checkTensorFlowModels();
    
    // Check file system
    healthStatus.services.filesystem = await checkFileSystem();
    
    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services);
    const unhealthyServices = serviceStatuses.filter(service => service.status !== 'healthy');
    
    if (unhealthyServices.length === 0) {
      healthStatus.status = 'healthy';
    } else if (unhealthyServices.length <= serviceStatuses.length / 2) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'unhealthy';
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Detailed health check endpoint
router.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      },
      metrics: await getMetrics()
    };

    // Detailed service checks
    detailedHealth.services.database = await checkDatabaseDetailed();
    detailedHealth.services.redis = await checkRedisDetailed();
    detailedHealth.services.mqtt = await checkMqttDetailed();
    detailedHealth.services.openrouter = await checkOpenRouterDetailed();
    detailedHealth.services.tensorflow = await checkTensorFlowDetailed();
    detailedHealth.services.filesystem = await checkFileSystemDetailed();

    res.json(detailedHealth);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check critical services only
    const criticalChecks = await Promise.all([
      checkDatabase(),
      checkTensorFlowModels()
    ]);

    const allReady = criticalChecks.every(check => check.status === 'healthy');
    
    if (allReady) {
      res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Helper functions
async function checkDatabase() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    return {
      status: 'healthy',
      responseTime: Date.now(),
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

async function checkDatabaseDetailed() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const client = await pool.connect();
    const startTime = Date.now();
    
    // Test basic connection
    await client.query('SELECT NOW()');
    
    // Check AI tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_analyses', 'ai_feedback', 'plant_disease_images', 'ai_models')
    `);
    
    // Check recent activity
    const activityResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM ai_analyses 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    client.release();
    await pool.end();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      tables: tablesResult.rows.map(row => row.table_name),
      recentActivity: parseInt(activityResult.rows[0].count),
      message: 'Database detailed check successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Database detailed check failed'
    };
  }
}

async function checkRedis() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return {
      status: 'healthy',
      message: 'Redis connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Redis connection failed'
    };
  }
}

async function checkRedisDetailed() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    const startTime = Date.now();
    
    // Test basic operations
    await client.ping();
    await client.set('health_check', 'test', { EX: 10 });
    const testValue = await client.get('health_check');
    
    // Get Redis info
    const info = await client.info();
    const responseTime = Date.now() - startTime;
    
    await client.disconnect();
    
    return {
      status: 'healthy',
      responseTime,
      testResult: testValue === 'test',
      info: parseRedisInfo(info),
      message: 'Redis detailed check successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Redis detailed check failed'
    };
  }
}

async function checkMqtt() {
  return new Promise((resolve) => {
    try {
      const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
        connectTimeout: 5000
      });
      
      const timeout = setTimeout(() => {
        client.end();
        resolve({
          status: 'unhealthy',
          error: 'Connection timeout',
          message: 'MQTT connection timeout'
        });
      }, 5000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        client.end();
        resolve({
          status: 'healthy',
          message: 'MQTT connection successful'
        });
      });
      
      client.on('error', (error) => {
        clearTimeout(timeout);
        client.end();
        resolve({
          status: 'unhealthy',
          error: error.message,
          message: 'MQTT connection failed'
        });
      });
    } catch (error) {
      resolve({
        status: 'unhealthy',
        error: error.message,
        message: 'MQTT connection failed'
      });
    }
  });
}

async function checkMqttDetailed() {
  return new Promise((resolve) => {
    try {
      const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
        connectTimeout: 5000
      });
      
      const startTime = Date.now();
      let responseTime;
      
      const timeout = setTimeout(() => {
        client.end();
        resolve({
          status: 'unhealthy',
          error: 'Connection timeout',
          message: 'MQTT detailed check timeout'
        });
      }, 5000);
      
      client.on('connect', () => {
        responseTime = Date.now() - startTime;
        
        // Test publish/subscribe
        const testTopic = 'ai/health/test';
        const testMessage = JSON.stringify({ test: true, timestamp: Date.now() });
        
        client.subscribe(testTopic, (err) => {
          if (err) {
            clearTimeout(timeout);
            client.end();
            resolve({
              status: 'unhealthy',
              error: err.message,
              message: 'MQTT subscribe failed'
            });
            return;
          }
          
          client.publish(testTopic, testMessage);
        });
        
        client.on('message', (topic, message) => {
          if (topic === testTopic) {
            clearTimeout(timeout);
            client.end();
            resolve({
              status: 'healthy',
              responseTime,
              testResult: true,
              message: 'MQTT detailed check successful'
            });
          }
        });
      });
      
      client.on('error', (error) => {
        clearTimeout(timeout);
        client.end();
        resolve({
          status: 'unhealthy',
          error: error.message,
          message: 'MQTT detailed check failed'
        });
      });
    } catch (error) {
      resolve({
        status: 'unhealthy',
        error: error.message,
        message: 'MQTT detailed check failed'
      });
    }
  });
}

async function checkOpenRouter() {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        status: 'unhealthy',
        error: 'API key not configured',
        message: 'OpenRouter API key missing'
      };
    }
    
    // Simple API availability check
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'OpenRouter API accessible'
      };
    } else {
      return {
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
        message: 'OpenRouter API not accessible'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'OpenRouter API check failed'
    };
  }
}

async function checkOpenRouterDetailed() {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        status: 'unhealthy',
        error: 'API key not configured',
        message: 'OpenRouter API key missing'
      };
    }
    
    const startTime = Date.now();
    
    // Check models endpoint
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      const mistralModel = data.data?.find(model => 
        model.id.includes('mistral') && model.id.includes('7b')
      );
      
      return {
        status: 'healthy',
        responseTime,
        modelsAvailable: data.data?.length || 0,
        mistralAvailable: !!mistralModel,
        message: 'OpenRouter API detailed check successful'
      };
    } else {
      return {
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
        responseTime,
        message: 'OpenRouter API not accessible'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'OpenRouter API detailed check failed'
    };
  }
}

async function checkTensorFlowModels() {
  try {
    // TensorFlow.js temporarily disabled for Windows compatibility
    return {
      status: 'healthy',
      message: 'TensorFlow.js check skipped (Windows compatibility)'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'TensorFlow.js not available'
    };
  }
}

async function checkTensorFlowDetailed() {
  try {
    // const tf = require('@tensorflow/tfjs-node');
    
    // Check model files
    const modelPath = path.join(__dirname, '../models');
    let modelFiles = [];
    
    try {
      const files = await fs.readdir(modelPath);
      modelFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.bin'));
    } catch (err) {
      // Model directory might not exist
    }
    
    return {
      status: 'healthy',
      tfVersion: 'disabled',
      backend: 'none',
      modelFiles: modelFiles.length,
      memory: { numTensors: 0, numDataBuffers: 0, numBytes: 0 },
      message: 'TensorFlow.js disabled for Windows compatibility'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'TensorFlow.js detailed check failed'
    };
  }
}

async function checkFileSystem() {
  try {
    const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
    
    // Check if uploads directory exists and is writable
    await fs.access(uploadsPath, fs.constants.F_OK | fs.constants.W_OK);
    
    return {
      status: 'healthy',
      message: 'File system accessible'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'File system not accessible'
    };
  }
}

async function checkFileSystemDetailed() {
  try {
    const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
    const logsPath = path.join(__dirname, '../logs');
    
    // Check uploads directory
    const uploadsStats = await fs.stat(uploadsPath).catch(() => null);
    
    // Check logs directory
    const logsStats = await fs.stat(logsPath).catch(() => null);
    
    // Get disk usage if possible
    const diskUsage = process.platform !== 'win32' ? 
      await getDiskUsage(uploadsPath).catch(() => null) : null;
    
    return {
      status: 'healthy',
      uploads: {
        exists: !!uploadsStats,
        size: uploadsStats?.size || 0,
        modified: uploadsStats?.mtime
      },
      logs: {
        exists: !!logsStats,
        size: logsStats?.size || 0,
        modified: logsStats?.mtime
      },
      diskUsage,
      message: 'File system detailed check successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'File system detailed check failed'
    };
  }
}

async function getMetrics() {
  try {
    // Get basic application metrics
    return {
      requests: {
        total: global.requestCount || 0,
        errors: global.errorCount || 0,
        avgResponseTime: global.avgResponseTime || 0
      },
      ai: {
        chatbotRequests: global.chatbotRequests || 0,
        diseaseAnalyses: global.diseaseAnalyses || 0,
        irrigationPredictions: global.irrigationPredictions || 0
      }
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const parsed = {};
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      parsed[key] = value;
    }
  });
  
  return {
    version: parsed.redis_version,
    uptime: parsed.uptime_in_seconds,
    connected_clients: parsed.connected_clients,
    used_memory: parsed.used_memory_human,
    keyspace_hits: parsed.keyspace_hits,
    keyspace_misses: parsed.keyspace_misses
  };
}

async function getDiskUsage(path) {
  const { execSync } = require('child_process');
  const output = execSync(`df -h ${path}`).toString();
  const lines = output.split('\n');
  const data = lines[1].split(/\s+/);
  
  return {
    total: data[1],
    used: data[2],
    available: data[3],
    usePercent: data[4]
  };
}

module.exports = router;