// Jest setup file for all tests
// This file is loaded before all test files

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.VNPAY_TMN_CODE = 'TEST_TMN_CODE';
process.env.VNPAY_HASH_SECRET = 'TEST_HASH_SECRET';
process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
process.env.VNPAY_RETURN_URL = 'http://localhost:3000/api/payment/vnpay-return';
process.env.CLIENT_URL = 'http://localhost:3001';

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(), // Mock console.log
    warn: jest.fn(), // Mock console.warn
    error: console.error // Keep console.error for debugging
};

// Global test timeout
jest.setTimeout(30000);

// Setup and teardown
beforeAll(() => {
    console.error('Starting test suite...');
});

afterAll(() => {
    console.error('Test suite completed.');
});