/**
 * ============================================================================
 * E2E TEST SETUP
 * ============================================================================
 */

const { createDriver } = require('./selenium.config');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Global test timeout for E2E tests
jest.setTimeout(60000);

// Create screenshots directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Setup global driver
global.createDriver = createDriver;

// Cleanup
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});
