/**
 * ============================================================================
 * JEST CONFIGURATION FOR E2E TESTS
 * ============================================================================
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests-istqb/e2e/**/*.e2e.js',
    '**/tests-istqb/acceptance/**/*.acceptance.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.e2e.js'],
  testTimeout: 60000,
  verbose: true,
  maxWorkers: 1 // Run tests sequentially for E2E
};
