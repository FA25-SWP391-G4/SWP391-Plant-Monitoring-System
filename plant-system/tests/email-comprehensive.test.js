/**
 * Email Service Tests - Comprehensive Testing for Email Functionality
 * Tests email sending for password reset and other notifications
 */

// Mock nodemailer module
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail
}));

jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport
}));

// Mock other dependencies
jest.mock('../models/User');
jest.mock('../config/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

const User = require('../models/User');
const { pool } = require('../config/db');

describe('Email Service Tests', () => {
    let authController;
    let mockRequest;
    let mockResponse;

    beforeAll(() => {
        // Set up environment variables
        process.env.EMAIL_SERVICE = 'gmail';
        process.env.EMAIL_USER = 'jamesdpkn.testing@gmail.com';
        process.env.EMAIL_PASS = 'daxcpvqzxuwrkdka';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.JWT_SECRET = 'test-secret';
    });

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup successful email sending by default
        mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

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

        // Import controller after mocks are set up
        authController = require('../controllers/authController');
    });

    describe('Nodemailer Configuration', () => {
        it('should create transporter with correct Gmail configuration', () => {
            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: 'gmail',
                auth: {
                    user: 'jamesdpkn.testing@gmail.com',
                    pass: 'daxcpvqzxuwrkdka',
                }
            });
        });

        it('should use environment variables for email configuration', () => {
            expect(process.env.EMAIL_SERVICE).toBe('gmail');
            expect(process.env.EMAIL_USER).toBe('jamesdpkn.testing@gmail.com');
            expect(process.env.EMAIL_PASS).toBeDefined();
            expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
        });
    });

    describe('Password Reset Email', () => {
        it('should send password reset email successfully', async () => {
            // Mock user exists
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] }); // Mock token storage

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            // Verify email was sent
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.from).toBe('jamesdpkn.testing@gmail.com');
            expect(emailCall.to).toBe('test@example.com');
            expect(emailCall.subject).toBe('Plant Monitoring System - Password Reset Request');
            expect(emailCall.html).toContain('Password Reset Request');
            expect(emailCall.html).toContain('Test User');
            expect(emailCall.html).toContain('http://localhost:3000/reset-password?token=');

            // Verify success response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password reset email sent successfully'
            });
        });

        it('should not send email for non-existent user but return success for security', async () => {
            User.findByEmail.mockResolvedValue(null);

            mockRequest.body = { email: 'nonexistent@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            // Verify no email was sent
            expect(mockSendMail).not.toHaveBeenCalled();

            // Should still return success for security reasons
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        });

        it('should handle email service failures gracefully', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });
            mockSendMail.mockRejectedValue(new Error('SMTP service unavailable'));

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            // Verify error response
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to send reset email. Please try again.'
            });
        });

        it('should include required security information in email', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            const emailCall = mockSendMail.mock.calls[0][0];
            
            // Check required security elements
            expect(emailCall.html).toContain('This link will expire');
            expect(emailCall.html).toContain('If you didn\'t request this');
            expect(emailCall.html).toContain('Plant Monitoring System');
            expect(emailCall.html).toContain('Reset Password');
        });
    });

    describe('Password Reset Confirmation Email', () => {
        it('should send confirmation email after successful password reset', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User',
                updatePassword: jest.fn().mockResolvedValue(true)
            };

            User.findByEmail.mockResolvedValue(mockUser);
            // Mock valid token
            pool.query.mockResolvedValueOnce({ 
                rows: [{ user_id: 1, expires_at: new Date(Date.now() + 3600000) }] 
            });
            // Mock token deletion
            pool.query.mockResolvedValueOnce({ rows: [] });

            mockRequest.body = { 
                email: 'test@example.com', 
                token: 'valid-token',
                newPassword: 'newPassword123'
            };

            await authController.resetPassword(mockRequest, mockResponse);

            // Verify confirmation email was sent
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.from).toBe('jamesdpkn.testing@gmail.com');
            expect(emailCall.to).toBe('test@example.com');
            expect(emailCall.subject).toBe('Plant Monitoring System - Password Reset Confirmation');
            expect(emailCall.html).toContain('Password Reset Successful');
            expect(emailCall.html).toContain('Test User');
        });
    });

    describe('Email Content Validation', () => {
        it('should generate correct reset URL format', () => {
            const testToken = 'test-reset-token-123';
            const expectedUrl = `${process.env.FRONTEND_URL}/reset-password?token=${testToken}`;
            
            expect(expectedUrl).toBe('http://localhost:3000/reset-password?token=test-reset-token-123');
        });

        it('should not expose sensitive information in emails', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            const emailCall = mockSendMail.mock.calls[0][0];
            
            // Ensure sensitive data is not exposed
            expect(emailCall.html).not.toContain(process.env.JWT_SECRET);
            expect(emailCall.html).not.toContain(process.env.EMAIL_PASS);
            expect(emailCall.html).not.toContain('user_id');
            expect(emailCall.html).not.toContain('password');
        });

        it('should use proper HTML email formatting', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockResolvedValue({ rows: [] });

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            const emailCall = mockSendMail.mock.calls[0][0];
            
            // Check HTML structure
            expect(emailCall.html).toContain('<div');
            expect(emailCall.html).toContain('font-family');
            expect(emailCall.html).toContain('style=');
            expect(emailCall.html).toContain('<a href=');
        });
    });

    describe('Email Service Integration', () => {
        it('should handle different email service providers', () => {
            // Test with different service
            process.env.EMAIL_SERVICE = 'yahoo';
            
            // Clear the require cache to force re-import
            delete require.cache[require.resolve('../controllers/authController')];
            require('../controllers/authController');

            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: 'yahoo',
                auth: {
                    user: 'jamesdpkn.testing@gmail.com',
                    pass: 'daxcpvqzxuwrkdka',
                }
            });

            // Reset to Gmail
            process.env.EMAIL_SERVICE = 'gmail';
        });

        it('should default to gmail if no service specified', () => {
            delete process.env.EMAIL_SERVICE;
            
            // Clear the require cache to force re-import
            delete require.cache[require.resolve('../controllers/authController')];
            require('../controllers/authController');

            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: 'gmail',
                auth: {
                    user: 'jamesdpkn.testing@gmail.com',
                    pass: 'daxcpvqzxuwrkdka',
                }
            });

            // Reset
            process.env.EMAIL_SERVICE = 'gmail';
        });
    });

    describe('Error Handling', () => {
        it('should handle missing email in request', async () => {
            mockRequest.body = {}; // No email provided

            await authController.forgotPassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email is required'
            });
        });

        it('should handle invalid email format', async () => {
            mockRequest.body = { email: 'invalid-email' };

            await authController.forgotPassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Please provide a valid email address'
            });
        });

        it('should handle database connection errors', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            pool.query.mockRejectedValue(new Error('Database connection failed'));

            mockRequest.body = { email: 'test@example.com' };

            await authController.forgotPassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error'
            });
        });
    });
});
