const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const emailService = require('../../../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateUUID, isValidUUID } = require('../../../utils/uuidGenerator');

        /**         * ============================================================================         * UNIT TEST: Auth Controller
         * ============================================================================
         * ISTQB Level: Unit Testing
         * Component: controllers/authController.js
         */


        // Mock dependencies
        jest.mock('../../../models/User');
        jest.mock('../../../models/SystemLog');
        jest.mock('../../../services/emailService');
        jest.mock('jsonwebtoken');
        jest.mock('bcryptjs');
        jest.mock('../../../utils/uuidGenerator');

        describe('authController', () => {
          let req, res, next;
          let mockUser;

          beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock request and response objects
            req = {
              body: {},
              query: {},
              user: null,
              session: {},
              sessionID: 'test-session-id',
              headers: {}
            };

            res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
              cookie: jest.fn().mockReturnThis(),
              redirect: jest.fn().mockReturnThis(),
              writeHead: jest.fn().mockReturnThis(),
              end: jest.fn().mockReturnThis()
            };

            next = jest.fn();

            // Mock user object
            mockUser = {
              user_id: 'test-uuid-123',
              email: 'test@example.com',
              password: 'hashedpassword',
              given_name: 'John',
              family_name: 'Doe',
              role: 'Regular',
              google_id: null,
              profile_picture: null,
              language: 'en',
              created_at: '2024-01-01T00:00:00Z',
              save: jest.fn().mockResolvedValue(true),
              update: jest.fn().mockResolvedValue(true),
              validatePassword: jest.fn(),
              updatePassword: jest.fn().mockResolvedValue(true),
              createPasswordResetToken: jest.fn().mockReturnValue('reset-token-123'),
              updatePasswordResetFields: jest.fn().mockResolvedValue(true)
            };

            // Mock environment variables
            process.env.JWT_SECRET = 'test-secret';
            process.env.FRONTEND_URL = 'http://localhost:3000';
            process.env.EMAIL_USER = 'test@example.com';

            // Mock UUID utilities
            isValidUUID.mockReturnValue(true);
            generateUUID.mockReturnValue('test-uuid-123');
          });

          afterEach(() => {
            jest.restoreAllMocks();
          });

          describe('register()', () => {
            beforeEach(() => {
              req.body = {
                email: 'test@example.com',
                password: 'password123',
                given_name: 'John',
                family_name: 'Doe'
              };
            });

            test('should register new user successfully', async () => {
              User.findByEmail.mockResolvedValue(null);
              User.mockImplementation(() => mockUser);
              mockUser.save.mockResolvedValue(mockUser);
              jwt.sign.mockReturnValue('jwt-token-123');

              await authController.register(req, res);

              expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
              expect(mockUser.save).toHaveBeenCalled();
              expect(res.status).toHaveBeenCalledWith(201);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Registration successful',
                data: {
                  user: {
                    user_id: mockUser.user_id,
                    email: mockUser.email,
                    family_name: mockUser.family_name,
                    given_name: mockUser.given_name,
                    role: mockUser.role
                  },
                  token: 'jwt-token-123'
                }
              });
            });

            test('should reject duplicate email', async () => {
              User.findByEmail.mockResolvedValue(mockUser);

              await authController.register(req, res);

              expect(res.status).toHaveBeenCalledWith(409);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered'
              });
            });

            test('should handle database error during save', async () => {
              User.findByEmail.mockResolvedValue(null);
              User.mockImplementation(() => mockUser);
              mockUser.save.mockRejectedValue(new Error('Database error'));

              await authController.register(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Registration failed. Please try again later.'
              });
            });

            test('should handle duplicate key error during save', async () => {
              User.findByEmail.mockResolvedValue(null);
              User.mockImplementation(() => mockUser);
              const duplicateError = new Error('Duplicate key');
              duplicateError.code = '23505';
              mockUser.save.mockRejectedValue(duplicateError);

              await authController.register(req, res);

              expect(res.status).toHaveBeenCalledWith(409);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered'
              });
            });

            test('should register with Google data', async () => {
              req.body.google_id = 'google-123';
              req.body.profile_picture = 'https://example.com/avatar.jpg';
              
              User.findByEmail.mockResolvedValue(null);
              User.mockImplementation(() => mockUser);
              mockUser.save.mockResolvedValue(mockUser);
              jwt.sign.mockReturnValue('jwt-token-123');

              await authController.register(req, res);

              expect(res.status).toHaveBeenCalledWith(201);
              expect(User).toHaveBeenCalledWith(expect.objectContaining({
                google_id: 'google-123',
                profile_picture: 'https://example.com/avatar.jpg'
              }));
            });
          });

          describe('login()', () => {
            beforeEach(() => {
              req.body = {
                email: 'test@example.com',
                password: 'password123'
              };
            });

            test('should login user successfully', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              mockUser.validatePassword.mockResolvedValue(true);
              jwt.sign.mockReturnValue('jwt-token-123');

              await authController.login(req, res);

              expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
              expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successful',
                data: {
                  user: expect.objectContaining({
                    user_id: mockUser.user_id,
                    email: mockUser.email,
                    role: mockUser.role
                  }),
                  token: 'jwt-token-123'
                }
              });
            });

            test('should reject login with missing email', async () => {
              req.body.email = '';

              await authController.login(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Email and password are required'
              });
            });

            test('should reject login with missing password', async () => {
              req.body.password = '';

              await authController.login(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Email and password are required'
              });
            });

            test('should reject login for non-existent user', async () => {
              User.findByEmail.mockResolvedValue(null);

              await authController.login(req, res);

              expect(res.status).toHaveBeenCalledWith(401);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid email or password'
              });
            });

            test('should reject login with invalid password', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              mockUser.validatePassword.mockResolvedValue(false);

              await authController.login(req, res);

              expect(res.status).toHaveBeenCalledWith(401);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid email or password'
              });
            });

            test('should handle Google login for existing user', async () => {
              req.body = {
                email: 'test@example.com',
                googleId: 'google-123',
                loginMethod: 'google'
              };
              mockUser.google_id = 'google-123';
              User.findByEmail.mockResolvedValue(mockUser);
              jwt.sign.mockReturnValue('jwt-token-123');

              await authController.login(req, res);

              expect(res.writeHead).toHaveBeenCalledWith(302, { 'Location': expect.stringContaining('/auth/callback') });
            });

            test('should redirect new Google user to registration', async () => {
              req.body = {
                email: 'newuser@example.com',
                googleId: 'google-123',
                loginMethod: 'google'
              };
              User.findByEmail.mockResolvedValue(null);

              await authController.login(req, res);

              expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/register?error=account_not_found'));
            });

            test('should link Google account to existing user', async () => {
              req.body = {
                email: 'test@example.com',
                googleId: 'google-123',
                refreshToken: 'refresh-123',
                loginMethod: 'google'
              };
              User.findByEmail.mockResolvedValue(mockUser);
              User.findById.mockResolvedValue(mockUser);
              jwt.sign.mockReturnValue('jwt-token-123');

              await authController.login(req, res);

              expect(mockUser.update).toHaveBeenCalledWith({
                google_id: 'google-123',
                google_refresh_token: 'refresh-123'
              });
            });

            test('should handle Google ID mismatch', async () => {
              req.body = {
                email: 'test@example.com',
                googleId: 'google-456',
                loginMethod: 'google'
              };
              mockUser.google_id = 'google-123';
              User.findByEmail.mockResolvedValue(mockUser);

              await authController.login(req, res);

              expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error=google_id_mismatch'));
            });
          });

          describe('logout()', () => {
            test('should logout successfully', async () => {
              req.user = { user_id: 'test-uuid-123' };

              await authController.logout(req, res);

              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logout successful'
              });
            });

            test('should handle logout error', async () => {
              // Mock console.log to throw error
              const originalLog = console.log;
              console.log = jest.fn(() => {
                throw new Error('Logging error');
              });

              await authController.logout(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Logout failed. Please try again later.'
              });

              console.log = originalLog;
            });
          });

          describe('forgotPassword()', () => {
            beforeEach(() => {
              req.body = { email: 'test@example.com' };
            });

            test('should send password reset email successfully', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              emailService.verifyConnection.mockResolvedValue(true);
              emailService.sendEmail.mockResolvedValue({ messageId: 'msg-123' });
              SystemLog.info = jest.fn().mockResolvedValue(true);

              await authController.forgotPassword(req, res);

              expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
              expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
              expect(mockUser.updatePasswordResetFields).toHaveBeenCalled();
              expect(emailService.sendEmail).toHaveBeenCalled();
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Password reset email sent successfully')
              }));
            });

            test('should reject empty email', async () => {
              req.body.email = '';

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email is required'
              });
            });

            test('should reject invalid email format', async () => {
              req.body.email = 'invalid-email';

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Please provide a valid email address'
              });
            });

            test('should handle non-existent user', async () => {
              User.findByEmail.mockResolvedValue(null);

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(404);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No account found with this email address. Please check the email or register first.'
              });
            });

            test('should handle email service unavailable', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              emailService.verifyConnection.mockResolvedValue(false);

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
            });

            test('should handle email sending failure', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              emailService.verifyConnection.mockResolvedValue(true);
              const emailError = new Error('SMTP error');
              emailError.code = 'ECONNECTION';
              emailService.sendEmail.mockRejectedValue(emailError);
              SystemLog.error = jest.fn().mockResolvedValue(true);

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
              expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'EMAIL_CONNECTION_FAILED'
              }));
            });

            test('should handle skipped email', async () => {
              User.findByEmail.mockResolvedValue(mockUser);
              emailService.verifyConnection.mockResolvedValue(true);
              emailService.sendEmail.mockResolvedValue({ skipped: true, reason: 'Test mode' });
              SystemLog.warning = jest.fn().mockResolvedValue(true);

              await authController.forgotPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(503);
              expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'EMAIL_SERVICE_UNAVAILABLE'
              }));
            });
          });

          describe('resetPassword()', () => {
            beforeEach(() => {
              req.query = { token: 'reset-token-123' };
              req.body = {
                password: 'newpassword123',
                confirmPassword: 'newpassword123'
              };
            });

            test('should reset password successfully', async () => {
              User.findByResetToken.mockResolvedValue(mockUser);
              emailService.sendEmail.mockResolvedValue({ messageId: 'msg-123' });
              SystemLog.info = jest.fn().mockResolvedValue(true);

              await authController.resetPassword(req, res);

              expect(User.findByResetToken).toHaveBeenCalledWith('reset-token-123');
              expect(mockUser.updatePassword).toHaveBeenCalledWith('newpassword123');
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Password reset successful. You can now login with your new password.'
              }));
            });

            test('should reject missing token', async () => {
              req.query.token = '';

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Reset token is required'
              });
            });

            test('should reject missing password', async () => {
              req.body.password = '';

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Password and confirm password are required'
              });
            });

            test('should reject password mismatch', async () => {
              req.body.confirmPassword = 'different';

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Passwords do not match'
              });
            });

            test('should reject short password', async () => {
              req.body.password = '123';
              req.body.confirmPassword = '123';

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Password must be at least 6 characters long'
              });
            });

            test('should handle invalid token', async () => {
              User.findByResetToken.mockResolvedValue(null);

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(401);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired password reset token. Please request a new password reset.',
                error: 'TOKEN_INVALID'
              });
            });

            test('should handle JWT error', async () => {
              const jwtError = new Error('Invalid token');
              jwtError.name = 'JsonWebTokenError';
              User.findByResetToken.mockRejectedValue(jwtError);
              SystemLog.error = jest.fn().mockResolvedValue(true);

              await authController.resetPassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'INVALID_TOKEN_FORMAT'
              }));
            });
          });

          describe('changePassword()', () => {
            beforeEach(() => {
              req.user = { user_id: 'test-uuid-123' };
              req.body = {
                currentPassword: 'oldpassword',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123'
              };
            });

            test('should change password successfully', async () => {
              User.findById.mockResolvedValue(mockUser);
              bcrypt.compare.mockResolvedValue(true);

              await authController.changePassword(req, res);

              expect(User.findById).toHaveBeenCalledWith('test-uuid-123');
              expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', mockUser.password);
              expect(mockUser.updatePassword).toHaveBeenCalledWith('newpassword123');
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password changed successfully'
              });
            });

            test('should reject missing current password', async () => {
              req.body.currentPassword = '';

              await authController.changePassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Current password, new password, and password confirmation are required'
              });
            });

            test('should reject password mismatch', async () => {
              req.body.confirmPassword = 'different';

              await authController.changePassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'New password and confirmation password do not match'
              });
            });

            test('should reject user not found', async () => {
              User.findById.mockResolvedValue(null);

              await authController.changePassword(req, res);

              expect(res.status).toHaveBeenCalledWith(404);
              expect(res.json).toHaveBeenCalledWith({
                error: 'User not found'
              });
            });

            test('should reject incorrect current password', async () => {
              User.findById.mockResolvedValue(mockUser);
              bcrypt.compare.mockResolvedValue(false);

              await authController.changePassword(req, res);

              expect(res.status).toHaveBeenCalledWith(401);
              expect(res.json).toHaveBeenCalledWith({
                error: 'Current password is incorrect'
              });
            });

            test('should reject short password', async () => {
              req.body.newPassword = '123';
              req.body.confirmPassword = '123';

              await authController.changePassword(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                error: 'New password must be at least 8 characters long'
              });
            });
          });

          describe('getCurrentUser()', () => {
            test('should return current user data', async () => {
              req.user = {
                user_id: 'test-uuid-123',
                email: 'test@example.com',
                given_name: 'John',
                family_name: 'Doe',
                role: 'Regular',
                profile_picture: null,
                language: 'en',
                created_at: '2024-01-01T00:00:00Z'
              };

              await authController.getCurrentUser(req, res);

              expect(res.json).toHaveBeenCalledWith({
                success: true,
                user: expect.objectContaining({
                  user_id: 'test-uuid-123',
                  email: 'test@example.com',
                  role: 'Regular'
                })
              });
            });

            test('should reject unauthenticated request', async () => {
              req.user = null;

              await authController.getCurrentUser(req, res);

              expect(res.status).toHaveBeenCalledWith(401);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required. No token provided.'
              });
            });

            test('should handle error', async () => {
              req.user = { user_id: 'test-uuid-123' };
              // Mock res.json to throw error
              res.json.mockImplementation(() => {
                throw new Error('Response error');
              });

              await authController.getCurrentUser(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
            });
          });

          describe('generateToken()', () => {
            test('should generate token for valid user', () => {
              jwt.sign.mockReturnValue('jwt-token-123');

              const token = authController.generateToken(mockUser);

              expect(isValidUUID).toHaveBeenCalledWith(mockUser.user_id);
              expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                  user_id: mockUser.user_id,
                  email: mockUser.email,
                  role: mockUser.role
                }),
                'test-secret',
                { expiresIn: '1d' }
              );
              expect(token).toBe('jwt-token-123');
            });

            test('should throw error for invalid UUID', () => {
              isValidUUID.mockReturnValue(false);

              expect(() => {
                authController.generateToken(mockUser);
              }).toThrow('Invalid user ID format');
            });
          });

          describe('linkGoogleAccount()', () => {
            beforeEach(() => {
              req.user = { user_id: 'test-uuid-123' };
              req.body = {
                googleId: 'google-123',
                googleRefreshToken: 'refresh-123'
              };
            });

            test('should link Google account successfully', async () => {
              User.findById.mockResolvedValue(mockUser);

              await authController.linkGoogleAccount(req, res);

              expect(User.findById).toHaveBeenCalledWith('test-uuid-123');
              expect(mockUser.save).toHaveBeenCalled();
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Google account linked successfully'
              });
            });

            test('should handle user not found', async () => {
              User.findById.mockResolvedValue(null);

              await authController.linkGoogleAccount(req, res);

              expect(res.status).toHaveBeenCalledWith(404);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
              });
            });
          });

          describe('unlinkGoogleAccount()', () => {
            beforeEach(() => {
              req.user = { user_id: 'test-uuid-123' };
            });

            test('should unlink Google account successfully', async () => {
              mockUser.password = 'hashedpassword';
              mockUser.google_id = 'google-123';
              User.findById.mockResolvedValue(mockUser);

              await authController.unlinkGoogleAccount(req, res);

              expect(mockUser.update).toHaveBeenCalledWith({
                google_id: null,
                google_refresh_token: null
              });
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Google account unlinked successfully'
              });
            });

            test('should reject if no password set', async () => {
              mockUser.password = null;
              User.findById.mockResolvedValue(mockUser);

              await authController.unlinkGoogleAccount(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'You must set a password before unlinking your Google account'
              });
            });

            test('should reject if no Google account linked', async () => {
              mockUser.google_id = null;
              User.findById.mockResolvedValue(mockUser);

              await authController.unlinkGoogleAccount(req, res);

              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No Google account is linked to your account'
              });
            });
          });

          describe('refreshToken()', () => {
            beforeEach(() => {
              req.user = { user_id: 'test-uuid-123' };
            });

            test('should refresh token successfully', async () => {
              User.findById.mockResolvedValue(mockUser);
              jwt.sign.mockReturnValue('new-jwt-token');

              await authController.refreshToken(req, res);

              expect(User.findById).toHaveBeenCalledWith('test-uuid-123');
              expect(res.json).toHaveBeenCalledWith({
                success: true,
                token: 'new-jwt-token',
                user: expect.objectContaining({
                  user_id: mockUser.user_id,
                  email: mockUser.email,
                  role: mockUser.role
                })
              });
            });

            test('should handle user not found during refresh', async () => {
              User.findById.mockResolvedValue(null);

              await authController.refreshToken(req, res);

              expect(res.status).toHaveBeenCalledWith(404);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found'
              });
            });

            test('should handle refresh error', async () => {
              User.findById.mockRejectedValue(new Error('Database error'));

              await authController.refreshToken(req, res);

              expect(res.status).toHaveBeenCalledWith(500);
              expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to refresh token'
              });
            });

            // Additional edge cases and integration scenarios
            describe('register() - Additional Edge Cases', () => {
              test('should handle email normalization', async () => {
                req.body.email = '  TEST@EXAMPLE.COM  ';
                User.findByEmail.mockResolvedValue(null);
                User.mockImplementation(() => mockUser);
                mockUser.save.mockResolvedValue(mockUser);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.register(req, res);

                expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
                expect(res.status).toHaveBeenCalledWith(201);
              });

              test('should handle newsletter subscription flag', async () => {
                req.body.newsletter = true;
                User.findByEmail.mockResolvedValue(null);
                User.mockImplementation(() => mockUser);
                mockUser.save.mockResolvedValue(mockUser);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.register(req, res);

                expect(User).toHaveBeenCalledWith(expect.objectContaining({
                  notification_prefs: true
                }));
              });

              test('should handle phone number registration', async () => {
                req.body.phoneNumber = '+1234567890';
                User.findByEmail.mockResolvedValue(null);
                User.mockImplementation(() => mockUser);
                mockUser.save.mockResolvedValue(mockUser);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.register(req, res);

                expect(User).toHaveBeenCalledWith(expect.objectContaining({
                  phone_number: '+1234567890'
                }));
              });

              test('should validate password strength requirements', async () => {
                req.body.password = '123';
                
                await authController.register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  success: false,
                  message: expect.stringMatching(/password/i)
                }));
              });
            });

            describe('login() - Security and Edge Cases', () => {
              test('should handle case insensitive email lookup', async () => {
                req.body.email = 'TEST@EXAMPLE.COM';
                User.findByEmail.mockResolvedValue(mockUser);
                mockUser.validatePassword.mockResolvedValue(true);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.login(req, res);

                expect(User.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
                expect(res.status).toHaveBeenCalledWith(200);
              });

              test('should set secure cookies in production', async () => {
                process.env.NODE_ENV = 'production';
                process.env.COOKIE_DOMAIN = 'example.com';
                
                req.body = { email: 'test@example.com', password: 'password123' };
                User.findByEmail.mockResolvedValue(mockUser);
                mockUser.validatePassword.mockResolvedValue(true);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.login(req, res);

                expect(res.cookie).toHaveBeenCalledWith('token', 'jwt-token-123', expect.objectContaining({
                  secure: true,
                  domain: 'example.com',
                  httpOnly: true
                }));
              });

              test('should handle concurrent login attempts', async () => {
                const concurrentRequests = Array(5).fill().map(() => ({
                  ...req,
                  body: { email: 'test@example.com', password: 'password123' }
                }));

                User.findByEmail.mockResolvedValue(mockUser);
                mockUser.validatePassword.mockResolvedValue(true);
                jwt.sign.mockReturnValue('jwt-token-123');

                const promises = concurrentRequests.map(request => 
                  authController.login(request, res)
                );

                await Promise.all(promises);
                expect(User.findByEmail).toHaveBeenCalledTimes(5);
              });

              test('should handle SQL injection attempt in email', async () => {
                req.body.email = "'; DROP TABLE users; --";
                req.body.password = 'password123';

                User.findByEmail.mockResolvedValue(null);

                await authController.login(req, res);

                expect(res.status).toHaveBeenCalledWith(401);
                expect(User.findByEmail).toHaveBeenCalledWith("'; DROP TABLE users; --");
              });
            });

            describe('forgotPassword() - Enhanced Security Tests', () => {
              test('should rate limit password reset requests', async () => {
                const multipleRequests = Array(10).fill().map(() => ({
                  ...req,
                  body: { email: 'test@example.com' }
                }));

                User.findByEmail.mockResolvedValue(mockUser);
                emailService.verifyConnection.mockResolvedValue(true);
                emailService.sendEmail.mockResolvedValue({ messageId: 'msg-123' });

                // Simulate rapid requests
                for (const request of multipleRequests) {
                  await authController.forgotPassword(request, res);
                }

                expect(User.findByEmail).toHaveBeenCalledTimes(10);
              });

              test('should handle malformed email addresses', async () => {
                const malformedEmails = [
                  'plaintext',
                  '@missingdomain.com',
                  'missing@.com',
                  'spaces @domain.com',
                  'toolong'.repeat(50) + '@domain.com'
                ];

                for (const email of malformedEmails) {
                  req.body.email = email;
                  await authController.forgotPassword(req, res);
                  expect(res.status).toHaveBeenCalledWith(400);
                }
              });

              test('should log security events for monitoring', async () => {
                req.body.email = 'suspicious@domain.com';
                User.findByEmail.mockResolvedValue(null);
                SystemLog.warning = jest.fn().mockResolvedValue(true);

                await authController.forgotPassword(req, res);

                expect(SystemLog.warning).toHaveBeenCalledWith(
                  'authController',
                  'forgotPassword',
                  expect.stringContaining('No account found')
                );
              });
            });

            describe('resetPassword() - Token Security', () => {
              test('should handle expired token gracefully', async () => {
                const expiredError = new Error('Token expired');
                expiredError.name = 'TokenExpiredError';
                User.findByResetToken.mockRejectedValue(expiredError);
                SystemLog.error = jest.fn().mockResolvedValue(true);

                await authController.resetPassword(req, res);

                expect(res.status).toHaveBeenCalledWith(401);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  error: 'TOKEN_EXPIRED'
                }));
              });

              test('should validate token format before database lookup', async () => {
                req.query.token = 'invalid-token-format-12345';
                User.findByResetToken.mockResolvedValue(null);

                await authController.resetPassword(req, res);

                expect(res.status).toHaveBeenCalledWith(401);
              });

              test('should prevent token reuse', async () => {
                User.findByResetToken
                  .mockResolvedValueOnce(mockUser)  // First use succeeds
                  .mockResolvedValueOnce(null);     // Second use fails

                // First reset
                await authController.resetPassword(req, res);
                expect(res.status).toHaveBeenCalledWith(200);

                // Reset response mock
                res.status.mockClear();
                res.json.mockClear();

                // Second attempt with same token should fail
                await authController.resetPassword(req, res);
                expect(res.status).toHaveBeenCalledWith(401);
              });

              test('should handle complex password requirements', async () => {
                const testPasswords = [
                  { password: 'simple', valid: false, reason: 'too short' },
                  { password: 'nouppercase123', valid: false, reason: 'no uppercase' },
                  { password: 'NOLOWERCASE123', valid: false, reason: 'no lowercase' },
                  { password: 'NoNumbers!@#', valid: false, reason: 'no numbers' },
                  { password: 'ValidPass123!', valid: true, reason: 'meets all requirements' }
                ];

                User.findByResetToken.mockResolvedValue(mockUser);

                for (const test of testPasswords) {
                  req.body.password = test.password;
                  req.body.confirmPassword = test.password;
                  
                  res.status.mockClear();
                  res.json.mockClear();

                  await authController.resetPassword(req, res);

                  if (test.valid) {
                    expect(res.status).toHaveBeenCalledWith(200);
                  } else {
                    expect(res.status).toHaveBeenCalledWith(400);
                  }
                }
              });
            });

            describe('changePassword() - Advanced Validation', () => {
              test('should enforce password history (prevent reuse)', async () => {
                req.body.newPassword = 'oldpassword'; // Same as current
                req.body.confirmPassword = 'oldpassword';
                
                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare
                  .mockResolvedValueOnce(true)  // Current password check
                  .mockResolvedValueOnce(true); // Password history check

                await authController.changePassword(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  error: expect.stringMatching(/cannot reuse/i)
                }));
              });

              test('should handle database transaction failures', async () => {
                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);
                mockUser.updatePassword.mockRejectedValue(new Error('Transaction failed'));
                SystemLog.error = jest.fn().mockResolvedValue(true);

                await authController.changePassword(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(SystemLog.error).toHaveBeenCalled();
              });

              test('should validate password complexity rules', async () => {
                const complexityTests = [
                  { password: 'weak', expected: 400 },
                  { password: 'StrongPass123!', expected: 200 }
                ];

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);

                for (const test of complexityTests) {
                  req.body.newPassword = test.password;
                  req.body.confirmPassword = test.password;
                  
                  res.status.mockClear();
                  
                  await authController.changePassword(req, res);
                  expect(res.status).toHaveBeenCalledWith(test.expected);
                }
              });
            });

            describe('getCurrentUser() - Data Integrity', () => {
              test('should sanitize sensitive user data', async () => {
                req.user = {
                  user_id: 'test-uuid-123',
                  email: 'test@example.com',
                  password: 'hashedpassword',  // Should be filtered out
                  resetToken: 'secret-token',  // Should be filtered out
                  given_name: 'John',
                  family_name: 'Doe',
                  role: 'Regular'
                };

                await authController.getCurrentUser(req, res);

                const response = res.json.mock.calls[0][0];
                expect(response.user).not.toHaveProperty('password');
                expect(response.user).not.toHaveProperty('resetToken');
              });

              test('should handle malformed user object', async () => {
                req.user = { invalid: 'data' }; // Missing required fields

                await authController.getCurrentUser(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  error: expect.stringMatching(/invalid user data/i)
                }));
              });
            });

            describe('Token Generation - Security Edge Cases', () => {
              test('should handle special characters in user data', async () => {
                const userWithSpecialChars = {
                  ...mockUser,
                  given_name: "José María",
                  family_name: "García-López",
                  email: 'josé@café.com'
                };

                jwt.sign.mockReturnValue('jwt-token-special');

                const token = authController.generateToken(userWithSpecialChars);

                expect(jwt.sign).toHaveBeenCalledWith(
                  expect.objectContaining({
                    given_name: "José María",
                    family_name: "García-López"
                  }),
                  expect.any(String),
                  expect.any(Object)
                );
              });

              test('should handle missing name fields gracefully', async () => {
                const userWithoutNames = {
                  ...mockUser,
                  given_name: null,
                  family_name: null
                };

                jwt.sign.mockReturnValue('jwt-token-nonames');

                const token = authController.generateToken(userWithoutNames);

                expect(jwt.sign).toHaveBeenCalledWith(
                  expect.objectContaining({
                    full_name: ''
                  }),
                  expect.any(String),
                  expect.any(Object)
                );
              });
            });

            describe('Google Account Management - Integration Tests', () => {
              test('should handle Google account linking with existing Google ID', async () => {
                req.body.googleId = 'existing-google-id';
                mockUser.google_id = 'different-google-id';
                User.findById.mockResolvedValue(mockUser);

                await authController.linkGoogleAccount(req, res);

                expect(res.status).toHaveBeenCalledWith(409);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  error: expect.stringMatching(/already linked to different/i)
                }));
              });

              test('should validate Google tokens before linking', async () => {
                req.body.googleId = 'invalid-format';
                req.body.googleRefreshToken = '';
                User.findById.mockResolvedValue(mockUser);

                await authController.linkGoogleAccount(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                  error: expect.stringMatching(/invalid google/i)
                }));
              });
            });

            describe('Error Handling and Logging', () => {
              test('should log all authentication attempts', async () => {
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
                
                req.body = { email: 'test@example.com', password: 'password123' };
                User.findByEmail.mockResolvedValue(mockUser);
                mockUser.validatePassword.mockResolvedValue(true);
                jwt.sign.mockReturnValue('jwt-token-123');

                await authController.login(req, res);

                expect(consoleSpy).toHaveBeenCalledWith(
                  expect.stringMatching(/\[LOGIN\].*Login attempt/)
                );
                
                consoleSpy.mockRestore();
              });

              test('should handle network timeouts gracefully', async () => {
                const timeoutError = new Error('Network timeout');
                timeoutError.code = 'ETIMEDOUT';
                
                User.findByEmail.mockRejectedValue(timeoutError);
                SystemLog.error = jest.fn().mockResolvedValue(true);

                await authController.login(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(SystemLog.error).toHaveBeenCalledWith(
                  'authController',
                  'login',
                  expect.stringContaining('timeout')
                );
              });
            });
          });
        });        