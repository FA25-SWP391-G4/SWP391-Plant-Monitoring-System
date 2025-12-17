const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const SystemLog = require('../models/SystemLog');

class SubscriptionController {
  /**
   * Create a new subscription after successful payment
   * POST /api/subscriptions
   */
  static async createSubscription(req, res) {
    try {
      const { planId, paymentId, subscriptionType } = req.body;
      const userId = req.user.user_id;

      // Validate plan exists and is accessible
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: 'Plan not found'
        });
      }

      // Check if plan is admin-only and user is not admin
      if (plan.isAdminOnly && req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This plan is restricted.'
        });
      }

      // Check upgrade policy
      const upgradeCheck = await Subscription.canUserUpgrade(userId, plan.name);
      if (!upgradeCheck.canUpgrade) {
        return res.status(400).json({
          success: false,
          error: upgradeCheck.reason,
          currentSubscription: upgradeCheck.currentSubscription
        });
      }

      // Handle different scenarios based on upgrade check
      let subscription;
      
      if (upgradeCheck.reason === 'Extension of current plan allowed') {
        // Extend existing subscription
        const activeSubscription = await Subscription.getUserActiveSubscription(userId);
        const extensionMonths = subscriptionType === 'monthly' ? 1 : 12;
        subscription = await activeSubscription.extend(extensionMonths);
        
        await SystemLog.info('subscriptionController', 'extendSubscription', 
          `Subscription extended for user ${userId}, plan: ${plan.name}`);
      } else if (upgradeCheck.reason === 'Lifetime Premium can upgrade to Ultimate') {
        // Special case: Deactivate lifetime Premium temporarily and create Ultimate
        const lifetimePremium = await Subscription.getUserActiveSubscription(userId);
        await lifetimePremium.update({ isActive: false });
        
        // Create new Ultimate subscription
        subscription = await Subscription.createSubscription({
          userId,
          planId,
          paymentId,
          subscriptionType
        });
        
        await SystemLog.info('subscriptionController', 'upgradeFromLifetimePremium', 
          `User ${userId} upgraded from lifetime Premium to Ultimate`);
      } else {
        // New subscription (no active subscription)
        subscription = await Subscription.createSubscription({
          userId,
          planId,
          paymentId,
          subscriptionType
        });
        
        await SystemLog.info('subscriptionController', 'createSubscription', 
          `New subscription created for user ${userId}, plan: ${plan.name}`);
      }

      res.status(201).json({
        success: true,
        data: subscription,
        action: upgradeCheck.reason
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'createSubscription', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  }

  /**
   * Check if user can upgrade to a specific plan
   * GET /api/subscriptions/can-upgrade/:planName
   */
  static async checkUpgradeEligibility(req, res) {
    try {
      const { planName } = req.params;
      const userId = req.user.user_id;

      const upgradeCheck = await Subscription.canUserUpgrade(userId, planName);
      
      res.status(200).json({
        success: true,
        data: upgradeCheck
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'checkUpgradeEligibility', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to check upgrade eligibility'
      });
    }
  }

  /**
   * Get user's subscription history
   * GET /api/subscriptions/history
   */
  static async getUserSubscriptionHistory(req, res) {
    try {
      const userId = req.user.user_id;
      
      const subscriptions = await Subscription.findByUserId(userId);

      res.status(200).json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'getUserSubscriptionHistory', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription history'
      });
    }
  }

  /**
   * Cancel user's active subscription
   * POST /api/subscriptions/cancel
   */
  static async cancelSubscription(req, res) {
    try {
      const userId = req.user.user_id;
      
      const subscription = await Subscription.getUserActiveSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
      }

      await subscription.cancel();
      
      await SystemLog.info('subscriptionController', 'cancelSubscription', 
        `Subscription cancelled for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'cancelSubscription', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Get expiring subscriptions (admin only)
   * GET /api/subscriptions/expiring
   */
  static async getExpiringSubscriptions(req, res) {
    try {
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const daysAhead = parseInt(req.query.days) || 7;
      const subscriptions = await Subscription.getExpiringSubscriptions(daysAhead);

      res.status(200).json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'getExpiringSubscriptions', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch expiring subscriptions'
      });
    }
  }

  /**
   * Manually assign subscription to user (admin only)
   * POST /api/subscriptions/assign
   */
  static async assignSubscription(req, res) {
    try {
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const { userId, planId, subscriptionType, durationMonths } = req.body;

      // Validate plan exists
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: 'Plan not found'
        });
      }

      // Deactivate existing subscriptions for the user
      await Subscription.deactivateUserSubscriptions(userId);

      // Create subscription with custom duration for admin assignments
      const subscription = await Subscription.createSubscription({
        userId,
        planId,
        paymentId: null, // Admin-assigned, no payment
        subscriptionType
      });

      // Update end date if custom duration is provided
      if (durationMonths && subscriptionType !== 'lifetime') {
        let customEndDate = new Date();
        if (subscriptionType === 'monthly') {
          customEndDate.setMonth(customEndDate.getMonth() + durationMonths);
        } else if (subscriptionType === 'yearly') {
          customEndDate.setFullYear(customEndDate.getFullYear() + Math.ceil(durationMonths / 12));
        }
        
        await subscription.update({
          subEnd: customEndDate,
          autoRenew: false // Admin-assigned subscriptions don't auto-renew
        });
      }

      await SystemLog.info('subscriptionController', 'assignSubscription', 
        `Admin ${req.user.user_id} assigned ${plan.name} subscription to user ${userId}`);

      res.status(201).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      await SystemLog.error('subscriptionController', 'assignSubscription', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to assign subscription'
      });
    }
  }
}

module.exports = SubscriptionController;