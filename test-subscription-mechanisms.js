const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const { pool } = require('../config/db');

async function testSubscriptionMechanisms() {
    console.log('🧪 Testing Subscription Mechanisms...\n');
    
    let testUserId;
    let premiumPlanId;
    let ultimatePlanId;
    
    try {
        // Setup: Create test user
        const userResult = await pool.query(`
            INSERT INTO users (email, password_hash, given_name, family_name, role)
            VALUES ('test-subscription-' + random()::text + '@example.com', 'hashedpassword', 'Test', 'User', 'Regular')
            RETURNING user_id
        `);
        testUserId = userResult.rows[0].user_id;
        console.log('✅ Created test user:', testUserId);

        // Get plan IDs
        const premiumPlan = await Plan.getPlanByName('Premium');
        const ultimatePlan = await Plan.getPlanByName('Ultimate');
        premiumPlanId = premiumPlan.id;
        ultimatePlanId = ultimatePlan.id;
        console.log('✅ Retrieved plan IDs: Premium:', premiumPlanId, 'Ultimate:', ultimatePlanId);

        // Test 1: New subscription (no existing)
        console.log('\n🔍 Testing new subscription...');
        const newSubResult = await Subscription.canUserUpgrade(testUserId, 'Premium');
        console.log('Result:', newSubResult);
        
        if (newSubResult.canUpgrade && !newSubResult.isExtension) {
            console.log('✅ PASS: New subscription allowed');
        } else {
            console.log('❌ FAIL: New subscription should be allowed');
        }

        // Create initial Premium subscription
        const premiumSub = await Subscription.createSubscription({
            userId: testUserId,
            planId: premiumPlanId,
            paymentId: null,
            subscriptionType: 'monthly'
        });
        console.log('✅ Created Premium subscription:', premiumSub.id);

        // Test 2: Extension of same plan
        console.log('\n🔍 Testing extension of same plan...');
        const extensionResult = await Subscription.canUserUpgrade(testUserId, 'Premium');
        console.log('Result:', extensionResult);
        
        if (extensionResult.canUpgrade && extensionResult.isExtension) {
            console.log('✅ PASS: Extension allowed');
        } else {
            console.log('❌ FAIL: Extension should be allowed');
        }

        // Test 3: Blocked upgrade attempt
        console.log('\n🔍 Testing blocked upgrade attempt...');
        const upgradeResult = await Subscription.canUserUpgrade(testUserId, 'Ultimate');
        console.log('Result:', upgradeResult);
        
        if (!upgradeResult.canUpgrade && upgradeResult.reason.includes('Cannot upgrade active subscription')) {
            console.log('✅ PASS: Upgrade correctly blocked');
        } else {
            console.log('❌ FAIL: Upgrade should be blocked');
        }

        // Clean up for next test
        await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [testUserId]);

        // Test 4: Lifetime Premium to Ultimate upgrade
        console.log('\n🔍 Testing lifetime Premium to Ultimate upgrade...');
        const lifetimePremium = await Subscription.createSubscription({
            userId: testUserId,
            planId: premiumPlanId,
            paymentId: null,
            subscriptionType: 'lifetime'
        });
        console.log('✅ Created lifetime Premium subscription:', lifetimePremium.id);

        const lifetimeUpgradeResult = await Subscription.canUserUpgrade(testUserId, 'Ultimate');
        console.log('Result:', lifetimeUpgradeResult);
        
        if (lifetimeUpgradeResult.canUpgrade && lifetimeUpgradeResult.hasLifetimeFallback) {
            console.log('✅ PASS: Lifetime Premium to Ultimate upgrade allowed');
        } else {
            console.log('❌ FAIL: Lifetime Premium to Ultimate upgrade should be allowed');
        }

        // Test 5: Create Ultimate with fallback
        console.log('\n🔍 Testing Ultimate subscription with fallback...');
        const ultimateWithFallback = await Subscription.createSubscriptionWithFallback({
            userId: testUserId,
            planId: ultimatePlanId,
            paymentId: null,
            subscriptionType: 'monthly',
            fallbackSubscriptionId: lifetimePremium.id
        });
        console.log('✅ Created Ultimate with fallback:', ultimateWithFallback.id);

        // Check that fallback is set
        if (ultimateWithFallback.fallbackSubscriptionId === lifetimePremium.id) {
            console.log('✅ PASS: Fallback subscription ID correctly set');
        } else {
            console.log('❌ FAIL: Fallback subscription ID not set correctly');
        }

        // Test 6: Fallback handling on expiration
        console.log('\n🔍 Testing fallback handling on expiration...');
        
        // Make Ultimate subscription expired
        await pool.query(`
            UPDATE subscriptions 
            SET sub_end = CURRENT_TIMESTAMP - INTERVAL '1 day'
            WHERE id = $1
        `, [ultimateWithFallback.id]);

        const fallbackResult = await Subscription.handleExpirationWithFallback();
        console.log('Fallback result:', fallbackResult);

        if (fallbackResult.expiredWithFallback > 0) {
            console.log('✅ PASS: Expiration with fallback handled');
        } else {
            console.log('❌ FAIL: Expiration with fallback not handled');
        }

        // Check user's current subscription
        const activeSubscription = await Subscription.getUserActiveSubscription(testUserId);
        if (activeSubscription && activeSubscription.planId === premiumPlanId) {
            console.log('✅ PASS: User reverted to Premium subscription');
        } else {
            console.log('❌ FAIL: User should have Premium subscription active');
        }

        console.log('\n🎉 All subscription mechanism tests completed!');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        // Cleanup
        if (testUserId) {
            await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [testUserId]);
            await pool.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
            console.log('✅ Cleaned up test data');
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testSubscriptionMechanisms()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testSubscriptionMechanisms };