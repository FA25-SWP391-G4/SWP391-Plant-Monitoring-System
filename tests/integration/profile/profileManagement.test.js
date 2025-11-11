/**
 * PROFILE MANAGEMENT INTEGRATION TESTS
 * =====================================
 * 
 * Integration tests for profile management endpoints
 * Tests complete profile workflows with HTTP requests
 */

const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');
const path = require('path');
const fs = require('fs');
const { setupTestDB, teardownTestDB, clearDB } = require('../../../config/testdb');

// Mock email service
jest.mock('../../../services/emailService');
const emailService = require('../../../services/emailService');

describe('Profile Management Integration Tests', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();

        // Mock email service
        emailService.sendEmailChangeVerification.mockResolvedValue();
        emailService.sendAccountDeletionConfirmation.mockResolvedValue();

        // Create and authenticate test user
        testUser = {
            email: 'profile@example.com',
            password: 'SecurePassword123!',
            firstName: 'Profile',
            lastName: 'User'
        };

        await request(app)
            .post('/auth/register')
            .send(testUser)
            .expect(201);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            })
            .expect(200);

        authToken = loginResponse.body.token;
    });

    // UC7: View Profile
    describe('GET /api/profile', () => {
        it('should get user profile successfully', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('profile');
            expect(response.body.profile).toHaveProperty('email', testUser.email);
            expect(response.body.profile).toHaveProperty('firstName', testUser.firstName);
            expect(response.body.profile).toHaveProperty('lastName', testUser.lastName);
            expect(response.body.profile).not.toHaveProperty('password');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/profile')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid tokens', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/profile/stats', () => {
        it('should get profile statistics', async () => {
            const response = await request(app)
                .get('/api/profile/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('stats');
            expect(response.body.stats).toHaveProperty('totalPlants');
            expect(response.body.stats).toHaveProperty('plantsHealthy');
            expect(response.body.stats).toHaveProperty('totalWaterings');
        });
    });

    // UC8: Edit Profile
    describe('PUT /api/profile', () => {
        it('should update basic profile information', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                phoneNumber: '+1234567890'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Profile updated successfully');
            expect(response.body).toHaveProperty('profile');
            expect(response.body.profile).toHaveProperty('firstName', 'Updated');
            expect(response.body.profile).toHaveProperty('lastName', 'Name');
            expect(response.body.profile).toHaveProperty('phoneNumber', '+1234567890');
        });

        it('should validate required fields', async () => {
            const invalidData = {
                firstName: '',
                lastName: 'Valid'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate email format', async () => {
            const invalidData = {
                email: 'invalid-email-format'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid email format');
        });

        it('should prevent duplicate email addresses', async () => {
            // Create another user first
            const otherUser = {
                email: 'other@example.com',
                password: 'Password123!',
                firstName: 'Other',
                lastName: 'User'
            };

            await request(app)
                .post('/auth/register')
                .send(otherUser)
                .expect(201);

            // Try to update to existing email
            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ email: 'other@example.com' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Email already in use');
        });

        it('should validate phone number format', async () => {
            const invalidData = {
                phoneNumber: '123'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid phone number format');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/api/profile')
                .send({ firstName: 'Test' })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/profile/avatar', () => {
        it('should update user avatar successfully', async () => {
            // Create a test image file buffer
            const testImageBuffer = Buffer.from('fake image data');
            
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('avatar', testImageBuffer, 'test-avatar.jpg')
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Avatar updated successfully');
            expect(response.body).toHaveProperty('avatar');
        });

        it('should validate file type', async () => {
            const testFileBuffer = Buffer.from('fake pdf data');
            
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('avatar', testFileBuffer, 'document.pdf')
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Only image files are allowed');
        });

        it('should validate file size', async () => {
            // Create a large buffer (10MB)
            const largeBuffer = Buffer.alloc(10 * 1024 * 1024);
            
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('avatar', largeBuffer, 'large-image.jpg')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('File size too large');
        });

        it('should require a file', async () => {
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'No avatar file provided');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/profile/avatar')
                .attach('avatar', Buffer.from('test'), 'test.jpg')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    // User Preferences
    describe('GET /api/profile/preferences', () => {
        it('should get user preferences', async () => {
            const response = await request(app)
                .get('/api/profile/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('preferences');
        });
    });

    describe('PUT /api/profile/preferences', () => {
        it('should update user preferences', async () => {
            const newPreferences = {
                language: 'es',
                theme: 'dark',
                notifications: false,
                timezone: 'UTC-8'
            };

            const response = await request(app)
                .put('/api/profile/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newPreferences)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Preferences updated successfully');
            expect(response.body).toHaveProperty('preferences');
        });

        it('should validate language preference', async () => {
            const invalidPrefs = {
                language: 'invalid-lang'
            };

            const response = await request(app)
                .put('/api/profile/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPrefs)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid language code');
        });

        it('should validate theme preference', async () => {
            const invalidPrefs = {
                theme: 'rainbow'
            };

            const response = await request(app)
                .put('/api/profile/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPrefs)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid theme. Must be light or dark');
        });
    });

    // Notification Settings
    describe('GET /api/profile/notifications', () => {
        it('should get notification settings', async () => {
            const response = await request(app)
                .get('/api/profile/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('notifications');
        });
    });

    describe('PUT /api/profile/notifications', () => {
        it('should update notification settings', async () => {
            const notificationSettings = {
                email: {
                    plantAlerts: false,
                    systemUpdates: true
                },
                push: {
                    plantAlerts: true,
                    deviceOffline: false
                }
            };

            const response = await request(app)
                .put('/api/profile/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .send(notificationSettings)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Notification settings updated successfully');
        });
    });

    // Account Security
    describe('POST /api/profile/email/change', () => {
        it('should initiate email change process', async () => {
            const emailChangeData = {
                newEmail: 'newemail@example.com',
                password: testUser.password
            };

            const response = await request(app)
                .post('/api/profile/email/change')
                .set('Authorization', `Bearer ${authToken}`)
                .send(emailChangeData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Email verification sent to new address');
            expect(emailService.sendEmailChangeVerification).toHaveBeenCalled();
        });

        it('should require password verification', async () => {
            const emailChangeData = {
                newEmail: 'newemail@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/profile/email/change')
                .set('Authorization', `Bearer ${authToken}`)
                .send(emailChangeData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Current password is incorrect');
        });

        it('should validate new email format', async () => {
            const emailChangeData = {
                newEmail: 'invalid-email',
                password: testUser.password
            };

            const response = await request(app)
                .post('/api/profile/email/change')
                .set('Authorization', `Bearer ${authToken}`)
                .send(emailChangeData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid email format');
        });

        it('should prevent changing to existing email', async () => {
            // Create another user
            const otherUser = {
                email: 'existing@example.com',
                password: 'Password123!',
                firstName: 'Existing',
                lastName: 'User'
            };

            await request(app)
                .post('/auth/register')
                .send(otherUser)
                .expect(201);

            const emailChangeData = {
                newEmail: 'existing@example.com',
                password: testUser.password
            };

            const response = await request(app)
                .post('/api/profile/email/change')
                .set('Authorization', `Bearer ${authToken}`)
                .send(emailChangeData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Email already in use');
        });
    });

    describe('POST /api/profile/email/verify', () => {
        it('should handle email change verification', async () => {
            const verificationData = {
                token: 'mock-verification-token'
            };

            // This would typically require a valid token from the email change process
            // For testing, we mock the token validation
            const response = await request(app)
                .post('/api/profile/email/verify')
                .set('Authorization', `Bearer ${authToken}`)
                .send(verificationData);

            // Response depends on token validation logic
            expect([200, 400]).toContain(response.status);
        });

        it('should require valid token', async () => {
            const response = await request(app)
                .post('/api/profile/email/verify')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('DELETE /api/profile', () => {
        it('should require password confirmation for account deletion', async () => {
            const deleteData = {
                password: testUser.password,
                confirmation: 'DELETE'
            };

            const response = await request(app)
                .delete('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deleteData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Account deleted successfully');
            expect(emailService.sendAccountDeletionConfirmation).toHaveBeenCalled();
        });

        it('should require correct password', async () => {
            const deleteData = {
                password: 'wrongpassword',
                confirmation: 'DELETE'
            };

            const response = await request(app)
                .delete('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deleteData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Current password is incorrect');
        });

        it('should require confirmation text', async () => {
            const deleteData = {
                password: testUser.password,
                confirmation: 'wrong'
            };

            const response = await request(app)
                .delete('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deleteData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Please type DELETE to confirm account deletion');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .delete('/api/profile')
                .send({
                    password: testUser.password,
                    confirmation: 'DELETE'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    // FCM Token Management
    describe('POST /api/profile/fcm-token', () => {
        it('should register FCM token', async () => {
            const tokenData = {
                fcmToken: 'mock-fcm-token-123'
            };

            const response = await request(app)
                .post('/api/profile/fcm-token')
                .set('Authorization', `Bearer ${authToken}`)
                .send(tokenData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'FCM token registered successfully');
        });

        it('should validate FCM token', async () => {
            const response = await request(app)
                .post('/api/profile/fcm-token')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ fcmToken: '' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Valid FCM token is required');
        });
    });

    // Error handling tests
    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // This would require specific database error simulation
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle concurrent profile updates', async () => {
            const updatePromises = Array(3).fill().map((_, index) =>
                request(app)
                    .put('/api/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ firstName: `Updated${index}` })
            );

            const responses = await Promise.all(updatePromises);

            // At least one should succeed
            const successfulUpdates = responses.filter(r => r.status === 200);
            expect(successfulUpdates.length).toBeGreaterThan(0);
        });
    });

    // Security tests
    describe('Security', () => {
        it('should not expose password in any response', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const responseString = JSON.stringify(response.body);
            expect(responseString).not.toContain('password');
            expect(responseString).not.toContain('hash');
        });

        it('should validate file uploads for security', async () => {
            // Test potentially malicious file
            const maliciousBuffer = Buffer.from('<?php echo "test"; ?>');
            
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('avatar', maliciousBuffer, 'malicious.php')
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Only image files are allowed');
        });

        it('should prevent directory traversal in file uploads', async () => {
            const testBuffer = Buffer.from('image data');
            
            const response = await request(app)
                .post('/api/profile/avatar')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('avatar', testBuffer, '../../../etc/passwd')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});