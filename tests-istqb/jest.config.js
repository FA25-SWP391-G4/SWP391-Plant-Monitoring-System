/**
 * ============================================================================
 * JEST CONFIGURATION FOR ISTQB TEST SUITE
 * ============================================================================
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/coverage/',
    '/dist/'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test match patterns
  testMatch: [
    '**/tests-istqb/unit/**/*.test.js',
    '**/tests-istqb/unit/**/*.test.jsx',
    '**/tests-istqb/integration/**/*.test.js',
    '**/tests-istqb/system/**/*.test.js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests-istqb/config/jest.setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePaths: ['<rootDir>'],

  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
