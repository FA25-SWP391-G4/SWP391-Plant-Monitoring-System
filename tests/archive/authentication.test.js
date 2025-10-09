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
jest.mock('../config/db', () => ({
    pool: mockPool,
    connectDB: jest.fn().mockResolvedValue()
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
    })
}));

// Import app after mocking
const app = require('../app');

describe('Authentication API', () => {
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
        
        // Set environment variables for testing
        process.env.JWT_SECRET = 'test_secret_key';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'testpass';
        process.env.EMAIL_SERVICE = 'test';
    });

    // UC1: User Registration Tests
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                email: 'newuser@example.com',
                password: 'securePassword123',
                confirmPassword: 'securePassword123',
                full_name: 'New User'
            };

            // Mock bcrypt hash
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password_123');
            
            // Mock database query to check for existing user and then insert
            mockPool.query
                .mockResolvedValueOnce({ rows: [] }) // No existing user
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        user_id: 4, 
                        email: newUser.email,
                        full_name: newUser.full_name,
                        role: 'Regular',
                        created_at: new Date()
                    }]
                });

            const response = await request(app)
                .post('/auth/register')
                .send(newUser)
                .expect(201);

            expect(response.body).toEqual({
                success: true,
                message: 'Registration successful',
                data: {
                    user_id: 4,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    role: 'Regular'
                }
            });

            // Verify database was called
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: 'newuser@example.com'
                    // Missing password and full_name
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('required');
        });

        it('should return 400 for password mismatch', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123',
                    confirmPassword: 'differentPassword',
                    full_name: 'New User'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Passwords do not match'
            });
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: '123', // Too short
                    confirmPassword: '123',
                    full_name: 'New User'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Password must be at least 6 characters long'
            });
        });

        it('should return 409 for existing email', async () => {
            // Mock database query to return existing user
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });

            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test@example.com', // Already exists
                    password: 'securePassword123',
                    confirmPassword: 'securePassword123',
                    full_name: 'Existing User'
                })
                .expect(409);

            expect(response.body).toEqual({
                error: 'Email already in use'
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock database error
            mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'securePassword123',
                    confirmPassword: 'securePassword123',
                    full_name: 'New User'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Registration failed. Please try again later.'
            });
        });
    });

    // UC2: User Login Tests
    describe('POST /auth/login', () => {
        it('should login user with correct credentials and return JWT token', async () => {
            // Mock database query to return existing user
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });
            
            // Mock bcrypt compare
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            
            // Mock JWT sign
            jest.spyOn(jwt, 'sign').mockReturnValue('valid_jwt_token_123');

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'testpass123'
                })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        user_id: 1,
                        email: 'test@example.com',
                        full_name: 'Test User',
                        role: 'Regular'
                    },
                    token: 'valid_jwt_token_123'
                }
            });

            // Verify database was called
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    // Missing email and password
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Email and password are required'
            });
        });

        it('should return 401 for non-existing user', async () => {
            // Mock database query to return no user
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'anypassword'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid email or password'
            });
        });

        it('should return 401 for incorrect password', async () => {
            // Mock database query to return existing user
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });
            
            // Mock bcrypt compare to return false (password mismatch)
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid email or password'
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock database error
            mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'testpass123'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Login failed. Please try again later.'
            });
        });
    });

    // UC3: User Logout Tests
    describe('POST /auth/logout', () => {
        it('should successfully logout authenticated user', async () => {
            // Create a valid JWT token for authentication
            const validToken = jwt.sign(
                { user_id: 1, email: 'test@example.com', role: 'Regular' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user lookup in middleware
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });

            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Logout successful'
            });
        });

        it('should return 401 for unauthenticated requests', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .expect(401);

            expect(response.body.error).toContain('Authentication required');
        });

        it('should return 401 for invalid token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.error).toContain('Invalid token');
        });
    });

    // UC12: Change Password Tests
    describe('PUT /auth/change-password', () => {
        it('should change password for authenticated user', async () => {
            // Create a valid JWT token for authentication
            const validToken = jwt.sign(
                { user_id: 1, email: 'test@example.com', role: 'Regular' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user lookup in middleware and password verification
            mockPool.query
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }) // findById in auth middleware
                .mockResolvedValueOnce({ rows: [{ ...dummyUsers[0], password_hash: 'new_hashed_password' }] }); // updatePassword

            // Mock bcrypt functions
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // Current password verification
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password'); // New password hashing

            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    currentPassword: 'testpass123',
                    newPassword: 'newSecurePass456',
                    confirmPassword: 'newSecurePass456'
                })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Password changed successfully'
            });

            // Verify database was called correctly
            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for password mismatch', async () => {
            // Create a valid JWT token for authentication
            const validToken = jwt.sign(
                { user_id: 1, email: 'test@example.com', role: 'Regular' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user lookup in middleware
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });

            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    currentPassword: 'testpass123',
                    newPassword: 'newSecurePass456',
                    confirmPassword: 'differentPassword'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'New password and confirm password do not match'
            });
        });

        it('should return 400 for weak new password', async () => {
            // Create a valid JWT token for authentication
            const validToken = jwt.sign(
                { user_id: 1, email: 'test@example.com', role: 'Regular' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user lookup in middleware
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });

            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    currentPassword: 'testpass123',
                    newPassword: '123', // Too short
                    confirmPassword: '123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'New password must be at least 6 characters long'
            });
        });

        it('should return 401 for incorrect current password', async () => {
            // Create a valid JWT token for authentication
            const validToken = jwt.sign(
                { user_id: 1, email: 'test@example.com', role: 'Regular' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user lookup in middleware
            mockPool.query.mockResolvedValueOnce({ rows: [dummyUsers[0]] });

            // Mock bcrypt compare to return false (password mismatch)
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newSecurePass456',
                    confirmPassword: 'newSecurePass456'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Current password is incorrect'
            });
        });

        it('should return 401 for unauthenticated requests', async () => {
            const response = await request(app)
                .put('/auth/change-password')
                .send({
                    currentPassword: 'testpass123',
                    newPassword: 'newSecurePass456',
                    confirmPassword: 'newSecurePass456'
                })
                .expect(401);

            expect(response.body.error).toContain('Authentication required');
        });
    });

    // UC11: Password Reset Tests (Forgot Password)
    describe('POST /auth/forgot-password', () => {
        it('should send password reset email for existing user', async () => {
            // Mock database query to return existing user
            mockPool.query
                .mockResolvedValueOnce({ rows: [dummyUsers[0]] }) // findByEmail
                .mockResolvedValueOnce({ rows: [{ ...dummyUsers[0], password_reset_token: 'new-token' }] }); // updatePasswordResetFields

            // Mock JWT sign for reset token
            jest.spyOn(jwt, 'sign').mockReturnValue('new-reset-token-123');

            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Password reset email sent successfully',
                data: {
                    email: 'test@example.com',
                    resetUrl: expect.stringContaining('reset-password?token='),
                    expiresIn: '1 hour'
                }
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

    // UC11: Password Reset Tests (Reset Password)
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

            // Mock bcrypt hash
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password');

            const response = await request(app)
                .post(`/auth/reset-password`)
                .send({
                    token: validToken,
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Password reset successful. You can now login with your new password.'
            });

            // Verify database was called
            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for password mismatch', async () => {
            const response = await request(app)
                .post(`/auth/reset-password`)
                .send({
                    token: validToken,
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
                .post(`/auth/reset-password`)
                .send({
                    token: validToken,
                    password: '123',
                    confirmPassword: '123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Password must be at least 6 characters long'
            });
        });

        it('should return 401 for invalid token', async () => {
            // Mock JWT verify to throw an error
            jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: 'invalid-token',
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid or expired password reset token'
            });
        });

        it('should return 401 for user not found by token', async () => {
            // Mock JWT verify to return valid payload
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: 1 });

            // Mock database query to return no user
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: validToken,
                    password: 'newpassword123',
                    confirmPassword: 'newpassword123'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid or expired password reset token'
            });
        });
    });

    // UC2: Google Login Tests
    describe('POST /auth/google-login', () => {
        it('should login or register user with Google credentials', async () => {
            const googleUser = {
                googleId: 'google-123',
                email: 'google@example.com',
                name: 'Google User',
                picture: 'https://example.com/profile.jpg'
            };

            // Mock database queries - user doesn't exist yet, so it creates one
            mockPool.query
                .mockResolvedValueOnce({ rows: [] }) // findByEmail
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        user_id: 5, 
                        email: googleUser.email,
                        full_name: googleUser.name,
                        role: 'Regular',
                        google_id: googleUser.googleId,
                        profile_picture: googleUser.picture,
                        created_at: new Date()
                    }]
                }); // create user

            // Mock JWT sign
            jest.spyOn(jwt, 'sign').mockReturnValue('valid_google_jwt_token_123');

            const response = await request(app)
                .post('/auth/google-login')
                .send(googleUser)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Google login successful',
                data: {
                    user: {
                        user_id: 5,
                        email: googleUser.email,
                        full_name: googleUser.name,
                        role: 'Regular',
                        profile_picture: googleUser.picture
                    },
                    token: 'valid_google_jwt_token_123',
                    isNewUser: true
                }
            });
        });

        it('should login existing user with Google credentials', async () => {
            const googleUser = {
                googleId: 'google-456',
                email: 'test@example.com', // Already exists in our dummy data
                name: 'Test User',
                picture: 'https://example.com/profile.jpg'
            };

            // Mock database queries - user already exists
            mockPool.query
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        ...dummyUsers[0],
                        google_id: googleUser.googleId,
                        profile_picture: googleUser.picture
                    }] 
                }) // findByEmail
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        ...dummyUsers[0],
                        google_id: googleUser.googleId,
                        profile_picture: googleUser.picture
                    }] 
                }); // update user

            // Mock JWT sign
            jest.spyOn(jwt, 'sign').mockReturnValue('valid_google_jwt_token_456');

            const response = await request(app)
                .post('/auth/google-login')
                .send(googleUser)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Google login successful',
                data: {
                    user: {
                        user_id: 1,
                        email: 'test@example.com',
                        full_name: 'Test User',
                        role: 'Regular',
                        profile_picture: googleUser.picture
                    },
                    token: 'valid_google_jwt_token_456',
                    isNewUser: false
                }
            });
        });

        it('should return 400 for missing Google credentials', async () => {
            const response = await request(app)
                .post('/auth/google-login')
                .send({
                    // Missing required fields
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Google ID, email, and name are required'
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock database error
            mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .post('/auth/google-login')
                .send({
                    googleId: 'google-123',
                    email: 'google@example.com',
                    name: 'Google User',
                    picture: 'https://example.com/profile.jpg'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Google login failed. Please try again later.'
            });
        });
    });
});
