const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const SystemLog = require('../models/SystemLog');

class SubscriptionScheduler {
    static start() {
        // Run every hour to check for expired subscriptions
        cron.schedule('0 * * * *', async () => {
            try {
                console.log('[SUBSCRIPTION SCHEDULER] Checking for expired subscriptions...');
                
                const result = await Subscription.handleExpirationWithFallback();
                
                if (result.regularExpired > 0) {
                    console.log(`[SUBSCRIPTION SCHEDULER] Expired ${result.regularExpired} regular subscriptions`);
                    await SystemLog.info('subscriptionScheduler', 'expireSubscriptions', 
                        `Expired ${result.regularExpired} regular subscriptions`);
                }
                
                if (result.expiredWithFallback > 0) {
                    console.log(`[SUBSCRIPTION SCHEDULER] Processed ${result.expiredWithFallback} subscriptions with fallback to lifetime Premium`);
                    await SystemLog.info('subscriptionScheduler', 'handleFallbacks', 
                        `Processed ${result.expiredWithFallback} subscriptions with fallback to lifetime Premium`);
                }
                
            } catch (error) {
                console.error('[SUBSCRIPTION SCHEDULER] Error checking subscriptions:', error);
                await SystemLog.error('subscriptionScheduler', 'checkSubscriptions', error.message);
            }
        });
        
        // Run daily at 2 AM to clean up old cancelled subscriptions
        cron.schedule('0 2 * * *', async () => {
            try {
                console.log('[SUBSCRIPTION SCHEDULER] Daily maintenance...');
                
                // Log subscription statistics
                const allSubscriptions = await Subscription.findAll();
                const activeCount = allSubscriptions.filter(s => s.isActive).length;
                const expiredCount = allSubscriptions.filter(s => !s.isActive).length;
                
                await SystemLog.info('subscriptionScheduler', 'dailyStats', 
                    `Active subscriptions: ${activeCount}, Expired: ${expiredCount}`);
                
            } catch (error) {
                console.error('[SUBSCRIPTION SCHEDULER] Error in daily maintenance:', error);
                await SystemLog.error('subscriptionScheduler', 'dailyMaintenance', error.message);
            }
        });
        
        console.log('[SUBSCRIPTION SCHEDULER] Started subscription monitoring...');
    }
}

module.exports = SubscriptionScheduler;