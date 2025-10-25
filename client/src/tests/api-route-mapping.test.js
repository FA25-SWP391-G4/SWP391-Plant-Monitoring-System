// src/tests/api-route-mapping.test.js
/**
 * API Route Mapping Test
 * 
 * This test file verifies that all frontend API calls map correctly to backend routes.
 * It checks that:
 * 1. Each frontend API function targets the correct backend endpoint
 * 2. The HTTP method (GET, POST, PUT, DELETE) matches between frontend and backend
 * 3. The data format sent by frontend matches what the backend expects
 */

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

describe('API Route Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Authentication API Routes', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';
    const testFullName = 'Test User';
    
    test('register() calls POST /auth/register with correct data', async () => {
      await authApi.register(testEmail, testPassword, testPassword, testFullName);
      
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/register',
        {
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
          full_name: testFullName
        }
      );
    });
    
    test('login() calls POST /auth/login with correct data', async () => {
      await authApi.login(testEmail, testPassword);
      
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: testEmail,
          password: testPassword
        }
      );
    });
    
    test('loginWithGoogle() calls POST /auth/google-login with Google data', async () => {
      const googleData = { token: 'google-oauth-token', profile: { email: testEmail } };
      await authApi.loginWithGoogle(googleData);
      
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/google-login',
        googleData
      );
    });
    
    test('logout() calls POST /auth/logout', async () => {
      await authApi.logout();
      
      expect(axiosClient.post).toHaveBeenCalledWith('/auth/logout');
    });
    
    test('changePassword() calls PUT /auth/change-password with password data', async () => {
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!'
      };
      
      await authApi.changePassword(passwordData);
      
      expect(axiosClient.put).toHaveBeenCalledWith(
        '/auth/change-password',
        passwordData
      );
    });
    
    test('forgotPassword() calls POST /auth/forgot-password with email', async () => {
      await authApi.forgotPassword(testEmail);
      
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: testEmail }
      );
    });
    
    test('resetPassword() calls POST /auth/reset-password with token and new password', async () => {
      const resetToken = 'valid-reset-token-123';
      const newPassword = 'NewSecurePass789!';
      
      await authApi.resetPassword(resetToken, newPassword);
      
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          token: resetToken,
          newPassword: newPassword
        }
      );
    });
  });
  
  // More API route tests can be added here for other API modules
});
