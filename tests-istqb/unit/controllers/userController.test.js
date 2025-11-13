const User = require('../../../models/User');
const Payment = require('../../../models/Payment');
const Subscription = require('../../../models/Subscription');
const { isValidUUID } = require('../../../utils/uuidGenerator');

const {
    getUserProfile,
    updateUserProfile,
    upgradeToPremium,
    getPremiumStatus,
    hasActivePremiumSubscription
} = require('../../../controllers/userController');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../models/Payment');
jest.mock('../models/Subscription');
jest.mock('../utils/uuidGenerator');

describe('User Controller', () => {
    let req, res;
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserData = {
        user_id: validUUID,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'Free',
        toJSON: jest.fn().mockReturnValue({
            user_id: validUUID,
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'Free'
        })
    };

    beforeEach(() => {
        req = {
            user: { user_id: validUUID },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
        console.error = jest.fn();
        console.log = jest.fn();
    });

    describe('getUserProfile', () => {
        it('should return user profile successfully', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockResolvedValue(mockUserData);

            await getUserProfile(req, res);

            expect(isValidUUID).toHaveBeenCalledWith(validUUID);
            expect(User.findById).toHaveBeenCalledWith(validUUID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockUserData.toJSON()
            });
        });

        it('should return 400 for invalid UUID', async () => {
            isValidUUID.mockReturnValue(false);

            await getUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid user ID format'
            });
        });

        it('should return 404 when user not found', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockResolvedValue(null);

            await getUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });

        it('should handle database errors', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockRejectedValue(new Error('Database error'));

            await getUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve user profile'
            });
        });
    });

    describe('updateUserProfile', () => {
        const updatedUserData = {
            ...mockUserData,
            full_name: 'Updated Name',
            update: jest.fn().mockResolvedValue(mockUserData)
        };

        it('should update user profile successfully', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockResolvedValue(updatedUserData);
            req.body = {
                full_name: 'Updated Name',
                notification_prefs: { email: true }
            };

            await updateUserProfile(req, res);

            expect(updatedUserData.update).toHaveBeenCalledWith({
                full_name: 'Updated Name',
                notification_prefs: { email: true }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Profile updated successfully',
                data: mockUserData.toJSON()
            });
        });

        it('should return 400 for invalid UUID', async () => {
            isValidUUID.mockReturnValue(false);

            await updateUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid user ID format'
            });
        });

        it('should return 404 when user not found', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockResolvedValue(null);

            await updateUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });

        it('should handle partial updates', async () => {
            isValidUUID.mockReturnValue(true);
            User.findById.mockResolvedValue(updatedUserData);
            req.body = { full_name: 'New Name' };

            await updateUserProfile(req, res);

            expect(updatedUserData.update).toHaveBeenCalledWith({
                full_name: 'New Name'
            });
        });
    });

    describe('upgradeToPremium', () => {
        const paymentId = 'payment-123';
        const mockUser = {
            ...mockUserData,
            role: 'Free',
            update: jest.fn().mockResolvedValue(mockUserData)
        };
        const mockPayment = {
            user_id: validUUID,
            status: 'completed'
        };

        beforeEach(() => {
            req.body = { paymentId };
        });

        it('should upgrade user to premium successfully', async () => {
            User.findById.mockResolvedValue(mockUser);
            Payment.findById.mockResolvedValue(mockPayment);

            await upgradeToPremium(req, res);

            expect(mockUser.update).toHaveBeenCalledWith({ role: 'Premium' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Successfully upgraded to Premium',
                data: mockUserData.toJSON()
            });
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });

        it('should return 400 when payment ID is missing', async () => {
            req.body = {};
            User.findById.mockResolvedValue(mockUser);

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Payment ID is required'
            });
        });

        it('should return 404 when payment not found', async () => {
            User.findById.mockResolvedValue(mockUser);
            Payment.findById.mockResolvedValue(null);

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Payment not found'
            });
        });

        it('should return 403 when payment belongs to different user', async () => {
            User.findById.mockResolvedValue(mockUser);
            Payment.findById.mockResolvedValue({
                ...mockPayment,
                user_id: 'different-user-id'
            });

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Payment does not belong to this user'
            });
        });

        it('should return 400 when payment is not completed', async () => {
            User.findById.mockResolvedValue(mockUser);
            Payment.findById.mockResolvedValue({
                ...mockPayment,
                status: 'pending'
            });

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Payment has not been completed'
            });
        });

        it('should return 400 when user is already Premium', async () => {
            User.findById.mockResolvedValue({ ...mockUser, role: 'Premium' });
            Payment.findById.mockResolvedValue(mockPayment);

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User already has Premium or higher privileges'
            });
        });

        it('should return 400 when user is Admin', async () => {
            User.findById.mockResolvedValue({ ...mockUser, role: 'Admin' });
            Payment.findById.mockResolvedValue(mockPayment);

            await upgradeToPremium(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getPremiumStatus', () => {
        it('should return premium status for Premium user', async () => {
            const premiumUser = { ...mockUserData, role: 'Premium' };
            User.findById.mockResolvedValue(premiumUser);

            await getPremiumStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    isPremium: true,
                    role: 'Premium',
                    premiumFeatures: [
                        'Advanced plant analytics',
                        'Multiple plant zones management',
                        'Custom dashboard widgets',
                        'Advanced sensor thresholds',
                        'Priority customer support'
                    ]
                }
            });
        });

        it('should return premium status for Admin user', async () => {
            const adminUser = { ...mockUserData, role: 'Admin' };
            User.findById.mockResolvedValue(adminUser);

            await getPremiumStatus(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isPremium: true,
                        role: 'Admin'
                    })
                })
            );
        });

        it('should return non-premium status for Free user', async () => {
            User.findById.mockResolvedValue(mockUserData);

            await getPremiumStatus(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    isPremium: false,
                    role: 'Free',
                    premiumFeatures: []
                }
            });
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            await getPremiumStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });
    });

    describe('hasActivePremiumSubscription', () => {
        const mockSubscription = {
            id: 'sub-123',
            userId: validUUID,
            planId: 'plan-123',
            subscriptionType: 'monthly',
            subStart: '2024-01-01',
            subEnd: '2024-02-01',
            isActive: true,
            autoRenew: true,
            planName: 'Premium Plan',
            planDescription: 'Premium features',
            planFeatures: ['feature1', 'feature2']
        };

        it('should return active subscription', async () => {
            isValidUUID.mockReturnValue(true);
            Subscription.getUserActiveSubscription.mockResolvedValue(mockSubscription);

            await hasActivePremiumSubscription(req, res);

            expect(isValidUUID).toHaveBeenCalledWith(validUUID);
            expect(Subscription.getUserActiveSubscription).toHaveBeenCalledWith(validUUID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSubscription
            });
        });

        it('should return 400 for invalid UUID', async () => {
            isValidUUID.mockReturnValue(false);

            await hasActivePremiumSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid user ID format'
            });
        });

        it('should return 404 when no active subscription found', async () => {
            isValidUUID.mockReturnValue(true);
            Subscription.getUserActiveSubscription.mockResolvedValue(null);

            await hasActivePremiumSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No active subscription found'
            });
        });

        it('should handle database errors', async () => {
            isValidUUID.mockReturnValue(true);
            Subscription.getUserActiveSubscription.mockRejectedValue(new Error('DB error'));

            await hasActivePremiumSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to check subscription status'
            });
        });
    });
});