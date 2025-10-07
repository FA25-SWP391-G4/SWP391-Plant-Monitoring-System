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
    }))
}));
