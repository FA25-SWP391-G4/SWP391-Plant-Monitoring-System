import userApi from './userApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient');

describe('userApi', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should get user profile successfully', async () => {
            const mockProfile = { id: 1, name: 'John Doe', email: 'john@example.com' };
            axiosClient.get.mockResolvedValue({ data: mockProfile });

            const result = await userApi.getProfile();

            expect(axiosClient.get).toHaveBeenCalledWith('/users/profile');
            expect(result).toEqual(mockProfile);
        });

        it('should throw error when get profile fails', async () => {
            const error = new Error('Network error');
            axiosClient.get.mockRejectedValue(error);

            await expect(userApi.getProfile()).rejects.toThrow('Network error');
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            const userData = { name: 'Jane Doe', email: 'jane@example.com' };
            const mockResponse = { success: true, user: userData };
            axiosClient.put.mockResolvedValue({ data: mockResponse });

            const result = await userApi.updateProfile(userData);

            expect(axiosClient.put).toHaveBeenCalledWith('/users/profile', userData);
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when update profile fails', async () => {
            const userData = { name: 'Jane Doe' };
            const error = new Error('Validation error');
            axiosClient.put.mockRejectedValue(error);

            await expect(userApi.updateProfile(userData)).rejects.toThrow('Validation error');
        });
    });

    describe('uploadProfilePicture', () => {
        it('should upload profile picture successfully', async () => {
            const formData = new FormData();
            formData.append('picture', 'file');
            const mockResponse = { success: true, pictureUrl: 'https://example.com/picture.jpg' };
            axiosClient.post.mockResolvedValue({ data: mockResponse });

            const result = await userApi.uploadProfilePicture(formData);

            expect(axiosClient.post).toHaveBeenCalledWith('/users/profile/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when upload fails', async () => {
            const formData = new FormData();
            const error = new Error('Upload failed');
            axiosClient.post.mockRejectedValue(error);

            await expect(userApi.uploadProfilePicture(formData)).rejects.toThrow('Upload failed');
        });
    });

    describe('updateSettings', () => {
        it('should update user settings successfully', async () => {
            const settings = { notifications: true, theme: 'dark' };
            const mockResponse = { success: true, settings };
            axiosClient.put.mockResolvedValue({ data: mockResponse });

            const result = await userApi.updateSettings(settings);

            expect(axiosClient.put).toHaveBeenCalledWith('/users/settings', settings);
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when update settings fails', async () => {
            const settings = { notifications: true };
            const error = new Error('Settings update failed');
            axiosClient.put.mockRejectedValue(error);

            await expect(userApi.updateSettings(settings)).rejects.toThrow('Settings update failed');
        });
    });

    describe('getPreferences', () => {
        it('should get user preferences successfully', async () => {
            const mockPreferences = { language: 'en', timezone: 'UTC' };
            axiosClient.get.mockResolvedValue({ data: mockPreferences });

            const result = await userApi.getPreferences();

            expect(axiosClient.get).toHaveBeenCalledWith('/users/preferences');
            expect(result).toEqual(mockPreferences);
        });

        it('should throw error when get preferences fails', async () => {
            const error = new Error('Preferences fetch failed');
            axiosClient.get.mockRejectedValue(error);

            await expect(userApi.getPreferences()).rejects.toThrow('Preferences fetch failed');
        });
    });

    describe('updatePreferences', () => {
        it('should update user preferences successfully', async () => {
            const preferences = { language: 'vi', timezone: 'Asia/Ho_Chi_Minh' };
            const mockResponse = { success: true, preferences };
            axiosClient.put.mockResolvedValue({ data: mockResponse });

            const result = await userApi.updatePreferences(preferences);

            expect(axiosClient.put).toHaveBeenCalledWith('/users/preferences', preferences);
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when update preferences fails', async () => {
            const preferences = { language: 'vi' };
            const error = new Error('Preferences update failed');
            axiosClient.put.mockRejectedValue(error);

            await expect(userApi.updatePreferences(preferences)).rejects.toThrow('Preferences update failed');
        });
    });

    describe('deleteAccount', () => {
        it('should delete account successfully', async () => {
            const password = 'password123';
            const mockResponse = { success: true, message: 'Account deleted' };
            axiosClient.delete.mockResolvedValue({ data: mockResponse });

            const result = await userApi.deleteAccount(password);

            expect(axiosClient.delete).toHaveBeenCalledWith('/users/account', { data: { password } });
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when delete account fails', async () => {
            const password = 'wrongpassword';
            const error = new Error('Invalid password');
            axiosClient.delete.mockRejectedValue(error);

            await expect(userApi.deleteAccount(password)).rejects.toThrow('Invalid password');
        });
    });

    describe('getUserSubscription', () => {
        it('should get user subscription successfully', async () => {
            const mockSubscription = { plan: 'premium', expiresAt: '2024-12-31' };
            axiosClient.get.mockResolvedValue({ data: mockSubscription });

            const result = await userApi.getUserSubscription();

            expect(axiosClient.get).toHaveBeenCalledWith('/users/subscription');
            expect(result).toEqual(mockSubscription);
        });

        it('should throw error when get subscription fails', async () => {
            const error = new Error('Subscription fetch failed');
            axiosClient.get.mockRejectedValue(error);

            await expect(userApi.getUserSubscription()).rejects.toThrow('Subscription fetch failed');
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel subscription successfully', async () => {
            const mockResponse = { success: true, message: 'Subscription cancelled' };
            axiosClient.post.mockResolvedValue({ data: mockResponse });

            const result = await userApi.cancelSubscription();

            expect(axiosClient.post).toHaveBeenCalledWith('/users/subscription/cancel');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when cancel subscription fails', async () => {
            const error = new Error('Cancellation failed');
            axiosClient.post.mockRejectedValue(error);

            await expect(userApi.cancelSubscription()).rejects.toThrow('Cancellation failed');
        });
    });
});