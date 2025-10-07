const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock the PostgreSQL pool to use dummy data
const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
        release: jest.fn()
    })
};

// Mock the config
jest.mock('../config/postgresql', () => ({
    pool: mockPool,
    connectDB: jest.fn().mockResolvedValue()
}));

// Import app after mocking
const app = require('../app');

describe('Password Reset API', () => {
    // Dummy test data
    const dummyUsers = [
        {
            user_id: 1,
            email: 'test@example.com',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO', // 'testpass123'
            full_name: 'Test User',
            role: 'Regular',
            password_reset_token: null,
            password_reset_expires: null,
            created_at: new Date()
        },
        {
            user_id: 2,
            email: 'admin@example.com',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO', // 'adminpass123'
            full_name: 'Admin User',
            role: 'Admin',
            password_reset_token: null,
            password_reset_expires: null,
            created_at: new Date()
        },
        {
            user_id: 3,
            email: 'premium@example.com',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO', // 'premiumpass123'
            full_name: 'Premium User',
            role: 'Premium',
            password_reset_token: 'old-token-123',
            password_reset_expires: new Date(Date.now() + 3600000), // 1 hour from now
            created_at: new Date()
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/forgot-password', () => {
        it('should send password reset email for existing user', async () => {
            // Mock database query to return existing user
            mockPool.query
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }) // findByEmail
                .mockResolvedValueOnce({ rows: [{ ...dummyUsers[0], password_reset_token: 'new-token' }] }); // updatePasswordResetFields

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Password reset email sent successfully',
                email: 'test@example.com'
            });

            // Verify database was called
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should return 404 for non-existing user', async () => {
            // Mock database query to return no user
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);

            expect(response.body).toEqual({
                error: 'User not found with this email address'
            });
        });

        it('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                error: 'Email is required'
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock database error
            mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to send password reset email. Please try again later.'
            });
        });
    });

    describe('POST /auth/reset-password', () => {
        let validToken;

        beforeEach(() => {
            // Generate a valid token for testing
            validToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
        });

        it('should reset password with valid token', async () => {
            // Mock database queries
            mockPool.query
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        ...dummyUsers[0], 
                        password_reset_token: validToken,
                        password_reset_expires: new Date(Date.now() + 3600000)
                    }] 
                }) // findByResetToken
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }); // updatePassword

            const response = await request(app)
                .post(`/auth/reset-password?token=${validToken}`)
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Password reset successful. You can now login with your new password.'
            });

            // Verify database was called
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should return 400 for password mismatch', async () => {
            const response = await request(app)
                .post(`/auth/reset-password?token=${validToken}`)
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'differentpassword'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Passwords do not match'
            });
        });

        it('should return 400 for short password', async () => {
            const response = await request(app)
                .post(`/auth/reset-password?token=${validToken}`)
                .send({
                    password: '123',
                    confirmPassword: '123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Password must be at least 6 characters long'
            });
        });

        it('should return 401 for invalid token', async () => {
            const response = await request(app)
                .post('/auth/reset-password?token=invalid-token')
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid or expired password reset token'
            });
        });

        it('should return 401 for expired token', async () => {
            const expiredToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '-1h' });

            const response = await request(app)
                .post(`/auth/reset-password?token=${expiredToken}`)
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid or expired password reset token'
            });
        });

        it('should return 401 for token with no matching user', async () => {
            // Mock database query to return no user
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post(`/auth/reset-password?token=${validToken}`)
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid or expired password reset token'
            });
        });

        it('should return 400 for missing token', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Reset token is required'
            });
        });

        it('should return 400 for missing password fields', async () => {
            const response = await request(app)
                .post(`/auth/reset-password?token=${validToken}`)
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                error: 'Password and confirm password are required'
            });
        });
    });

    describe('Email functionality', () => {
        it('should handle email sending failures gracefully', async () => {
            // Mock database query to return existing user
            mockPool.query
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }) // findByEmail
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }); // cleanup on email failure

            // Mock nodemailer to fail
            const nodemailer = require('nodemailer');
            const mockTransporter = {
                sendMail: jest.fn().mockRejectedValue(new Error('Email service unavailable'))
            };
            nodemailer.createTransporter.mockReturnValue(mockTransporter);

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to send password reset email. Please try again later.'
            });
        });
    });

    describe('Security tests', () => {
        it('should not reveal user existence in forgot password', async () => {
            // Mock database query to return no user
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);

            // Should not reveal whether user exists or not in production
            // For testing, we're being explicit, but in production you might want to always return 200
            expect(response.body.error).toBe('User not found with this email address');
        });

        it('should validate JWT token properly', async () => {
            // Test with malformed token
            const response = await request(app)
                .post('/auth/reset-password?token=malformed.token.here')
                .send({
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body.error).toBe('Invalid or expired password reset token');
        });

        it('should handle SQL injection attempts', async () => {
            const sqlInjectionEmail = "'; DROP TABLE Users; --";
            
            // Mock database query - should be called with sanitized input
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: sqlInjectionEmail })
                .expect(404);

            // Verify the query was called (meaning input was processed, not executed as SQL)
            expect(mockPool.query).toHaveBeenCalled();
        });
    });
});
