const SubscriptionService = require('../../../services/subscriptionService');
const { pool } = require('../../../config/db');
const SystemLog = require('../../../models/SystemLog');

    // Mock dependencies
    jest.mock('../../../config/db');
    jest.mock('../../../models/SystemLog');

    /**
     * ============================================================================
     * UNIT TEST: Subscription Service
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: services/subscriptionService.js
     */

    describe('SubscriptionService', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      describe('refreshUserRole()', () => {
        test('should refresh user role successfully', async () => {
          const userId = 123;
          const mockRole = 'premium';
          
          pool.query
            .mockResolvedValueOnce({}) // First call to update_user_role_from_subscription
            .mockResolvedValueOnce({ rows: [{ role: mockRole }] }); // Second call to get user role

          const result = await SubscriptionService.refreshUserRole(userId);

          expect(pool.query).toHaveBeenCalledTimes(2);
          expect(pool.query).toHaveBeenNthCalledWith(1, 'SELECT update_user_role_from_subscription()', []);
          expect(pool.query).toHaveBeenNthCalledWith(2, 'SELECT role FROM users WHERE user_id = $1', [userId]);
          expect(SystemLog.info).toHaveBeenCalledWith(
            'subscriptionService',
            'refreshUserRole',
            `User ${userId} role refreshed to: ${mockRole}`
          );
          expect(result).toBe(mockRole);
        });

        test('should return null when user not found', async () => {
          const userId = 999;
          
          pool.query
            .mockResolvedValueOnce({}) // First call succeeds
            .mockResolvedValueOnce({ rows: [] }); // Second call returns no user

          const result = await SubscriptionService.refreshUserRole(userId);

          expect(result).toBeNull();
          expect(SystemLog.info).not.toHaveBeenCalled();
        });

        test('should handle database errors', async () => {
          const userId = 123;
          const mockError = new Error('Database connection failed');
          
          pool.query.mockRejectedValueOnce(mockError);

          await expect(SubscriptionService.refreshUserRole(userId)).rejects.toThrow(mockError);
          expect(SystemLog.error).toHaveBeenCalledWith(
            'subscriptionService',
            'refreshUserRole',
            `Failed to refresh role for user ${userId}: ${mockError.message}`
          );
        });
      });

      describe('expireSubscriptions()', () => {
        test('should expire subscriptions successfully', async () => {
          pool.query.mockResolvedValueOnce({});

          const result = await SubscriptionService.expireSubscriptions();

          expect(pool.query).toHaveBeenCalledWith('SELECT expire_subscriptions()');
          expect(SystemLog.info).toHaveBeenCalledWith(
            'subscriptionService',
            'expireSubscriptions',
            'Expired subscriptions processed successfully'
          );
          expect(result).toBe(true);
        });

        test('should handle database errors', async () => {
          const mockError = new Error('Database error');
          pool.query.mockRejectedValueOnce(mockError);

          await expect(SubscriptionService.expireSubscriptions()).rejects.toThrow(mockError);
          expect(SystemLog.error).toHaveBeenCalledWith(
            'subscriptionService',
            'expireSubscriptions',
            `Failed to expire subscriptions: ${mockError.message}`
          );
        });
      });

      describe('getSubscriptionAnalytics()', () => {
        test('should return subscription analytics successfully', async () => {
          const mockActiveSubscriptions = [
            { plan_name: 'Premium', subscription_type: 'monthly', count: '5', total_revenue: '150' }
          ];
          const mockExpiringCount = { expiring_count: '3' };

          pool.query
            .mockResolvedValueOnce({ rows: mockActiveSubscriptions })
            .mockResolvedValueOnce({ rows: [mockExpiringCount] });

          const result = await SubscriptionService.getSubscriptionAnalytics();

          expect(pool.query).toHaveBeenCalledTimes(2);
          expect(result).toEqual({
            activeSubscriptions: mockActiveSubscriptions,
            expiringCount: mockExpiringCount.expiring_count
          });
        });

        test('should handle database errors', async () => {
          const mockError = new Error('Query failed');
          pool.query.mockRejectedValueOnce(mockError);

          await expect(SubscriptionService.getSubscriptionAnalytics()).rejects.toThrow(mockError);
          expect(SystemLog.error).toHaveBeenCalledWith(
            'subscriptionService',
            'getSubscriptionAnalytics',
            mockError.message
          );
        });
      });

      describe('checkFeatureAccess()', () => {
        test('should return access for user with premium subscription', async () => {
          const userId = 123;
          const featureName = 'advanced_analytics';
          const mockSubscription = {
            features: ['advanced_analytics', 'ai_predictions'],
            plan_name: 'Premium',
            is_active: true
          };

          pool.query.mockResolvedValueOnce({ rows: [mockSubscription] });

          const result = await SubscriptionService.checkFeatureAccess(userId, featureName);

          expect(result).toEqual({
            hasAccess: true,
            planName: 'Premium',
            reason: 'Included in Premium plan'
          });
        });

        test('should deny access for feature not in subscription', async () => {
          const userId = 123;
          const featureName = 'enterprise_feature';
          const mockSubscription = {
            features: ['basic_feature'],
            plan_name: 'Basic',
            is_active: true
          };

          pool.query.mockResolvedValueOnce({ rows: [mockSubscription] });

          const result = await SubscriptionService.checkFeatureAccess(userId, featureName);

          expect(result).toEqual({
            hasAccess: false,
            planName: 'Basic',
            reason: 'Not available in Basic plan'
          });
        });

        test('should fallback to Basic plan when no active subscription', async () => {
          const userId = 123;
          const featureName = 'basic_feature';
          const mockBasicPlan = { features: ['basic_feature'] };

          pool.query
            .mockResolvedValueOnce({ rows: [] }) // No active subscription
            .mockResolvedValueOnce({ rows: [mockBasicPlan] }); // Basic plan features

          const result = await SubscriptionService.checkFeatureAccess(userId, featureName);

          expect(result).toEqual({
            hasAccess: true,
            planName: 'Basic',
            reason: 'Included in Basic plan'
          });
        });

        test('should deny access when no subscription and feature not in Basic', async () => {
          const userId = 123;
          const featureName = 'premium_feature';
          const mockBasicPlan = { features: ['basic_feature'] };

          pool.query
            .mockResolvedValueOnce({ rows: [] }) // No active subscription
            .mockResolvedValueOnce({ rows: [mockBasicPlan] }); // Basic plan features

          const result = await SubscriptionService.checkFeatureAccess(userId, featureName);

          expect(result).toEqual({
            hasAccess: false,
            planName: 'Basic',
            reason: 'Not available in Basic plan'
          });
        });

        test('should handle no Basic plan found', async () => {
          const userId = 123;
          const featureName = 'any_feature';

          pool.query
            .mockResolvedValueOnce({ rows: [] }) // No active subscription
            .mockResolvedValueOnce({ rows: [] }); // No Basic plan found

          const result = await SubscriptionService.checkFeatureAccess(userId, featureName);

          expect(result).toEqual({
            hasAccess: false,
            planName: null,
            reason: 'No active subscription'
          });
        });

        test('should handle database errors', async () => {
          const userId = 123;
          const featureName = 'any_feature';
          const mockError = new Error('Database error');

          pool.query.mockRejectedValueOnce(mockError);

          await expect(SubscriptionService.checkFeatureAccess(userId, featureName)).rejects.toThrow(mockError);
          expect(SystemLog.error).toHaveBeenCalledWith(
            'subscriptionService',
            'checkFeatureAccess',
            mockError.message
          );
        });
      });
    });