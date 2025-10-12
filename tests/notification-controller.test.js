/**
 * Notification Controller Tests
 */

const { 
    getUserNotifications, 
    getUnreadNotifications, 
    markNotificationAsRead, 
    deleteNotification, 
    updateNotificationPreferences 
} = require('../__mocks__/notificationController');

describe('Notification Controller Tests', () => {
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
    
    describe('UC9: Notification Management', () => {
        it('should get all user notifications', async () => {
            // Call the controller
            await getUserNotifications(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        type: expect.any(String),
                        message: expect.any(String)
                    })
                ])
            );
        });
        
        it('should get unread notifications', async () => {
            // Call the controller
            await getUnreadNotifications(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        read: false
                    })
                ])
            );
            
            // Make sure all returned notifications are unread
            const notifications = mockResponse.json.mock.calls[0][0];
            expect(notifications.every(notif => notif.read === false)).toBeTruthy();
        });
        
        it('should mark notification as read', async () => {
            // Setup request params
            mockRequest.params = { id: 'notif1' };
            
            // Call the controller
            await markNotificationAsRead(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'notif1',
                    read: true,
                    readAt: expect.any(String)
                })
            );
        });
        
        it('should delete notification', async () => {
            // Setup request params
            mockRequest.params = { id: 'notif2' };
            
            // Call the controller
            await deleteNotification(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('deleted'),
                    id: 'notif2'
                })
            );
        });
        
        it('should update notification preferences', async () => {
            // Setup request body
            mockRequest.body = {
                emailNotifications: false,
                pushNotifications: true,
                alertThreshold: 50
            };
            
            // Call the controller
            await updateNotificationPreferences(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user123',
                    emailNotifications: false,
                    pushNotifications: true,
                    alertThreshold: 50
                })
            );
        });
    });
});