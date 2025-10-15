/**
 * End-to-End Test Setup
 * Global setup and utilities for E2E tests
 */

const config = require('./e2e-test-config');
const fs = require('fs');
const path = require('path');

// Global test timeout
jest.setTimeout(config.timeouts.long);

// Global test utilities
global.testConfig = config;
global.testUtils = {
  // Generate unique test IDs
  generateTestId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Wait for condition
  waitFor: async (condition, timeout = 10000, interval = 500) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Create test directories
  ensureTestDir: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },
  
  // Clean up test files
  cleanupTestFiles: (pattern) => {
    const testDir = path.join(__dirname, 'temp');
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        if (file.match(pattern)) {
          fs.unlinkSync(path.join(testDir, file));
        }
      });
    }
  },
  
  // Mock MQTT client for testing
  createMockMqttClient: () => {
    const EventEmitter = require('events');
    const mockClient = new EventEmitter();
    
    mockClient.connected = false;
    mockClient.subscribe = jest.fn();
    mockClient.unsubscribe = jest.fn();
    mockClient.publish = jest.fn();
    mockClient.end = jest.fn();
    
    mockClient.connect = () => {
      mockClient.connected = true;
      mockClient.emit('connect');
      return mockClient;
    };
    
    return mockClient;
  },
  
  // Create test image buffer
  createTestImage: (format = 'jpeg', size = 'small') => {
    const images = {
      jpeg: {
        small: Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
        ]),
        large: null // Will be generated
      },
      png: {
        small: Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
          0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
      }
    };
    
    let image = images[format]?.[size] || images.jpeg.small;
    
    // Generate large image by repeating small image
    if (size === 'large' && !images[format].large) {
      image = Buffer.concat(Array(1000).fill(image));
    }
    
    return image;
  },
  
  // Database test helpers
  db: {
    // Clean up test data
    cleanup: async (pool) => {
      const cleanupQueries = [
        'DELETE FROM ai_feedback WHERE user_id >= 9000',
        'DELETE FROM ai_analyses WHERE user_id >= 9000',
        'DELETE FROM plant_disease_images WHERE user_id >= 9000',
        'DELETE FROM chat_histories WHERE user_id >= 9000',
        'DELETE FROM plants WHERE id >= 9000',
        'DELETE FROM users WHERE id >= 9000'
      ];
      
      for (const query of cleanupQueries) {
        try {
          await pool.query(query);
        } catch (error) {
          // Ignore errors for non-existent data
        }
      }
    },
    
    // Create test user
    createTestUser: async (pool, userId = 9001) => {
      const query = `
        INSERT INTO users (id, email, username, password_hash, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      await pool.query(query, [
        userId,
        `test${userId}@example.com`,
        `testuser${userId}`,
        'hashed_password'
      ]);
      
      return userId;
    },
    
    // Create test plant
    createTestPlant: async (pool, plantId = 9001, userId = 9001) => {
      const query = `
        INSERT INTO plants (id, user_id, name, plant_type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      await pool.query(query, [
        plantId,
        userId,
        `Test Plant ${plantId}`,
        'tomato'
      ]);
      
      return plantId;
    }
  }
};

// Global setup
beforeAll(async () => {
  // Create test directories
  const testDirs = [
    'tests/temp',
    'tests/logs',
    'tests/reports',
    'tests/test-assets'
  ];
  
  testDirs.forEach(dir => {
    global.testUtils.ensureTestDir(dir);
  });
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'warn';
});

// Global cleanup
afterAll(async () => {
  // Clean up temporary files
  if (config.utilities.cleanup.enabled) {
    global.testUtils.cleanupTestFiles(/^test-/);
  }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export for use in tests
module.exports = {
  config,
  testUtils: global.testUtils
};