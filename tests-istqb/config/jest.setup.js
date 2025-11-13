/**
 * ============================================================================
 * JEST SETUP FILE
 * ============================================================================
 * Global test setup and configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/plant_system_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep native behaviour for log, but silence it
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Setup global test utilities
global.testUtils = {
  generateTestUser: () => ({
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    username: `testuser${Date.now()}`
  }),
  
  generateTestPlant: () => ({
    plant_name: `Test Plant ${Date.now()}`,
    species: 'Test Species',
    location: 'Test Location'
  }),

  generateTestZone: () => ({
    zone_name: `Test Zone ${Date.now()}`,
    description: 'Test zone description'
  })
};

// Cleanup after all tests
afterAll(async () => {
  // TODO: Close database connections
  // TODO: Clean up test data
  await new Promise(resolve => setTimeout(resolve, 500));
});
