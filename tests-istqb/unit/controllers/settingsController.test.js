const settingsController = require('./settingsController');
const User = require('../models/User');
const { isValidUUID } = require('../utils/uuidGenerator');

/**
 * ============================================================================
 * SETTINGS CONTROLLER TESTS
 * ============================================================================
 */


// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/uuidGenerator');


describe('Settings Controller', () => {
    let req, res;

    const mockUserId = 'test-user-id-123';
    const mockUser = {
        user_id: mockUserId,
        settings: JSON.stringify({
            appearance: {
                theme: 'dark',
                fontSize: 'large',
                colorScheme: 'green'
            },
            widgets: {
                showPlantOverview: false,
                showSensorData: true
            }
        })
    };

    beforeEach(() => {
        req = {
            user: { user_id: mockUserId },
            body: {},
            params: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        
        // Reset mocks
        jest.clearAllMocks();
        isValidUUID.mockReturnValue(true);
    });

    describe('getUserSettings', () => {
        it('should return stored user settings', async () => {
            User.findById.mockResolvedValue(mockUser);

            await settingsController.getUserSettings(req, res);

            expect(User.findById).toHaveBeenCalledWith(mockUserId);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: JSON.parse(mockUser.settings)
            });
        });

        it('should return default settings when user has no settings', async () => {
            User.findById.mockResolvedValue({ user_id: mockUserId, settings: null });

            await settingsController.getUserSettings(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        appearance: expect.any(Object),
                        language: expect.any(Object),
                        notifications: expect.any(Object),
                        privacy: expect.any(Object),
                        widgets: expect.any(Object)
                    })
                })
            );
        });

        it('should return 400 for invalid user ID', async () => {
            isValidUUID.mockReturnValue(false);

            await settingsController.getUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid user ID format'
            });
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            await settingsController.getUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });

        it('should handle database errors', async () => {
            User.findById.mockRejectedValue(new Error('Database error'));

            await settingsController.getUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to fetch settings'
            });
        });
    });

    describe('updateUserSettings', () => {
        const newSettings = {
            appearance: { theme: 'light' },
            widgets: { showPlantOverview: true }
        };

        it('should update user settings successfully', async () => {
            req.body = newSettings;
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updateUserSettings(req, res);

            expect(User.updateUserSettings).toHaveBeenCalledWith(
                mockUserId,
                JSON.stringify(newSettings)
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Settings updated successfully',
                data: newSettings
            });
        });

        it('should return 400 for invalid user ID', async () => {
            isValidUUID.mockReturnValue(false);

            await settingsController.updateUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid user ID format'
            });
        });

        it('should return 400 for invalid settings format', async () => {
            req.body = null;

            await settingsController.updateUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid settings format'
            });
        });

        it('should return 500 when update fails', async () => {
            req.body = newSettings;
            User.updateUserSettings.mockResolvedValue(false);

            await settingsController.updateUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to update settings'
            });
        });

        it('should handle database errors', async () => {
            req.body = newSettings;
            User.updateUserSettings.mockRejectedValue(new Error('Database error'));

            await settingsController.updateUserSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to update settings'
            });
        });
    });

    describe('updateSettingCategory', () => {
        const categorySettings = { theme: 'dark', fontSize: 'large' };

        beforeEach(() => {
            req.params.category = 'appearance';
            req.body = categorySettings;
        });

        it('should update specific category successfully', async () => {
            User.findByUserId.mockResolvedValue(mockUser);
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updateSettingCategory(req, res);

            expect(User.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(User.updateUserSettings).toHaveBeenCalledWith(
                mockUserId,
                expect.stringContaining('"appearance"')
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'appearance settings updated successfully'
                })
            );
        });

        it('should return 400 for invalid category', async () => {
            req.params.category = 'invalid';

            await settingsController.updateSettingCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid settings category'
            });
        });

        it('should return 404 when user not found', async () => {
            User.findByUserId.mockResolvedValue(null);

            await settingsController.updateSettingCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });
    });

    describe('getWidgetSettings', () => {
        it('should return widget settings successfully', async () => {
            User.findByUserId.mockResolvedValue(mockUser);

            await settingsController.getWidgetSettings(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    showPlantOverview: false,
                    showSensorData: true
                })
            });
        });

        it('should return default widget settings when user has no settings', async () => {
            User.findByUserId.mockResolvedValue({ user_id: mockUserId, settings: null });

            await settingsController.getWidgetSettings(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    showPlantOverview: true,
                    showSensorData: true,
                    showAIInsights: true
                })
            });
        });

        it('should return 404 when user not found', async () => {
            User.findByUserId.mockResolvedValue(null);

            await settingsController.getWidgetSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });
    });

    describe('updateWidgetSettings', () => {
        const widgetSettings = { showPlantOverview: true, compactMode: true };

        it('should update widget settings successfully', async () => {
            req.body = widgetSettings;
            User.findByUserId.mockResolvedValue(mockUser);
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updateWidgetSettings(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Widget settings updated successfully',
                data: expect.objectContaining(widgetSettings)
            });
        });

        it('should return 500 when update fails', async () => {
            req.body = widgetSettings;
            User.findByUserId.mockResolvedValue(mockUser);
            User.updateUserSettings.mockResolvedValue(false);

            await settingsController.updateWidgetSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to update widget settings'
            });
        });
    });

    describe('resetWidgetSettings', () => {
        it('should reset widget settings to defaults', async () => {
            User.findByUserId.mockResolvedValue(mockUser);
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.resetWidgetSettings(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Widget settings reset to defaults',
                data: expect.objectContaining({
                    showPlantOverview: true,
                    showSensorData: true,
                    enableAIFeatures: false
                })
            });
        });

        it('should return 500 when reset fails', async () => {
            User.findByUserId.mockResolvedValue(mockUser);
            User.updateUserSettings.mockResolvedValue(false);

            await settingsController.resetWidgetSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to reset widget settings'
            });
        });
    });

    describe('Category-specific functions', () => {
        beforeEach(() => {
            User.findByUserId.mockResolvedValue(mockUser);
        });

        it('should get notification settings', async () => {
            await settingsController.getNotificationSettings(req, res);
            
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
        });

        it('should update notification settings', async () => {
            req.body = { email: false, push: true };
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updateNotificationSettings(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'notifications settings updated successfully'
                })
            );
        });

        it('should get privacy settings', async () => {
            await settingsController.getPrivacySettings(req, res);
            
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
        });

        it('should update privacy settings', async () => {
            req.body = { shareData: true };
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updatePrivacySettings(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'privacy settings updated successfully'
                })
            );
        });

        it('should get appearance settings', async () => {
            await settingsController.getAppearanceSettings(req, res);
            
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object)
                })
            );
        });

        it('should update appearance settings', async () => {
            req.body = { theme: 'light' };
            User.updateUserSettings.mockResolvedValue(true);

            await settingsController.updateAppearanceSettings(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'appearance settings updated successfully'
                })
            );
        });
    });

    describe('Error handling', () => {
        it('should handle JSON parse errors gracefully', async () => {
            const userWithInvalidSettings = {
                user_id: mockUserId,
                settings: 'invalid-json'
            };
            User.findByUserId.mockResolvedValue(userWithInvalidSettings);

            await settingsController.getWidgetSettings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to fetch widget settings'
            });
        });

        it('should handle invalid UUID consistently across all functions', async () => {
            isValidUUID.mockReturnValue(false);

            await settingsController.getWidgetSettings(req, res);
            await settingsController.updateWidgetSettings(req, res);
            await settingsController.resetWidgetSettings(req, res);

            expect(res.status).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});