// src/tests/api-mapping.test.js
import authApi from '../api/authApi';
import axiosClient from '../api/axiosClient';

// Mock axiosClient
jest.mock('../api/axiosClient', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} })
    }
  };
});

// Helper function to check API path consistency
const checkApiMapping = (frontendFunction, expectedBackendPath, requestData, httpMethod = 'post') => {
  // Setup axiosClient mock response
  axiosClient[httpMethod].mockResolvedValue({ data: { success: true } });
  
  // Call the frontend API function
  return frontendFunction(requestData)
    .then(response => {
      // Special case for logout which doesn't send a request body
      if (expectedBackendPath === '/auth/logout' && !requestData) {
        expect(axiosClient[httpMethod]).toHaveBeenCalledWith(expectedBackendPath);
      } else {
        // Verify axiosClient was called with the expected path
        expect(axiosClient[httpMethod]).toHaveBeenCalledWith(
          expectedBackendPath,
          expect.anything()
        );
      }
      return response;
    });
};

describe('API Mapping Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Authentication API Mapping', () => {
    test('register() maps to POST /auth/register', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'Test User'
      };
      
      return checkApiMapping(
        () => authApi.register(
          userData.email, 
          userData.password, 
          userData.confirmPassword,
          userData.full_name
        ),
        '/auth/register',
        userData
      );
    });
    
    test('login() maps to POST /auth/login', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      return checkApiMapping(
        () => authApi.login(credentials.email, credentials.password),
        '/auth/login',
        credentials
      );
    });
    
    test('logout() maps to POST /auth/logout', () => {
      return checkApiMapping(
        () => authApi.logout(),
        '/auth/logout',
        null
      );
    });
    
    test('changePassword() maps to PUT /auth/change-password', () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };
      
      return checkApiMapping(
        () => authApi.changePassword(passwordData),
        '/auth/change-password',
        passwordData,
        'put'
      );
    });
    
    test('forgotPassword() maps to POST /auth/forgot-password', () => {
      const email = 'test@example.com';
      
      return checkApiMapping(
        () => authApi.forgotPassword(email),
        '/auth/forgot-password',
        { email }
      );
    });
    
    test('resetPassword() maps to POST /auth/reset-password', () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newPassword123'
      };
      
      return checkApiMapping(
        () => authApi.resetPassword(resetData.token, resetData.newPassword),
        '/auth/reset-password',
        resetData
      );
    });
  });
});
