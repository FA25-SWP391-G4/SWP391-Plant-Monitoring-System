/**
 * User Controller Tests
 */
const { 
    getUserProfile, 
    updateUserProfile, 
    upgradeToPremiom, 
    changePassword 
} = require('../__mocks__/userController');

describe('User Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    
    beforeEach(() => {
        // Mock request and response objects
        mockRequest = {
            params: {},
            body: {},
            user: {
                id: 'user123',
                email: 'test@example.com'
            }
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });
    
    describe('UC13: Profile Management', () => {
        it('should get user profile', async () => {
            // Call the controller
            await getUserProfile(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    email: expect.any(String)
                })
            );
        });
        
        it('should update user profile', async () => {
            // Setup request body
            mockRequest.body = {
                fullName: 'Updated Name',
                phoneNumber: '1234567890'
            };
            
            // Call the controller
            await updateUserProfile(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    fullName: 'Updated Name',
                    phoneNumber: '1234567890'
                })
            );
        });
    });
    
    describe('UC12: Change Password', () => {
        it('should change password successfully', async () => {
            // Setup request body
            mockRequest.body = {
                currentPassword: 'password123',
                newPassword: 'newPassword123',
                confirmPassword: 'newPassword123'
            };
            
            // Call the controller
            await changePassword(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Password changed successfully')
                })
            );
        });
        
        it('should reject invalid current password', async () => {
            // Setup request body with wrong current password
            mockRequest.body = {
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123',
                confirmPassword: 'newPassword123'
            };
            
            // Call the controller
            await changePassword(mockRequest, mockResponse);
            
            // Check error response
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Current password is incorrect')
                })
            );
        });
    });
    
    describe('UC16: Premium Upgrade', () => {
        it('should upgrade to premium', async () => {
            // Call the controller
            await upgradeToPremiom(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    isPremium: true,
                    premiumExpiry: expect.any(String)
                })
            );
        });
    });
});