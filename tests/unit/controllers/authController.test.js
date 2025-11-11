/**
 * AUTH CONTROLLER TESTS
 * =====================
 * 
 * Comprehensive unit tests for authentication controller
 * Covers user registration, login, logout, password management, and Google auth
 */

const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const emailService = require('../../../services/emailService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');
jest.mock('../../../services/emailService');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: null,
            headers: {},
            ip: '127.0.0.1'
        };
        
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis()
        };
        
        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
        
        // Set up default environment variables
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '7d';
    });

    // UC1: User Registration
    describe('User Registration (UC1)', () => {
        describe('register', () => {
            it('should register a new user successfully', async () => {
                mockReq.body = {
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                const mockHashedPassword = 'hashedPassword123';
                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'Regular',
                    created_at: new Date()
                };

                User.findByEmail.mockResolvedValue(null);
                bcrypt.hash.mockResolvedValue(mockHashedPassword);
                User.create.mockResolvedValue(mockUser);
                emailService.sendWelcomeEmail.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.register(mockReq, mockRes);

                expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
                expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
                expect(User.create).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: mockHashedPassword,
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'Regular'
                });
                expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser);
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'auth',
                    'user_registered',
                    expect.stringContaining('test@example.com'),
                    null
                );
                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User registered successfully',
                    user: expect.objectContaining({
                        email: 'test@example.com',
                        firstName: 'John'
                    })
                });
            });

            it('should prevent duplicate email registration', async () => {
                mockReq.body = {
                    email: 'existing@example.com',
                    password: 'password123'
                };

                User.findByEmail.mockResolvedValue({ id: 'existing-user' });

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email already exists'
                });
                expect(User.create).not.toHaveBeenCalled();
            });

            it('should validate required fields', async () => {
                mockReq.body = {
                    email: 'test@example.com'
                    // Missing password
                };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'All fields are required'
                });
            });

            it('should validate email format', async () => {
                mockReq.body = {
                    email: 'invalid-email',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid email format'
                });
            });

            it('should validate password strength', async () => {
                mockReq.body = {
                    email: 'test@example.com',
                    password: '123',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Password must be at least 8 characters long'
                });
            });

            it('should handle database errors during registration', async () => {
                mockReq.body = {
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                User.findByEmail.mockResolvedValue(null);
                bcrypt.hash.mockResolvedValue('hashedPassword');
                User.create.mockRejectedValue(new Error('Database connection failed'));

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Registration failed'
                });
            });
        });
    });

    // UC2: User Login
    describe('User Login (UC2)', () => {
        describe('login', () => {
            it('should login user successfully with valid credentials', async () => {
                mockReq.body = {
                    email: 'test@example.com',
                    password: 'password123'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    password: 'hashedPassword',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'Regular'
                };

                const mockToken = 'jwt-token-123';

                User.findByEmail.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);
                jwt.sign.mockReturnValue(mockToken);
                SystemLog.log.mockResolvedValue();

                await authController.login(mockReq, mockRes);

                expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
                expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
                expect(jwt.sign).toHaveBeenCalledWith(
                    { 
                        id: 'user-123', 
                        email: 'test@example.com', 
                        role: 'Regular' 
                    },
                    'test-secret',
                    { expiresIn: '7d' }
                );
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'auth',
                    'user_login',
                    expect.stringContaining('test@example.com'),
                    'user-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Login successful',
                    token: mockToken,
                    user: expect.objectContaining({
                        id: 'user-123',
                        email: 'test@example.com'
                    })
                });
            });

            it('should reject login with invalid email', async () => {
                mockReq.body = {
                    email: 'nonexistent@example.com',
                    password: 'password123'
                };

                User.findByEmail.mockResolvedValue(null);

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid credentials'
                });
            });

            it('should reject login with invalid password', async () => {
                mockReq.body = {
                    email: 'test@example.com',
                    password: 'wrongpassword'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    password: 'hashedPassword'
                };

                User.findByEmail.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(false);

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid credentials'
                });
                expect(jwt.sign).not.toHaveBeenCalled();
            });

            it('should validate required login fields', async () => {
                mockReq.body = {
                    email: 'test@example.com'
                    // Missing password
                };

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email and password are required'
                });
            });

            it('should handle rate limiting for failed login attempts', async () => {
                // Mock multiple failed attempts
                mockReq.body = {
                    email: 'test@example.com',
                    password: 'wrongpassword'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    password: 'hashedPassword',
                    failed_login_attempts: 5,
                    account_locked_until: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                };

                User.findByEmail.mockResolvedValue(mockUser);

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(423);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Account temporarily locked due to too many failed login attempts'
                });
            });
        });
    });

    // UC3: User Logout
    describe('User Logout (UC3)', () => {
        describe('logout', () => {
            it('should logout user successfully', async () => {
                mockReq.user = {
                    id: 'user-123',
                    email: 'test@example.com'
                };
                mockReq.headers.authorization = 'Bearer jwt-token-123';

                SystemLog.log.mockResolvedValue();

                await authController.logout(mockReq, mockRes);

                expect(SystemLog.log).toHaveBeenCalledWith(
                    'auth',
                    'user_logout',
                    expect.stringContaining('test@example.com'),
                    'user-123'
                );
                expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Logout successful'
                });
            });

            it('should handle logout without authentication', async () => {
                // No user in request

                await authController.logout(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Not authenticated'
                });
            });
        });
    });

    // UC26: Forgot Password
    describe('Forgot Password (UC26)', () => {
        describe('forgotPassword', () => {
            it('should send password reset email for valid user', async () => {
                mockReq.body = {
                    email: 'test@example.com'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    firstName: 'John'
                };

                User.findByEmail.mockResolvedValue(mockUser);
                User.updateResetToken.mockResolvedValue();
                emailService.sendPasswordResetEmail.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.forgotPassword(mockReq, mockRes);

                expect(User.updateResetToken).toHaveBeenCalledWith(
                    'user-123',
                    expect.any(String),
                    expect.any(Date)
                );
                expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
                    mockUser,
                    expect.any(String)
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Password reset email sent'
                });
            });

            it('should handle non-existent email gracefully', async () => {
                mockReq.body = {
                    email: 'nonexistent@example.com'
                };

                User.findByEmail.mockResolvedValue(null);

                await authController.forgotPassword(mockReq, mockRes);

                // Should not reveal if email exists or not
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Password reset email sent'
                });
                expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
            });

            it('should validate email field', async () => {
                mockReq.body = {};

                await authController.forgotPassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email is required'
                });
            });
        });

        describe('resetPassword', () => {
            it('should reset password with valid token', async () => {
                mockReq.body = {
                    token: 'valid-reset-token',
                    password: 'NewSecurePass123!'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    password_reset_token: 'valid-reset-token',
                    password_reset_expires: new Date(Date.now() + 3600000) // 1 hour
                };

                const mockHashedPassword = 'newHashedPassword';

                User.findByResetToken.mockResolvedValue(mockUser);
                bcrypt.hash.mockResolvedValue(mockHashedPassword);
                User.updatePassword.mockResolvedValue();
                User.clearResetToken.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.resetPassword(mockReq, mockRes);

                expect(bcrypt.hash).toHaveBeenCalledWith('NewSecurePass123!', 12);
                expect(User.updatePassword).toHaveBeenCalledWith('user-123', mockHashedPassword);
                expect(User.clearResetToken).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Password reset successful'
                });
            });

            it('should reject invalid or expired token', async () => {
                mockReq.body = {
                    token: 'invalid-token',
                    password: 'NewPassword123!'
                };

                User.findByResetToken.mockResolvedValue(null);

                await authController.resetPassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid or expired reset token'
                });
            });

            it('should validate new password strength', async () => {
                mockReq.body = {
                    token: 'valid-token',
                    password: '123'
                };

                await authController.resetPassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Password must be at least 8 characters long'
                });
            });
        });
    });

    // UC9: Change Password
    describe('Change Password (UC9)', () => {
        describe('changePassword', () => {
            it('should change password successfully with correct current password', async () => {
                mockReq.user = {
                    id: 'user-123',
                    email: 'test@example.com'
                };
                mockReq.body = {
                    currentPassword: 'OldPassword123!',
                    newPassword: 'NewPassword123!'
                };

                const mockUser = {
                    id: 'user-123',
                    password: 'oldHashedPassword'
                };

                const mockNewHashedPassword = 'newHashedPassword';

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);
                bcrypt.hash.mockResolvedValue(mockNewHashedPassword);
                User.updatePassword.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.changePassword(mockReq, mockRes);

                expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123!', 'oldHashedPassword');
                expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
                expect(User.updatePassword).toHaveBeenCalledWith('user-123', mockNewHashedPassword);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Password changed successfully'
                });
            });

            it('should reject incorrect current password', async () => {
                mockReq.user = {
                    id: 'user-123',
                    email: 'test@example.com'
                };
                mockReq.body = {
                    currentPassword: 'WrongPassword',
                    newPassword: 'NewPassword123!'
                };

                const mockUser = {
                    id: 'user-123',
                    password: 'hashedPassword'
                };

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(false);

                await authController.changePassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Current password is incorrect'
                });
                expect(User.updatePassword).not.toHaveBeenCalled();
            });

            it('should validate required fields for password change', async () => {
                mockReq.user = { id: 'user-123' };
                mockReq.body = {
                    currentPassword: 'OldPassword123!'
                    // Missing newPassword
                };

                await authController.changePassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Current password and new password are required'
                });
            });

            it('should prevent using same password', async () => {
                mockReq.user = { id: 'user-123' };
                mockReq.body = {
                    currentPassword: 'SamePassword123!',
                    newPassword: 'SamePassword123!'
                };

                await authController.changePassword(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'New password must be different from current password'
                });
            });
        });
    });

    // Google Authentication
    describe('Google Authentication', () => {
        describe('linkGoogleAccount', () => {
            it('should link Google account to existing user', async () => {
                mockReq.user = {
                    id: 'user-123',
                    email: 'test@example.com'
                };
                mockReq.body = {
                    googleId: 'google-123',
                    googleEmail: 'test@gmail.com'
                };

                User.linkGoogleAccount.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.linkGoogleAccount(mockReq, mockRes);

                expect(User.linkGoogleAccount).toHaveBeenCalledWith('user-123', {
                    googleId: 'google-123',
                    googleEmail: 'test@gmail.com'
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Google account linked successfully'
                });
            });
        });

        describe('unlinkGoogleAccount', () => {
            it('should unlink Google account from user', async () => {
                mockReq.user = {
                    id: 'user-123',
                    email: 'test@example.com'
                };

                User.unlinkGoogleAccount.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await authController.unlinkGoogleAccount(mockReq, mockRes);

                expect(User.unlinkGoogleAccount).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Google account unlinked successfully'
                });
            });
        });
    });

    // Error handling
    describe('Error Handling', () => {
        it('should handle email service failures gracefully', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            };

            User.findByEmail.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.create.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
            emailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service down'));

            await authController.register(mockReq, mockRes);

            // Should still register user even if email fails
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'User registered successfully',
                user: expect.any(Object)
            });
        });

        it('should handle JWT signing errors', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockImplementation(() => {
                throw new Error('JWT signing failed');
            });

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Login failed'
            });
        });
    });
});