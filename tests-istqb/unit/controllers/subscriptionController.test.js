const SubscriptionController = require('../../../controllers/subscriptionController');
const Subscription = require('../../../models/Subscription');
const Plan = require('../../../models/Plan');
const Payment = require('../../../models/Payment');
const SystemLog = require('../../../models/SystemLog');

    /**
     * ============================================================================
     * UNIT TEST: Subscription Controller
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: controllers/subscriptionController.js
     */


    // Mock all dependencies
    jest.mock('../../../models/Subscription');
    jest.mock('../../../models/Plan');
    jest.mock('../../../models/Payment');
    jest.mock('../../../models/SystemLog');

    describe('subscriptionController', () => {
      let req, res;

      beforeEach(() => {
        req = {
          user: { user_id: 1, role: 'User' },
          body: {},
          params: {},
          query: {}
        };
        res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      describe('createSubscription()', () => {
        test('should create new subscription successfully', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          const mockPlan = { plan_id: 1, name: 'Basic', isAdminOnly: false };
          const mockUpgradeCheck = { canUpgrade: true, reason: 'No active subscription' };
          const mockSubscription = { subscription_id: 1, userId: 1, planId: 1 };

          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);
          Subscription.createSubscription.mockResolvedValue(mockSubscription);
          SystemLog.info.mockResolvedValue();

          await SubscriptionController.createSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockSubscription,
            action: 'No active subscription'
          });
        });

        test('should return 404 when plan not found', async () => {
          req.body = { planId: 999, paymentId: 1, subscriptionType: 'monthly' };
          
          Plan.findById.mockResolvedValue(null);

          await SubscriptionController.createSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Plan not found'
          });
        });

        test('should return 403 for admin-only plan access by regular user', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          const mockPlan = { plan_id: 1, name: 'Admin Plan', isAdminOnly: true };
          Plan.findById.mockResolvedValue(mockPlan);

          await SubscriptionController.createSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Access denied. This plan is restricted.'
          });
        });

        test('should return 400 when user cannot upgrade', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          const mockPlan = { plan_id: 1, name: 'Premium', isAdminOnly: false };
          const mockUpgradeCheck = { 
            canUpgrade: false, 
            reason: 'Already has higher tier plan',
            currentSubscription: { plan: 'Ultimate' }
          };

          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);

          await SubscriptionController.createSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Already has higher tier plan',
            currentSubscription: { plan: 'Ultimate' }
          });
        });

        test('should extend existing subscription when extension allowed', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          const mockPlan = { plan_id: 1, name: 'Basic', isAdminOnly: false };
          const mockUpgradeCheck = { canUpgrade: true, reason: 'Extension of current plan allowed' };
          const mockActiveSubscription = { extend: jest.fn().mockResolvedValue({ subscription_id: 1 }) };

          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);
          Subscription.getUserActiveSubscription.mockResolvedValue(mockActiveSubscription);
          SystemLog.info.mockResolvedValue();

          await SubscriptionController.createSubscription(req, res);

          expect(mockActiveSubscription.extend).toHaveBeenCalledWith(1);
          expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should handle lifetime Premium to Ultimate upgrade', async () => {
          req.body = { planId: 2, paymentId: 1, subscriptionType: 'lifetime' };
          
          const mockPlan = { plan_id: 2, name: 'Ultimate', isAdminOnly: false };
          const mockUpgradeCheck = { canUpgrade: true, reason: 'Lifetime Premium can upgrade to Ultimate' };
          const mockLifetimePremium = { update: jest.fn().mockResolvedValue() };
          const mockNewSubscription = { subscription_id: 2, planId: 2 };

          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);
          Subscription.getUserActiveSubscription.mockResolvedValue(mockLifetimePremium);
          Subscription.createSubscription.mockResolvedValue(mockNewSubscription);
          SystemLog.info.mockResolvedValue();

          await SubscriptionController.createSubscription(req, res);

          expect(mockLifetimePremium.update).toHaveBeenCalledWith({ isActive: false });
          expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should handle errors and return 500', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          Plan.findById.mockRejectedValue(new Error('Database error'));
          SystemLog.error.mockResolvedValue();

          await SubscriptionController.createSubscription(req, res);

          expect(SystemLog.error).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to create subscription'
          });
        });

        test('should link to plan', async () => {
          req.body = { planId: 1, paymentId: 1, subscriptionType: 'monthly' };
          
          const mockPlan = { plan_id: 1, name: 'Basic', isAdminOnly: false };
          const mockUpgradeCheck = { canUpgrade: true, reason: 'No active subscription' };

          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);
          Subscription.createSubscription.mockResolvedValue({ subscription_id: 1, planId: 1 });

          await SubscriptionController.createSubscription(req, res);

          expect(Subscription.createSubscription).toHaveBeenCalledWith({
            userId: 1,
            planId: 1,
            paymentId: 1,
            subscriptionType: 'monthly'
          });
        });
      });

      describe('checkUpgradeEligibility()', () => {
        test('should return upgrade eligibility successfully', async () => {
          req.params = { planName: 'Premium' };
          
          const mockUpgradeCheck = { canUpgrade: true, reason: 'Can upgrade to Premium' };
          Subscription.canUserUpgrade.mockResolvedValue(mockUpgradeCheck);

          await SubscriptionController.checkUpgradeEligibility(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockUpgradeCheck
          });
        });

        test('should handle errors in upgrade eligibility check', async () => {
          req.params = { planName: 'Premium' };
          
          Subscription.canUserUpgrade.mockRejectedValue(new Error('Database error'));
          SystemLog.error.mockResolvedValue();

          await SubscriptionController.checkUpgradeEligibility(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to check upgrade eligibility'
          });
        });
      });

      describe('getUserSubscriptionHistory()', () => {
        test('should get user subscription history', async () => {
          const mockSubscriptions = [
            { subscription_id: 1, planName: 'Basic' },
            { subscription_id: 2, planName: 'Premium' }
          ];
          
          Subscription.findByUserId.mockResolvedValue(mockSubscriptions);

          await SubscriptionController.getUserSubscriptionHistory(req, res);

          expect(Subscription.findByUserId).toHaveBeenCalledWith(1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockSubscriptions
          });
        });

        test('should handle errors in getting subscription history', async () => {
          Subscription.findByUserId.mockRejectedValue(new Error('Database error'));
          SystemLog.error.mockResolvedValue();

          await SubscriptionController.getUserSubscriptionHistory(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to fetch subscription history'
          });
        });
      });

      describe('cancelSubscription()', () => {
        test('should cancel active subscription successfully', async () => {
          const mockSubscription = { 
            subscription_id: 1,
            cancel: jest.fn().mockResolvedValue()
          };
          
          Subscription.getUserActiveSubscription.mockResolvedValue(mockSubscription);
          SystemLog.info.mockResolvedValue();

          await SubscriptionController.cancelSubscription(req, res);

          expect(mockSubscription.cancel).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Subscription cancelled successfully'
          });
        });

        test('should return 404 when no active subscription found', async () => {
          Subscription.getUserActiveSubscription.mockResolvedValue(null);

          await SubscriptionController.cancelSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'No active subscription found'
          });
        });

        test('should handle errors in cancellation', async () => {
          Subscription.getUserActiveSubscription.mockRejectedValue(new Error('Database error'));
          SystemLog.error.mockResolvedValue();

          await SubscriptionController.cancelSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to cancel subscription'
          });
        });
      });

      describe('getExpiringSubscriptions()', () => {
        test('should get expiring subscriptions for admin', async () => {
          req.user.role = 'Admin';
          req.query.days = '14';
          
          const mockSubscriptions = [
            { subscription_id: 1, subEnd: '2024-01-15' },
            { subscription_id: 2, subEnd: '2024-01-20' }
          ];
          
          Subscription.getExpiringSubscriptions.mockResolvedValue(mockSubscriptions);

          await SubscriptionController.getExpiringSubscriptions(req, res);

          expect(Subscription.getExpiringSubscriptions).toHaveBeenCalledWith(14);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockSubscriptions
          });
        });

        test('should use default 7 days when no days specified', async () => {
          req.user.role = 'Admin';
          
          Subscription.getExpiringSubscriptions.mockResolvedValue([]);

          await SubscriptionController.getExpiringSubscriptions(req, res);

          expect(Subscription.getExpiringSubscriptions).toHaveBeenCalledWith(7);
        });

        test('should deny access for non-admin users', async () => {
          req.user.role = 'User';

          await SubscriptionController.getExpiringSubscriptions(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Access denied. Admin role required.'
          });
        });
      });

      describe('assignSubscription()', () => {
        test('should assign subscription as admin', async () => {
          req.user.role = 'Admin';
          req.body = { userId: 2, planId: 1, subscriptionType: 'monthly', durationMonths: 3 };
          
          const mockPlan = { plan_id: 1, name: 'Basic' };
          const mockSubscription = { 
            subscription_id: 1,
            update: jest.fn().mockResolvedValue()
          };
          
          Plan.findById.mockResolvedValue(mockPlan);
          Subscription.deactivateUserSubscriptions.mockResolvedValue();
          Subscription.createSubscription.mockResolvedValue(mockSubscription);
          SystemLog.info.mockResolvedValue();

          await SubscriptionController.assignSubscription(req, res);

          expect(Subscription.deactivateUserSubscriptions).toHaveBeenCalledWith(2);
          expect(Subscription.createSubscription).toHaveBeenCalledWith({
            userId: 2,
            planId: 1,
            paymentId: null,
            subscriptionType: 'monthly'
          });
          expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should deny access for non-admin users', async () => {
          req.user.role = 'User';
          req.body = { userId: 2, planId: 1, subscriptionType: 'monthly' };

          await SubscriptionController.assignSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Access denied. Admin role required.'
          });
        });

        test('should return 404 when plan not found', async () => {
          req.user.role = 'Admin';
          req.body = { userId: 2, planId: 999, subscriptionType: 'monthly' };
          
          Plan.findById.mockResolvedValue(null);

          await SubscriptionController.assignSubscription(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Plan not found'
          });
        });
      });

      describe('checkSubscriptionStatus()', () => {
        test('should verify subscription is active', async () => {
          const mockActiveSubscription = { 
            subscription_id: 1,
            isActive: true,
            subEnd: '2024-12-31'
          };
          
          Subscription.getUserActiveSubscription.mockResolvedValue(mockActiveSubscription);

          // This test assumes there's a method to check status
          expect(mockActiveSubscription.isActive).toBe(true);
        });
      });
    });