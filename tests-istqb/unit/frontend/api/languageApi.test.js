import languageApi from './languageApi';
import axiosClient from './axiosClient';

// Mock the axiosClient
jest.mock('./axiosClient');

describe('languageApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAvailableLanguages', () => {
        it('should call GET /api/language/available', async () => {
            const mockResponse = {
                data: {
                    languages: [
                        { code: 'en', name: 'English' },
                        { code: 'vi', name: 'Vietnamese' },
                        { code: 'fr', name: 'French' }
                    ]
                }
            };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await languageApi.getAvailableLanguages();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/language/available');
            expect(result).toBe(mockResponse);
        });

        it('should handle API errors', async () => {
            const mockError = new Error('Network error');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(languageApi.getAvailableLanguages()).rejects.toThrow('Network error');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/language/available');
        });
    });

    describe('getPreferences', () => {
        it('should call GET /api/language/preferences', async () => {
            const mockResponse = {
                data: {
                    language: 'en'
                }
            };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await languageApi.getPreferences();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/language/preferences');
            expect(result).toBe(mockResponse);
        });

        it('should handle API errors', async () => {
            const mockError = new Error('Unauthorized');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(languageApi.getPreferences()).rejects.toThrow('Unauthorized');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/language/preferences');
        });
    });

    describe('updatePreferences', () => {
        it('should call PUT /api/language/preferences with language data', async () => {
            const language = 'vi';
            const mockResponse = {
                data: {
                    message: 'Language preference updated',
                    language: 'vi'
                }
            };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await languageApi.updatePreferences(language);

            expect(axiosClient.put).toHaveBeenCalledWith('/api/language/preferences', { language });
            expect(result).toBe(mockResponse);
        });

        it('should handle different language codes', async () => {
            const testCases = ['en', 'fr', 'es', 'zh', 'ja', 'kr'];
            
            for (const lang of testCases) {
                axiosClient.put.mockResolvedValue({ data: { language: lang } });
                
                await languageApi.updatePreferences(lang);
                
                expect(axiosClient.put).toHaveBeenCalledWith('/api/language/preferences', { language: lang });
            }
        });

        it('should handle API errors', async () => {
            const language = 'invalid';
            const mockError = new Error('Invalid language code');
            axiosClient.put.mockRejectedValue(mockError);

            await expect(languageApi.updatePreferences(language)).rejects.toThrow('Invalid language code');
            expect(axiosClient.put).toHaveBeenCalledWith('/api/language/preferences', { language });
        });

        it('should handle empty language parameter', async () => {
            const language = '';
            const mockResponse = { data: { error: 'Language is required' } };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await languageApi.updatePreferences(language);

            expect(axiosClient.put).toHaveBeenCalledWith('/api/language/preferences', { language: '' });
            expect(result).toBe(mockResponse);
        });
    });
});