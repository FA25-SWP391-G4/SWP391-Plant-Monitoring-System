// Test setup for Jest tests
// This file is loaded before all tests run

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Increase Jest timeout for Selenium tests
jest.setTimeout(60000);

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Setup console logging for tests
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  if (process.env.JEST_VERBOSE === 'true') {
    originalLog(...args);
  }
};

console.error = (...args) => {
  originalError(...args);
};

console.warn = (...args) => {
  if (process.env.JEST_VERBOSE === 'true') {
    originalWarn(...args);
  }
};

// Setup test database connection if needed
beforeAll(async () => {
  // Add any global setup here
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // Add any global cleanup here
  console.log('✅ Test suite completed');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = {};