// Jest setup for payment tests
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.VNPAY_TMN_CODE = 'TEST_TMN_CODE';
process.env.VNPAY_HASH_SECRET = 'TEST_HASH_SECRET';
process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
process.env.VNPAY_RETURN_URL = 'http://localhost:3000/api/payment/vnpay-return';
process.env.CLIENT_URL = 'http://localhost:3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock external dependencies globally
jest.mock('../models/Payment', () => ({
    create: jest.fn(),
    findByOrderId: jest.fn(),
    updateStatus: jest.fn(),
    findByUserId: jest.fn()
}));

jest.mock('../models/User', () => ({
    findById: jest.fn(),
    upgradeToPremium: jest.fn(),
    findByEmail: jest.fn()
}));

jest.mock('../models/SystemLog', () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

// Mock authentication middleware
jest.mock('../middlewares/authMiddleware', () => (req, res, next) => {
    // Mock authenticated user
    req.user = {
        user_id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser'
    };
    next();
});

// Setup test database connection mock
jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
}));

// Global test setup
beforeAll(() => {
    console.log('Setting up payment tests...');
});

afterAll(() => {
    console.log('Cleaning up payment tests...');
});

// Console configuration for tests
if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn(); // Suppress console.log in tests
    console.warn = jest.fn(); // Suppress console.warn in tests
    // Keep console.error for debugging
}