import axiosClient from './axiosClient';

import settingsApi, {
 getUserSettings,
updateUserSettings,
updateSettingCategory,
getWidgetSettings,
updateWidgetSettings,
resetWidgetSettings,
getNotificationSettings,
updateNotificationSettings,
getPrivacySettings,
updatePrivacySettings,
getAppearanceSettings,
updateAppearanceSettings,
} from './settingsApi';

// Mock axiosClient
jest.mock('./axiosClient');
const mockedAxiosClient = axiosClient;

describe('settingsApi', () => {
beforeEach(() => {
    jest.clearAllMocks();
});

describe('General settings', () => {
    it('should get user settings', async () => {
        const mockSettings = { theme: 'dark', language: 'en' };
        mockedAxiosClient.get.mockResolvedValue({ data: mockSettings });

        const result = await settingsApi.getUserSettings();

        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings');
        expect(result.data).toEqual(mockSettings);
    });

    it('should update user settings', async () => {
        const settings = { theme: 'light', language: 'es' };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await settingsApi.updateUserSettings(settings);

        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings', settings);
        expect(result.data).toEqual(mockResponse.data);
    });

    it('should update setting category', async () => {
        const category = 'appearance';
        const settings = { theme: 'dark' };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.patch.mockResolvedValue(mockResponse);

        const result = await settingsApi.updateSettingCategory(category, settings);

        expect(mockedAxiosClient.patch).toHaveBeenCalledWith(`/api/settings/${category}`, settings);
        expect(result.data).toEqual(mockResponse.data);
    });
});

describe('Widget settings', () => {
    it('should get widget settings', async () => {
        const mockWidgetSettings = { widgets: ['temperature', 'humidity'] };
        mockedAxiosClient.get.mockResolvedValue({ data: mockWidgetSettings });

        const result = await settingsApi.getWidgetSettings();

        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings/widgets');
        expect(result.data).toEqual(mockWidgetSettings);
    });

    it('should update widget settings', async () => {
        const widgetSettings = { widgets: ['temperature', 'light'] };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await settingsApi.updateWidgetSettings(widgetSettings);

        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings/widgets', widgetSettings);
        expect(result.data).toEqual(mockResponse.data);
    });

    it('should reset widget settings', async () => {
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await settingsApi.resetWidgetSettings();

        expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/settings/widgets/reset');
        expect(result.data).toEqual(mockResponse.data);
    });
});

describe('Notification settings', () => {
    it('should get notification settings', async () => {
        const mockNotificationSettings = { email: true, push: false };
        mockedAxiosClient.get.mockResolvedValue({ data: mockNotificationSettings });

        const result = await settingsApi.getNotificationSettings();

        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings/notifications');
        expect(result.data).toEqual(mockNotificationSettings);
    });

    it('should update notification settings', async () => {
        const notificationSettings = { email: false, push: true };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await settingsApi.updateNotificationSettings(notificationSettings);

        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings/notifications', notificationSettings);
        expect(result.data).toEqual(mockResponse.data);
    });
});

describe('Privacy settings', () => {
    it('should get privacy settings', async () => {
        const mockPrivacySettings = { shareData: false, analytics: true };
        mockedAxiosClient.get.mockResolvedValue({ data: mockPrivacySettings });

        const result = await settingsApi.getPrivacySettings();

        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings/privacy');
        expect(result.data).toEqual(mockPrivacySettings);
    });

    it('should update privacy settings', async () => {
        const privacySettings = { shareData: true, analytics: false };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await settingsApi.updatePrivacySettings(privacySettings);

        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings/privacy', privacySettings);
        expect(result.data).toEqual(mockResponse.data);
    });
});

describe('Appearance settings', () => {
    it('should get appearance settings', async () => {
        const mockAppearanceSettings = { theme: 'dark', fontSize: 'medium' };
        mockedAxiosClient.get.mockResolvedValue({ data: mockAppearanceSettings });

        const result = await settingsApi.getAppearanceSettings();

        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings/appearance');
        expect(result.data).toEqual(mockAppearanceSettings);
    });

    it('should update appearance settings', async () => {
        const appearanceSettings = { theme: 'light', fontSize: 'large' };
        const mockResponse = { data: { success: true } };
        mockedAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await settingsApi.updateAppearanceSettings(appearanceSettings);

        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings/appearance', appearanceSettings);
        expect(result.data).toEqual(mockResponse.data);
    });
});

describe('Individual exports', () => {
    it('should export individual functions that work correctly', async () => {
        const mockSettings = { theme: 'dark' };
        mockedAxiosClient.get.mockResolvedValue({ data: mockSettings });

        await getUserSettings();
        expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/settings');

        const settings = { theme: 'light' };
        mockedAxiosClient.put.mockResolvedValue({ data: { success: true } });

        await updateUserSettings(settings);
        expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/settings', settings);
    });
});

describe('Error handling', () => {
    it('should handle API errors', async () => {
        const error = new Error('Network error');
        mockedAxiosClient.get.mockRejectedValue(error);

        await expect(settingsApi.getUserSettings()).rejects.toThrow('Network error');
    });

    it('should handle API errors for update operations', async () => {
        const error = new Error('Server error');
        mockedAxiosClient.put.mockRejectedValue(error);

        await expect(settingsApi.updateUserSettings({})).rejects.toThrow('Server error');
    });
});
});