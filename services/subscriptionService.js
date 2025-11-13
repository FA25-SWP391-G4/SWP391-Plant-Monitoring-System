const { pool } = require('../config/db');
const SystemLog = require('../models/SystemLog');

class SubscriptionService {
  /**
   * Manually refresh user role based on current subscription status
   * This can be called after subscription changes to ensure role is up-to-date
   */
  static async refreshUserRole(userId) {
    try {
      // Call the trigger function manually
      await pool.query('SELECT update_user_role_from_subscription()', []);
      
      // Get updated user role
      const result = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
      
      if (result.rows.length > 0) {
        const newRole = result.rows[0].role;
        await SystemLog.info('subscriptionService', 'refreshUserRole', 
          `User ${userId} role refreshed to: ${newRole}`);
        return newRole;
      }
      
      return null;
    } catch (error) {
      await SystemLog.error('subscriptionService', 'refreshUserRole', 
        `Failed to refresh role for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Expire all past due subscriptions and update user roles
   */
  static async expireSubscriptions() {
    try {
      // Call the expire subscriptions function
      await pool.query('SELECT expire_subscriptions()');
      
      await SystemLog.info('subscriptionService', 'expireSubscriptions', 
        'Expired subscriptions processed successfully');
      
      return true;
    } catch (error) {
      await SystemLog.error('subscriptionService', 'expireSubscriptions', 
        `Failed to expire subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription analytics for admin
   */
  static async getSubscriptionAnalytics() {
    try {
      const activeSubscriptionsQuery = `
        SELECT 
          p.name as plan_name,
          s.subscription_type,
          COUNT(*) as count,
          SUM(CASE 
            WHEN s.subscription_type = 'monthly' THEN p.price_monthly
            WHEN s.subscription_type = 'yearly' THEN p.price_yearly
            WHEN s.subscription_type = 'lifetime' THEN p.price_lifetime
            ELSE 0
          END) as total_revenue
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.is_active = TRUE
        AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
        GROUP BY p.name, s.subscription_type
        ORDER BY p.name, s.subscription_type
      `;

      const expiringQuery = `
        SELECT COUNT(*) as expiring_count
        FROM subscriptions s
        WHERE s.is_active = TRUE
        AND s.sub_end IS NOT NULL
        AND s.sub_end BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
      `;

      const [activeResult, expiringResult] = await Promise.all([
        pool.query(activeSubscriptionsQuery),
        pool.query(expiringQuery)
      ]);

      return {
        activeSubscriptions: activeResult.rows,
        expiringCount: expiringResult.rows[0].expiring_count
      };
    } catch (error) {
      await SystemLog.error('subscriptionService', 'getSubscriptionAnalytics', error.message);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature based on their subscription
   */
  static async checkFeatureAccess(userId, featureName) {
    try {
      const query = `
        SELECT p.features, p.name as plan_name, s.is_active
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = $1
        AND s.is_active = TRUE
        AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        // User has no active subscription, check basic plan features
        const basicPlan = await pool.query('SELECT features FROM plans WHERE name = $1', ['Basic']);
        if (basicPlan.rows.length > 0) {
          const features = basicPlan.rows[0].features || [];
          return {
            hasAccess: features.includes(featureName),
            planName: 'Basic',
            reason: features.includes(featureName) ? 'Included in Basic plan' : 'Not available in Basic plan'
          };
        }
        return { hasAccess: false, planName: null, reason: 'No active subscription' };
      }

      const subscription = result.rows[0];
      const features = subscription.features || [];
      const hasAccess = features.includes(featureName);

      return {
        hasAccess,
        planName: subscription.plan_name,
        reason: hasAccess ? `Included in ${subscription.plan_name} plan` : `Not available in ${subscription.plan_name} plan`
      };
    } catch (error) {
      await SystemLog.error('subscriptionService', 'checkFeatureAccess', error.message);
      throw error;
    }
  }
}

module.exports = SubscriptionService;