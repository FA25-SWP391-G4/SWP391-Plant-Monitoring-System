import authApi from './authApi';
import axiosClient from './axiosClient';

// Mock the axiosClient
jest.mock('./axiosClient');

describe('authApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should call axiosClient.post with correct parameters', async () => {
            const mockResponse = { data: { user: { id: 1 } } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.register(
                'test@example.com',
                'password123',
                'password123',
                'John',
                'Doe',
                '1234567890',
                true
            );

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/register', {
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                given_name: 'John',
                family_name: 'Doe',
                phoneNumber: '1234567890',
                newsletter: true
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('login', () => {
        it('should call axiosClient.post with email and password', async () => {
            const mockResponse = { data: { token: 'jwt-token' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.login('test@example.com', 'password123');

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('loginWithGoogle', () => {
        it('should call axiosClient.post with credential token', async () => {
            const mockResponse = { data: { token: 'jwt-token' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.loginWithGoogle('google-credential-token');

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/google-login', {
                credential: 'google-credential-token'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('logout', () => {
        it('should call axiosClient.post with logout endpoint', async () => {
            const mockResponse = { data: { message: 'Logged out successfully' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.logout();

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/logout');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('changePassword', () => {
        it('should call axiosClient.put with password change payload', async () => {
            const mockResponse = { data: { message: 'Password changed' } };
            const payload = { currentPassword: 'old123', newPassword: 'new123' };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await authApi.changePassword(payload);

            expect(axiosClient.put).toHaveBeenCalledWith('/auth/change-password', payload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('forgotPassword', () => {
        it('should call axiosClient.post with email', async () => {
            const mockResponse = { data: { message: 'Reset email sent' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.forgotPassword('test@example.com');

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
                email: 'test@example.com'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('resetPassword', () => {
        it('should call axiosClient.post with token and new password', async () => {
            const mockResponse = { data: { message: 'Password reset successful' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.resetPassword('reset-token', 'newPassword123');

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/reset-password', {
                token: 'reset-token',
                newPassword: 'newPassword123'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getCurrentUser', () => {
        it('should call axiosClient.get to fetch current user', async () => {
            const mockResponse = { data: { user: { id: 1, email: 'test@example.com' } } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await authApi.getCurrentUser();

            expect(axiosClient.get).toHaveBeenCalledWith('/auth/me');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateProfile', () => {
        it('should call axiosClient.put with profile data', async () => {
            const mockResponse = { data: { user: { id: 1, given_name: 'Jane' } } };
            const profileData = { given_name: 'Jane', family_name: 'Smith' };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await authApi.updateProfile(profileData);

            expect(axiosClient.put).toHaveBeenCalledWith('/auth/profile', profileData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('verifyEmail', () => {
        it('should call axiosClient.get with verification token', async () => {
            const mockResponse = { data: { message: 'Email verified' } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await authApi.verifyEmail('verify-token');

            expect(axiosClient.get).toHaveBeenCalledWith('/auth/verify-email/verify-token');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('resendVerification', () => {
        it('should call axiosClient.post to resend verification email', async () => {
            const mockResponse = { data: { message: 'Verification email sent' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.resendVerification();

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/resend-verification');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('refreshToken', () => {
        it('should call axiosClient.post to refresh JWT token', async () => {
            const mockResponse = { data: { token: 'new-jwt-token' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await authApi.refreshToken();

            expect(axiosClient.post).toHaveBeenCalledWith('/auth/refresh-token');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('error handling', () => {
        it('should propagate errors from axiosClient', async () => {
            const mockError = new Error('Network error');
            axiosClient.post.mockRejectedValue(mockError);

            await expect(authApi.login('test@example.com', 'password')).rejects.toThrow('Network error');
        });
    });
});