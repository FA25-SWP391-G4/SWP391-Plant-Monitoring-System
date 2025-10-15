/**
 * Jest Configuration for End-to-End Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/*-e2e.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/e2e-test-setup.js'
  ],
  
  // Test timeout
  testTimeout: 60000, // 60 seconds for E2E tests
  
  // Run tests serially to avoid conflicts
  maxWorkers: 1,
  
  // Collect coverage from AI service files
  collectCoverageFrom: [
    'ai-service/**/*.js',
    '!ai-service/node_modules/**',
    '!ai-service/tests/**',
    '!ai-service/uploads/**',
    '!ai-service/logs/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // Module paths
  modulePaths: [
    '<rootDir>',
    '<rootDir>/ai-service',
    '<rootDir>/tests'
  ],
  
  // Global variables
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  
  // Verbose output
  verbose: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Transform files
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],
  
  // Test results processor
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/reports',
      filename: 'e2e-test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'AI Features E2E Test Report'
    }]
  ],
  
  // Error handling
  errorOnDeprecated: false,
  
  // Bail on first test failure (for CI)
  bail: process.env.CI ? 1 : 0,
  
  // Cache directory
  cacheDirectory: '<rootDir>/tests/.jest-cache',
  
  // Watch plugins (for development)
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};