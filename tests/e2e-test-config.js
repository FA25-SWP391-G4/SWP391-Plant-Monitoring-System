/**
 * End-to-End Test Configuration
 * Centralized configuration for all E2E tests
 */

module.exports = {
  // Service endpoints
  services: {
    aiService: process.env.AI_SERVICE_URL || 'http://localhost:3001',
    mainServer: process.env.MAIN_SERVER_URL || 'http://localhost:3010',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    mqttBroker: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'plant_monitoring_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true'
  },

  // Test timeouts (in milliseconds)
  timeouts: {
    default: 30000,
    long: 60000,
    short: 10000,
    serviceStartup: 45000
  },

  // File upload limits
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    testAssetsDir: 'tests/test-assets'
  },

  // MQTT configuration
  mqtt: {
    topics: {
      chatbot: {
        request: 'ai/chatbot/request/{userId}',
        response: 'ai/chatbot/response/{userId}',
        typing: 'ai/chatbot/typing/{userId}'
      },
      irrigation: {
        prediction: 'ai/irrigation/prediction/{plantId}',
        recommendation: 'ai/irrigation/recommendation/{plantId}',
        alert: 'ai/irrigation/alert/{plantId}'
      },
      disease: {
        analysis: 'ai/disease/analysis/{plantId}',
        alert: 'ai/disease/alert/{plantId}'
      },
      system: {
        status: 'ai/system/status',
        modelUpdate: 'ai/system/model-update'
      }
    },
    qos: 1,
    retainMessages: false
  },

  // Test data
  testData: {
    users: {
      base: 9000,
      count: 100
    },
    plants: {
      base: 9000,
      count: 100
    },
    sessions: {
      prefix: 'e2e-test-session'
    }
  },

  // Performance thresholds
  performance: {
    chatbot: {
      maxResponseTime: 5000, // 5 seconds
      maxConcurrentUsers: 50
    },
    diseaseDetection: {
      maxProcessingTime: 15000, // 15 seconds
      maxConcurrentUploads: 10
    },
    irrigationPrediction: {
      maxPredictionTime: 3000, // 3 seconds
      maxConcurrentPredictions: 20
    },
    database: {
      maxQueryTime: 1000, // 1 second
      maxConcurrentConnections: 50
    }
  },

  // Error handling
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    fallbackTimeout: 10000
  },

  // Security settings
  security: {
    rateLimiting: {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: true,
    logDir: 'tests/logs'
  },

  // Environment-specific overrides
  environments: {
    development: {
      database: {
        database: 'plant_monitoring_dev'
      },
      logging: {
        level: 'debug'
      }
    },
    test: {
      database: {
        database: 'plant_monitoring_test'
      },
      logging: {
        level: 'warn'
      }
    },
    ci: {
      timeouts: {
        default: 45000,
        long: 90000,
        serviceStartup: 60000
      },
      performance: {
        chatbot: {
          maxResponseTime: 10000
        },
        diseaseDetection: {
          maxProcessingTime: 30000
        }
      }
    }
  },

  // Test utilities
  utilities: {
    cleanup: {
      enabled: true,
      retainOnFailure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    reporting: {
      generateHtml: true,
      generateJson: true,
      includeScreenshots: false
    },
    monitoring: {
      collectMetrics: true,
      trackPerformance: true,
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 10000 // 10 seconds
      }
    }
  }
};

// Environment-specific configuration loading
const environment = process.env.NODE_ENV || 'development';
const config = module.exports;

if (config.environments[environment]) {
  // Deep merge environment-specific config
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  deepMerge(config, config.environments[environment]);
}

// Helper functions
config.helpers = {
  // Generate test user ID
  generateTestUserId: (index = 0) => config.testData.users.base + index,
  
  // Generate test plant ID
  generateTestPlantId: (index = 0) => config.testData.plants.base + index,
  
  // Generate test session ID
  generateTestSessionId: (suffix = '') => 
    `${config.testData.sessions.prefix}-${Date.now()}-${suffix}`,
  
  // Format MQTT topic with parameters
  formatMqttTopic: (template, params) => {
    let topic = template;
    for (const [key, value] of Object.entries(params)) {
      topic = topic.replace(`{${key}}`, value);
    }
    return topic;
  },
  
  // Wait for service to be ready
  waitForService: async (url, timeout = config.timeouts.serviceStartup) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) return true;
      } catch (error) {
        // Service not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Service at ${url} not ready within ${timeout}ms`);
  },
  
  // Create test image buffer
  createTestImageBuffer: (format = 'jpeg') => {
    const formats = {
      jpeg: Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ]),
      png: Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])
    };
    return formats[format] || formats.jpeg;
  }
};