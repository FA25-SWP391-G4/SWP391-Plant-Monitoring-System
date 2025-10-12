/**
 * Tests for the languageController to ensure proper internationalization functionality
 */

const languageController = require('../controllers/languageController');
const User = require('../models/User');

// Mock the User model
jest.mock('../models/User');

describe('Language Controller Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableLanguages', () => {
    test('should return the list of available languages', async () => {
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await languageController.getAvailableLanguages(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          languages: expect.arrayContaining([
            expect.objectContaining({
              code: 'en',
              name: expect.any(String)
            })
          ])
        })
      );
    });
  });

  describe('getUserLanguagePreference', () => {
    test('should return the user\'s language preference', async () => {
      // Mock authenticated user
      const mockUser = {
        user_id: 1,
        language_preference: 'en'
      };

      const mockRequest = {
        userId: 1 // Assuming this would be set by authMiddleware
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findById to return our mock user
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await languageController.getUserLanguagePreference(mockRequest, mockResponse);

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        languagePreference: 'en'
      });
    });

    test('should handle user not found', async () => {
      const mockRequest = {
        userId: 999 // Non-existent user
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      await languageController.getUserLanguagePreference(mockRequest, mockResponse);

      expect(User.findById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateUserLanguagePreference', () => {
    test('should update the user\'s language preference', async () => {
      // Mock user
      const mockUser = {
        user_id: 1,
        language_preference: 'en',
        updateLanguagePreference: jest.fn().mockResolvedValue(true)
      };

      const mockRequest = {
        userId: 1,
        body: {
          languageCode: 'es'
        }
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findById
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await languageController.updateUserLanguagePreference(mockRequest, mockResponse);

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(mockUser.updateLanguagePreference).toHaveBeenCalledWith('es');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Language preference updated successfully',
        languagePreference: 'es'
      });
    });

    test('should validate language code', async () => {
      const mockRequest = {
        userId: 1,
        body: {
          languageCode: 'invalid_code'
        }
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await languageController.updateUserLanguagePreference(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid language code'
      });
    });

    test('should handle missing language code', async () => {
      const mockRequest = {
        userId: 1,
        body: {}
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await languageController.updateUserLanguagePreference(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Language code is required'
      });
    });

    test('should handle user not found', async () => {
      const mockRequest = {
        userId: 999,
        body: {
          languageCode: 'fr'
        }
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      await languageController.updateUserLanguagePreference(mockRequest, mockResponse);

      expect(User.findById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('getTranslations', () => {
    test('should return translations for the specified language', async () => {
      const mockRequest = {
        params: {
          lang: 'en'
        }
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await languageController.getTranslations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          translations: expect.any(Object)
        })
      );
    });

    test('should handle invalid language code', async () => {
      const mockRequest = {
        params: {
          lang: 'invalid_code'
        }
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await languageController.getTranslations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid language code'
      });
    });
  });
});