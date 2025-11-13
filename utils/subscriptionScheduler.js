const cron = require('node-cron');
const SubscriptionService = require('../services/subscriptionService');
const SystemLog = require('../models/SystemLog');

/**
 * Schedule subscription expiration checks
 * Runs every hour to check for expired subscriptions
 */
const scheduleSubscriptionTasks = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[SUBSCRIPTION SCHEDULER] Running subscription expiration check...');
      await SubscriptionService.expireSubscriptions();
      console.log('[SUBSCRIPTION SCHEDULER] Subscription expiration check completed');
    } catch (error) {
      console.error('[SUBSCRIPTION SCHEDULER] Error during subscription expiration check:', error);
      await SystemLog.error('subscriptionScheduler', 'expireSubscriptions', error.message);
    }
  });

  console.log('[SUBSCRIPTION SCHEDULER] Subscription tasks scheduled:');
  console.log('  - Expiration check: Every hour at minute 0');
};

module.exports = {
  scheduleSubscriptionTasks
};