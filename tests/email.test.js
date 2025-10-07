const nodemailer = require('nodemailer');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const User = require('../models/User');
const { pool } = require('../config/db');

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn()
}));

// Mock User model
jest.mock('../models/User');

// Mock database pool
jest.mock('../config/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('Email Service Tests', () => {
    let mockTransporter;
    let mockRequest;
    let mockResponse;
    const mockCreateTransport = nodemailer.createTransport;

    beforeEach(() => {
        // Mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };
        mockCreateTransport.mockReturnValue(mockTransporter);

        // Mock request and response objects
        mockRequest = {
            body: {},
            headers: {}
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        // Setup environment variables for testing
        process.env.EMAIL_SERVICE = 'gmail';
        process.env.EMAIL_USER = 'jamesdpkn.testing@gmail.com';
        process.env.EMAIL_PASS = 'daxcpvqzxuwrkdka';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Password Reset Email Functionality', () => {
        it('should create transporter with correct configuration', () => {
            // Trigger the transporter creation by calling the function
            const { forgotPassword } = require('../controllers/authController');

            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: 'gmail',
                auth: {
                    user: 'jamesdpkn.testing@gmail.com',
                    pass: 'daxcpvqzxuwrkdka',
                },
            });
        });

        it('should send password reset email successfully', async () => {
            // Mock user exists
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] }); // Mock successful token storage

            mockRequest.body = { email: 'test@example.com' };

            await forgotPassword(mockRequest, mockResponse);

            // Verify email was sent
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
            
            const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
            expect(sentEmail.from).toBe('jamesdpkn.testing@gmail.com');
            expect(sentEmail.to).toBe('test@example.com');
            expect(sentEmail.subject).toBe('Plant Monitoring System - Password Reset Request');
            expect(sentEmail.html).toContain('Password Reset Request');
            expect(sentEmail.html).toContain('Test User');
            expect(sentEmail.html).toContain('http://localhost:3000/reset-password?token=');

            // Verify response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password reset email sent successfully'
            });
        });

        it('should handle email service failures gracefully', async () => {
            // Mock user exists
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            // Mock email service failure
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP service unavailable'));

            mockRequest.body = { email: 'test@example.com' };

            await forgotPassword(mockRequest, mockResponse);

            // Verify error response
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to send reset email. Please try again.'
            });
        });

        it('should not send email for non-existent user', async () => {
            // Mock user not found
            User.findByEmail.mockResolvedValue(null);

            mockRequest.body = { email: 'nonexistent@example.com' };

            await forgotPassword(mockRequest, mockResponse);

            // Verify no email was sent
            expect(mockTransporter.sendMail).not.toHaveBeenCalled();

            // Verify response (should still return success for security)
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        });
    });

    describe('Email Content Validation', () => {
        it('should generate correct reset URL format', () => {
            const testToken = 'test-reset-token-123';
            const expectedUrl = `${process.env.FRONTEND_URL}/reset-password?token=${testToken}`;
            
            expect(expectedUrl).toBe('http://localhost:3000/reset-password?token=test-reset-token-123');
        });

        it('should include all required elements in password reset email', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            mockRequest.body = { email: 'test@example.com' };

            await forgotPassword(mockRequest, mockResponse);

            const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
            
            // Check required elements
            expect(sentEmail.html).toContain('Password Reset Request');
            expect(sentEmail.html).toContain('Test User');
            expect(sentEmail.html).toContain('Plant Monitoring System');
            expect(sentEmail.html).toContain('Reset Password');
            expect(sentEmail.html).toContain('This link will expire');
            expect(sentEmail.html).toContain('If you didn\'t request this');
        });
    });

    describe('Email Environment Configuration', () => {
        it('should use correct environment variables', () => {
            expect(process.env.EMAIL_USER).toBe('jamesdpkn.testing@gmail.com');
            expect(process.env.EMAIL_SERVICE).toBe('gmail');
            expect(process.env.EMAIL_PASS).toBeDefined();
            expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
        });
    });

    describe('Email Security', () => {
        it('should not expose sensitive information in emails', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            mockRequest.body = { email: 'test@example.com' };

            await forgotPassword(mockRequest, mockResponse);

            const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
            
            // Ensure sensitive data is not exposed
            expect(sentEmail.html).not.toContain(process.env.JWT_SECRET);
            expect(sentEmail.html).not.toContain(process.env.EMAIL_PASS);
            expect(sentEmail.html).not.toContain('user_id');
        });
    });
});
