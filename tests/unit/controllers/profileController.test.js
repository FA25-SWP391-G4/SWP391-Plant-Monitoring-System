/**
 * PROFILE CONTROLLER TESTS
 * =========================
 * 
 * Comprehensive unit tests for user profile controller
 * Covers profile viewing, editing, preferences, and account settings
 */

const profileController = require('../../../controllers/profileController');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const emailService = require('../../../services/emailService');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');
jest.mock('../../../services/emailService');
jest.mock('bcrypt');

describe('Profile Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'Regular'
            },
            body: {},
            params: {},
            files: null,
            ip: '127.0.0.1'
        };

        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    // UC7: View Profile
    describe('View Profile (UC7)', () => {
        describe('getProfile', () => {
            it('should get user profile successfully', async () => {
                const mockProfile = {
                    id: 'user-123',
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'Regular',
                    avatar: 'profile.jpg',
                    preferences: {
                        language: 'en',
                        theme: 'light',
                        notifications: true
                    },
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date('2024-01-15')
                };

                User.findById.mockResolvedValue(mockProfile);

                await profileController.getProfile(mockReq, mockRes);

                expect(User.findById).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    profile: expect.objectContaining({
                        id: 'user-123',
                        email: 'test@example.com',
                        firstName: 'John'
                    })
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    profile: expect.not.objectContaining({
                        password: expect.anything()
                    })
                });
            });

            it('should handle user not found', async () => {
                User.findById.mockResolvedValue(null);

                await profileController.getProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'User profile not found'
                });
            });

            it('should handle database errors', async () => {
                User.findById.mockRejectedValue(new Error('Database connection failed'));

                await profileController.getProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Failed to retrieve profile'
                });
            });
        });

        describe('getProfileStats', () => {
            it('should get user profile statistics', async () => {
                const mockStats = {
                    totalPlants: 5,
                    plantsHealthy: 3,
                    plantsNeedAttention: 2,
                    totalWaterings: 45,
                    averageMoisture: 72,
                    accountAge: 30, // days
                    lastActivity: new Date('2024-01-15T10:00:00Z')
                };

                User.getProfileStats.mockResolvedValue(mockStats);

                await profileController.getProfileStats(mockReq, mockRes);

                expect(User.getProfileStats).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    stats: mockStats
                });
            });
        });
    });

    // UC8: Edit Profile
    describe('Edit Profile (UC8)', () => {
        describe('updateProfile', () => {
            it('should update basic profile information successfully', async () => {
                mockReq.body = {
                    firstName: 'John Updated',
                    lastName: 'Doe Updated',
                    phoneNumber: '+1234567890'
                };

                const mockUpdatedProfile = {
                    id: 'user-123',
                    email: 'test@example.com',
                    firstName: 'John Updated',
                    lastName: 'Doe Updated',
                    phoneNumber: '+1234567890',
                    updated_at: new Date()
                };

                User.updateProfile.mockResolvedValue(mockUpdatedProfile);
                SystemLog.log.mockResolvedValue();

                await profileController.updateProfile(mockReq, mockRes);

                expect(User.updateProfile).toHaveBeenCalledWith('user-123', {
                    firstName: 'John Updated',
                    lastName: 'Doe Updated',
                    phoneNumber: '+1234567890'
                });
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'user',
                    'profile_updated',
                    expect.stringContaining('profile updated'),
                    'user-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Profile updated successfully',
                    profile: mockUpdatedProfile
                });
            });

            it('should validate required fields', async () => {
                mockReq.body = {
                    firstName: '',
                    lastName: 'Doe'
                };

                await profileController.updateProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'First name is required'
                });
                expect(User.updateProfile).not.toHaveBeenCalled();
            });

            it('should validate email format when updating email', async () => {
                mockReq.body = {
                    email: 'invalid-email-format'
                };

                await profileController.updateProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid email format'
                });
            });

            it('should prevent email duplication', async () => {
                mockReq.body = {
                    email: 'existing@example.com'
                };

                User.findByEmail.mockResolvedValue({ id: 'other-user' });

                await profileController.updateProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email already in use'
                });
            });

            it('should handle phone number validation', async () => {
                mockReq.body = {
                    phoneNumber: '123'
                };

                await profileController.updateProfile(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid phone number format'
                });
            });
        });

        describe('updateAvatar', () => {
            it('should update user avatar successfully', async () => {
                mockReq.files = {
                    avatar: {
                        name: 'profile.jpg',
                        data: Buffer.from('fake image data'),
                        mimetype: 'image/jpeg'
                    }
                };

                const mockUpdatedUser = {
                    id: 'user-123',
                    avatar: 'avatars/user-123-profile.jpg'
                };

                User.updateAvatar.mockResolvedValue(mockUpdatedUser);

                await profileController.updateAvatar(mockReq, mockRes);

                expect(User.updateAvatar).toHaveBeenCalledWith('user-123', expect.any(String));
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Avatar updated successfully',
                    avatar: 'avatars/user-123-profile.jpg'
                });
            });

            it('should validate image file type', async () => {
                mockReq.files = {
                    avatar: {
                        name: 'document.pdf',
                        data: Buffer.from('fake pdf data'),
                        mimetype: 'application/pdf'
                    }
                };

                await profileController.updateAvatar(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Only image files are allowed'
                });
            });

            it('should validate file size', async () => {
                mockReq.files = {
                    avatar: {
                        name: 'huge-image.jpg',
                        data: Buffer.alloc(10 * 1024 * 1024), // 10MB
                        mimetype: 'image/jpeg'
                    }
                };

                await profileController.updateAvatar(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'File size too large. Maximum 5MB allowed'
                });
            });

            it('should handle missing file', async () => {
                mockReq.files = null;

                await profileController.updateAvatar(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'No avatar file provided'
                });
            });
        });
    });

    // User Preferences
    describe('User Preferences', () => {
        describe('updatePreferences', () => {
            it('should update user preferences successfully', async () => {
                mockReq.body = {
                    language: 'es',
                    theme: 'dark',
                    notifications: false,
                    timezone: 'UTC-8'
                };

                const mockUpdatedPrefs = {
                    language: 'es',
                    theme: 'dark',
                    notifications: false,
                    timezone: 'UTC-8'
                };

                User.updatePreferences.mockResolvedValue(mockUpdatedPrefs);

                await profileController.updatePreferences(mockReq, mockRes);

                expect(User.updatePreferences).toHaveBeenCalledWith('user-123', mockReq.body);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Preferences updated successfully',
                    preferences: mockUpdatedPrefs
                });
            });

            it('should validate language preference', async () => {
                mockReq.body = {
                    language: 'invalid-lang'
                };

                await profileController.updatePreferences(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid language code'
                });
            });

            it('should validate theme preference', async () => {
                mockReq.body = {
                    theme: 'rainbow'
                };

                await profileController.updatePreferences(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid theme. Must be light or dark'
                });
            });
        });

        describe('getNotificationSettings', () => {
            it('should get user notification preferences', async () => {
                const mockNotificationSettings = {
                    email: {
                        plantAlerts: true,
                        systemUpdates: false,
                        weeklyReports: true
                    },
                    push: {
                        plantAlerts: true,
                        deviceOffline: true,
                        lowBattery: false
                    }
                };

                User.getNotificationSettings.mockResolvedValue(mockNotificationSettings);

                await profileController.getNotificationSettings(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    notifications: mockNotificationSettings
                });
            });
        });

        describe('updateNotificationSettings', () => {
            it('should update notification settings', async () => {
                mockReq.body = {
                    email: {
                        plantAlerts: false,
                        systemUpdates: true,
                        weeklyReports: false
                    }
                };

                User.updateNotificationSettings.mockResolvedValue();

                await profileController.updateNotificationSettings(mockReq, mockRes);

                expect(User.updateNotificationSettings).toHaveBeenCalledWith('user-123', mockReq.body);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Notification settings updated successfully'
                });
            });
        });
    });

    // Account Security
    describe('Account Security', () => {
        describe('updateEmail', () => {
            it('should initiate email change process', async () => {
                mockReq.body = {
                    newEmail: 'newemail@example.com',
                    password: 'currentpassword'
                };

                const mockUser = {
                    id: 'user-123',
                    password: 'hashedpassword'
                };

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);
                User.findByEmail.mockResolvedValue(null); // Email not taken
                User.generateEmailChangeToken.mockResolvedValue('change-token-123');
                emailService.sendEmailChangeVerification.mockResolvedValue();

                await profileController.updateEmail(mockReq, mockRes);

                expect(bcrypt.compare).toHaveBeenCalledWith('currentpassword', 'hashedpassword');
                expect(emailService.sendEmailChangeVerification).toHaveBeenCalledWith(
                    'test@example.com',
                    'newemail@example.com',
                    'change-token-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Email verification sent to new address'
                });
            });

            it('should require password verification', async () => {
                mockReq.body = {
                    newEmail: 'newemail@example.com',
                    password: 'wrongpassword'
                };

                const mockUser = {
                    id: 'user-123',
                    password: 'hashedpassword'
                };

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(false);

                await profileController.updateEmail(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Current password is incorrect'
                });
            });
        });

        describe('verifyEmailChange', () => {
            it('should complete email change with valid token', async () => {
                mockReq.body = {
                    token: 'valid-change-token'
                };

                const mockTokenData = {
                    userId: 'user-123',
                    newEmail: 'newemail@example.com',
                    expires: new Date(Date.now() + 3600000)
                };

                User.validateEmailChangeToken.mockResolvedValue(mockTokenData);
                User.updateEmail.mockResolvedValue();
                User.clearEmailChangeToken.mockResolvedValue();

                await profileController.verifyEmailChange(mockReq, mockRes);

                expect(User.updateEmail).toHaveBeenCalledWith('user-123', 'newemail@example.com');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Email updated successfully'
                });
            });

            it('should reject invalid or expired tokens', async () => {
                mockReq.body = {
                    token: 'invalid-token'
                };

                User.validateEmailChangeToken.mockResolvedValue(null);

                await profileController.verifyEmailChange(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid or expired verification token'
                });
            });
        });

        describe('deleteAccount', () => {
            it('should require password confirmation for account deletion', async () => {
                mockReq.body = {
                    password: 'correctpassword',
                    confirmation: 'DELETE'
                };

                const mockUser = {
                    id: 'user-123',
                    password: 'hashedpassword'
                };

                User.findById.mockResolvedValue(mockUser);
                bcrypt.compare.mockResolvedValue(true);
                User.deleteAccount.mockResolvedValue();
                emailService.sendAccountDeletionConfirmation.mockResolvedValue();

                await profileController.deleteAccount(mockReq, mockRes);

                expect(User.deleteAccount).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Account deleted successfully'
                });
            });

            it('should require confirmation text', async () => {
                mockReq.body = {
                    password: 'correctpassword',
                    confirmation: 'wrong'
                };

                await profileController.deleteAccount(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Please type DELETE to confirm account deletion'
                });
            });
        });
    });

    // Error handling
    describe('Error Handling', () => {
        it('should handle unauthenticated requests', async () => {
            mockReq.user = null;

            await profileController.getProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'User authentication required'
            });
        });

        it('should handle file upload errors', async () => {
            mockReq.files = {
                avatar: {
                    name: 'corrupted.jpg',
                    data: null,
                    mimetype: 'image/jpeg'
                }
            };

            await profileController.updateAvatar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'File upload failed'
            });
        });

        it('should handle concurrent profile updates', async () => {
            mockReq.body = {
                firstName: 'Updated Name'
            };

            User.updateProfile.mockRejectedValue(new Error('Concurrent update detected'));

            await profileController.updateProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Profile was updated by another session. Please refresh and try again'
            });
        });
    });
});