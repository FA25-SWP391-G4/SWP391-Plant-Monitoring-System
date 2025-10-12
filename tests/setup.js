require('dotenv').config();

// Global test setup
beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Mock console.log to reduce noise during tests
    global.originalConsoleLog = console.log;
    console.log = jest.fn();
});

afterAll(() => {
    // Restore console.log
    console.log = global.originalConsoleLog;
});

// Mock nodemailer for tests
jest.mock('nodemailer', () => ({
    createTransporter: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })),
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    }))
}));

// Mock User model
jest.mock('../models/User', () => {
    const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        createPasswordResetToken: jest.fn().mockReturnValue('mock-reset-token'),
        updatePasswordResetFields: jest.fn().mockResolvedValue(true),
        updatePassword: jest.fn().mockResolvedValue(true),
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue({ user_id: 1 })
    };
    
    return {
        findByEmail: jest.fn().mockResolvedValue(mockUser),
        findById: jest.fn().mockResolvedValue(mockUser),
        findByResetToken: jest.fn().mockResolvedValue(mockUser)
    };
});

// Mock SystemLog model
jest.mock('../models/SystemLog', () => require('../__mocks__/SystemLog'));
