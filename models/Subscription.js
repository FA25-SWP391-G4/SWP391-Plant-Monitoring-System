/**
 * ============================================================================
 * SUBSCRIPTION MODEL - USER SUBSCRIPTION MANAGEMENT
 * ============================================================================
 * 
 * SUPPORTS SUBSCRIPTION SYSTEM:
 * - User subscription lifecycle management
 * - Plan-based subscription creation
 * - Automatic expiration handling
 * - Payment association tracking
 * - Subscription history and analytics
 * 
 * SUBSCRIPTION STRUCTURE:
 * - id: Unique subscription identifier
 * - user_id: Associated user UUID
 * - plan_id: Associated plan ID
 * - payment_id: Payment transaction reference (optional)
 * - subscription_type: monthly, yearly, lifetime
 * - sub_start: Subscription start date
 * - sub_end: Subscription end date (NULL for lifetime)
 * - is_active: Current subscription status
 * - auto_renew: Auto-renewal flag
 * - cancelled_at: Cancellation timestamp
 */

const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');

class Subscription {
    constructor(subscriptionData) {
        this.id = subscriptionData.id;
        this.userId = subscriptionData.user_id;
        this.planId = subscriptionData.plan_id;
        this.paymentId = subscriptionData.payment_id;
        this.subscriptionType = subscriptionData.subscription_type;
        this.subStart = subscriptionData.sub_start;
        this.subEnd = subscriptionData.sub_end;
        this.isActive = subscriptionData.is_active !== false;
        this.autoRenew = subscriptionData.auto_renew !== false;
        this.cancelledAt = subscriptionData.cancelled_at;
        this.createdAt = subscriptionData.created_at;
        this.updatedAt = subscriptionData.updated_at;
    }

    /**
     * FIND ALL SUBSCRIPTIONS - ADMIN OVERVIEW
     * Retrieves all subscriptions for administrative management
     */
    static async findAll() {
        try {
            const query = `
                SELECT s.*, p.name as plan_name, u.email as user_email,
                       CONCAT(u.given_name, ' ', u.family_name) as user_name
                FROM subscriptions s
                LEFT JOIN plans p ON s.plan_id = p.id
                LEFT JOIN users u ON s.user_id = u.user_id
                ORDER BY s.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Subscription(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND SUBSCRIPTION BY ID
     * Retrieves specific subscription by ID
     */
    static async findById(id) {
        try {
            const query = `
                SELECT s.*, p.name as plan_name, u.email as user_email,
                       CONCAT(u.given_name, ' ', u.family_name) as user_name
                FROM subscriptions s
                LEFT JOIN plans p ON s.plan_id = p.id
                LEFT JOIN users u ON s.user_id = u.user_id
                WHERE s.id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Subscription(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND SUBSCRIPTIONS BY USER ID
     * Retrieves all subscriptions for a specific user
     */
    static async findByUserId(userId) {
        try {
            if (!userId || !isValidUUID(userId)) {
                throw new Error('Invalid user ID format');
            }

            const query = `
                SELECT s.*, p.name as plan_name
                FROM subscriptions s
                LEFT JOIN plans p ON s.plan_id = p.id
                WHERE s.user_id = $1
                ORDER BY s.created_at DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Subscription(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET USER'S ACTIVE SUBSCRIPTION
     * Retrieves the current active subscription for a user
     */
    static async getUserActiveSubscription(userId) {
        try {
            if (!userId || !isValidUUID(userId)) {
                throw new Error('Invalid user ID format');
            }

            const query = `
                SELECT s.*, p.name as plan_name, p.description as plan_description,
                       p.features as plan_features
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                WHERE s.user_id = $1 
                AND s.is_active = true
                AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
                ORDER BY s.created_at DESC
                LIMIT 1
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Subscription(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET EXPIRING SUBSCRIPTIONS
     * Retrieves subscriptions that are expiring within specified days
     */
    static async getExpiringSubscriptions(daysAhead = 7) {
        try {
            const query = `
                SELECT s.*, p.name as plan_name, u.email as user_email,
                       CONCAT(u.given_name, ' ', u.family_name) as user_name
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                JOIN users u ON s.user_id = u.user_id
                WHERE s.is_active = true
                AND s.sub_end IS NOT NULL
                AND s.sub_end BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${daysAhead} days'
                ORDER BY s.sub_end ASC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Subscription(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * CREATE SUBSCRIPTION
     * Creates a new subscription with automatic end date calculation
     */
    static async createSubscription(subscriptionData) {
        try {
            const { userId, planId, paymentId, subscriptionType } = subscriptionData;

            // Validate required fields
            if (!userId || !isValidUUID(userId)) {
                throw new Error('Invalid user ID format');
            }
            if (!planId || typeof planId !== 'number') {
                throw new Error('Invalid plan ID');
            }
            if (!['monthly', 'yearly', 'lifetime'].includes(subscriptionType)) {
                throw new Error('Invalid subscription type');
            }

            // Calculate end date based on subscription type
            let subEnd = null;
            if (subscriptionType === 'monthly') {
                subEnd = new Date();
                subEnd.setMonth(subEnd.getMonth() + 1);
            } else if (subscriptionType === 'yearly') {
                subEnd = new Date();
                subEnd.setFullYear(subEnd.getFullYear() + 1);
            }
            // For lifetime, subEnd remains null

            const query = `
                INSERT INTO subscriptions (
                    user_id, plan_id, payment_id, subscription_type, 
                    sub_start, sub_end, is_active, auto_renew
                )
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, true, $6)
                RETURNING *
            `;
            
            const values = [
                userId,
                planId,
                paymentId,
                subscriptionType,
                subEnd,
                subscriptionType !== 'lifetime' // Auto-renew disabled for lifetime
            ];
            
            const result = await pool.query(query, values);
            return new Subscription(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * UPDATE SUBSCRIPTION
     * Updates existing subscription data
     */
    async update(updateData) {
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;

            // Build dynamic update query
            if (updateData.planId !== undefined) {
                updates.push(`plan_id = $${paramCount++}`);
                values.push(updateData.planId);
            }
            if (updateData.subscriptionType !== undefined) {
                updates.push(`subscription_type = $${paramCount++}`);
                values.push(updateData.subscriptionType);
            }
            if (updateData.subEnd !== undefined) {
                updates.push(`sub_end = $${paramCount++}`);
                values.push(updateData.subEnd);
            }
            if (updateData.isActive !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(updateData.isActive);
            }
            if (updateData.autoRenew !== undefined) {
                updates.push(`auto_renew = $${paramCount++}`);
                values.push(updateData.autoRenew);
            }
            if (updateData.cancelledAt !== undefined) {
                updates.push(`cancelled_at = $${paramCount++}`);
                values.push(updateData.cancelledAt);
            }

            if (updates.length === 0) {
                return this;
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(this.id);

            const query = `
                UPDATE subscriptions 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            
            if (result.rows.length > 0) {
                const updated = result.rows[0];
                Object.assign(this, {
                    planId: updated.plan_id,
                    subscriptionType: updated.subscription_type,
                    subEnd: updated.sub_end,
                    isActive: updated.is_active,
                    autoRenew: updated.auto_renew,
                    cancelledAt: updated.cancelled_at,
                    updatedAt: updated.updated_at
                });
            }

            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * CANCEL SUBSCRIPTION
     * Cancels the subscription and sets cancellation timestamp
     */
    async cancel() {
        try {
            const query = `
                UPDATE subscriptions 
                SET is_active = false, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [this.id]);
            
            if (result.rows.length > 0) {
                this.isActive = false;
                this.cancelledAt = result.rows[0].cancelled_at;
                this.updatedAt = result.rows[0].updated_at;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * DEACTIVATE USER'S ACTIVE SUBSCRIPTIONS
     * Deactivates all active subscriptions for a user (before creating new one)
     */
    static async deactivateUserSubscriptions(userId) {
        try {
            if (!userId || !isValidUUID(userId)) {
                throw new Error('Invalid user ID format');
            }

            const query = `
                UPDATE subscriptions 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND is_active = true
                RETURNING *
            `;
            
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Subscription(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * EXPIRE SUBSCRIPTIONS
     * Marks expired subscriptions as inactive
     */
    static async expireSubscriptions() {
        try {
            const query = `
                UPDATE subscriptions 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE is_active = true 
                AND sub_end IS NOT NULL 
                AND sub_end <= CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const result = await pool.query(query);
            return result.rows.map(row => new Subscription(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * INSTANCE METHODS
     */

    /**
     * Check if subscription is expired
     */
    isExpired() {
        if (!this.subEnd) return false; // Lifetime subscription never expires
        return new Date() > new Date(this.subEnd);
    }

    /**
     * Get days until expiry
     */
    daysUntilExpiry() {
        if (!this.subEnd) return null; // Lifetime subscription
        const now = new Date();
        const endDate = new Date(this.subEnd);
        const diffTime = endDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if subscription is currently active and not expired
     */
    isCurrent() {
        if (!this.isActive) return false;
        if (!this.subEnd) return true; // Lifetime subscription
        return new Date() < new Date(this.subEnd);
    }

    /**
     * CONVERT TO JSON
     * Clean JSON representation for API responses
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            planId: this.planId,
            paymentId: this.paymentId,
            subscriptionType: this.subscriptionType,
            subStart: this.subStart,
            subEnd: this.subEnd,
            isActive: this.isActive,
            autoRenew: this.autoRenew,
            cancelledAt: this.cancelledAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            // Include computed properties
            isExpired: this.isExpired(),
            daysUntilExpiry: this.daysUntilExpiry(),
            isCurrent: this.isCurrent()
        };
    }

    /**
     * EXTEND SUBSCRIPTION
     * Extends current subscription by adding time to end date
     */
    async extend(additionalMonths) {
        try {
            if (!this.isActive || this.isExpired()) {
                throw new Error('Cannot extend inactive or expired subscription');
            }

            let newEndDate;
            if (this.subEnd) {
                // Extend from current end date
                newEndDate = new Date(this.subEnd);
                newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);
            } else {
                // Lifetime subscription - no extension needed
                throw new Error('Lifetime subscriptions cannot be extended');
            }

            const query = `
                UPDATE subscriptions 
                SET sub_end = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [newEndDate, this.id]);
            
            if (result.rows.length > 0) {
                this.subEnd = result.rows[0].sub_end;
                this.updatedAt = result.rows[0].updated_at;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * CHECK IF USER CAN UPGRADE
     * Validates upgrade rules based on current subscription
     */
    static async canUserUpgrade(userId, targetPlanName) {
        try {
            const activeSubscription = await this.getUserActiveSubscription(userId);
            
            if (!activeSubscription) {
                return { canUpgrade: true, reason: 'No active subscription' };
            }

            // Get current plan details
            const Plan = require('./Plan');
            const currentPlan = await Plan.findById(activeSubscription.planId);
            const targetPlan = await Plan.getPlanByName(targetPlanName);

            if (!currentPlan || !targetPlan) {
                return { canUpgrade: false, reason: 'Invalid plan configuration' };
            }

            // Rule 1: No upgrades allowed for active subscriptions (except lifetime Premium to Ultimate)
            if (currentPlan.name !== targetPlan.name) {
                // Special case: lifetime Premium can upgrade to Ultimate
                if (currentPlan.name === 'Premium' && 
                    activeSubscription.subscriptionType === 'lifetime' && 
                    targetPlan.name === 'Ultimate') {
                    return { canUpgrade: true, reason: 'Lifetime Premium can upgrade to Ultimate' };
                }
                
                return { 
                    canUpgrade: false, 
                    reason: `Cannot upgrade from ${currentPlan.name} to ${targetPlan.name}. Wait for current subscription to expire or cancel manually.`,
                    currentPlan: currentPlan.name,
                    targetPlan: targetPlan.name,
                    currentSubscription: activeSubscription
                };
            }

            // Same plan - extension is allowed
            return { canUpgrade: true, reason: 'Extension of current plan allowed' };

        } catch (error) {
            throw error;
        }
    }

    /**
     * GET FALLBACK SUBSCRIPTION
     * Gets the fallback subscription for when current subscription expires
     */
    static async getFallbackSubscription(userId) {
        try {
            // Look for lifetime Premium subscription
            const query = `
                SELECT s.*, p.name as plan_name
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                WHERE s.user_id = $1 
                AND p.name = 'Premium'
                AND s.subscription_type = 'lifetime'
                AND s.sub_end IS NULL
                ORDER BY s.created_at DESC
                LIMIT 1
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Subscription(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * ACTIVATE FALLBACK SUBSCRIPTION
     * Activates fallback subscription when current subscription expires
     */
    static async activateFallbackSubscription(userId) {
        try {
            const fallbackSubscription = await this.getFallbackSubscription(userId);
            
            if (!fallbackSubscription) {
                return null;
            }

            // Reactivate the lifetime Premium subscription
            const query = `
                UPDATE subscriptions 
                SET is_active = true, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [fallbackSubscription.id]);
            
            if (result.rows.length > 0) {
                fallbackSubscription.isActive = true;
                fallbackSubscription.updatedAt = result.rows[0].updated_at;
            }
            
            return fallbackSubscription;
        } catch (error) {
            throw error;
        }
    }

    /**
     * EXPIRE SUBSCRIPTIONS WITH FALLBACK
     * Enhanced expiration that handles lifetime Premium fallback
     */
    static async expireSubscriptionsWithFallback() {
        try {
            // Get subscriptions that are expiring
            const expiringQuery = `
                SELECT s.*, p.name as plan_name, u.user_id
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                JOIN users u ON s.user_id = u.user_id
                WHERE s.is_active = true 
                AND s.sub_end IS NOT NULL 
                AND s.sub_end <= CURRENT_TIMESTAMP
            `;
            const expiringResult = await pool.query(expiringQuery);
            
            const expiredSubscriptions = [];
            const reactivatedFallbacks = [];

            for (const row of expiringResult.rows) {
                const subscription = new Subscription(row);
                
                // Expire the current subscription
                await subscription.update({ isActive: false });
                expiredSubscriptions.push(subscription);

                // Check for fallback subscription
                if (row.plan_name === 'Ultimate') {
                    const fallback = await this.activateFallbackSubscription(row.user_id);
                    if (fallback) {
                        reactivatedFallbacks.push(fallback);
                    }
                }
            }

            return {
                expired: expiredSubscriptions,
                reactivated: reactivatedFallbacks
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * CHECK IF USER CAN UPGRADE SUBSCRIPTION
     * Implements the two subscription mechanisms
     */
    static async canUserUpgrade(userId, newPlanName) {
        try {
            if (!userId || !isValidUUID(userId)) {
                throw new Error('Invalid user ID format');
            }

            const currentSubscription = await this.getUserActiveSubscription(userId);
            
            if (!currentSubscription) {
                // No current subscription - can upgrade
                return { 
                    canUpgrade: true, 
                    reason: 'No existing subscription',
                    currentSubscription: null,
                    isExtension: false
                };
            }

            const currentPlan = await pool.query('SELECT * FROM plans WHERE id = $1', [currentSubscription.planId]);
            const currentPlanName = currentPlan.rows[0]?.name;
            
            // Mechanism 1: No upgrades allowed, only extensions
            if (currentPlanName === newPlanName) {
                return {
                    canUpgrade: true,
                    reason: 'Extension of current plan allowed',
                    currentSubscription: currentSubscription,
                    isExtension: true
                };
            }
            
            // Mechanism 2: Special case - lifetime Premium can upgrade to Ultimate
            if (currentPlanName === 'Premium' && 
                currentSubscription.subscriptionType === 'lifetime' && 
                newPlanName === 'Ultimate') {
                return {
                    canUpgrade: true,
                    reason: 'Lifetime Premium can upgrade to Ultimate with fallback',
                    currentSubscription: currentSubscription,
                    isExtension: false,
                    hasLifetimeFallback: true
                };
            }
            
            // Otherwise, no upgrades allowed until current expires
            return {
                canUpgrade: false,
                reason: 'Cannot upgrade active subscription. Please wait for expiration or cancel manually.',
                currentSubscription: currentSubscription,
                isExtension: false
            };
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * EXTEND EXISTING SUBSCRIPTION
     * Adds time to current subscription end date
     */
    static async extendSubscription(userId, subscriptionType, paymentId = null) {
        try {
            const currentSubscription = await this.getUserActiveSubscription(userId);
            if (!currentSubscription) {
                throw new Error('No active subscription to extend');
            }

            let extensionMonths = 0;
            if (subscriptionType === 'monthly') extensionMonths = 1;
            else if (subscriptionType === 'yearly') extensionMonths = 12;
            else if (subscriptionType === 'lifetime') {
                // Convert to lifetime - remove end date
                const query = `
                    UPDATE subscriptions 
                    SET sub_end = NULL, subscription_type = 'lifetime', payment_id = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING *
                `;
                const result = await pool.query(query, [paymentId, currentSubscription.id]);
                return new Subscription(result.rows[0]);
            }

            // Extend the end date
            const currentEnd = currentSubscription.subEnd ? new Date(currentSubscription.subEnd) : new Date();
            const newEnd = new Date(currentEnd);
            newEnd.setMonth(newEnd.getMonth() + extensionMonths);

            const query = `
                UPDATE subscriptions 
                SET sub_end = $1, payment_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await pool.query(query, [newEnd, paymentId, currentSubscription.id]);
            return new Subscription(result.rows[0]);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * CREATE SUBSCRIPTION WITH FALLBACK
     * Creates Ultimate subscription with lifetime Premium fallback
     */
    static async createSubscriptionWithFallback(subscriptionData) {
        try {
            const { userId, planId, paymentId, subscriptionType, fallbackSubscriptionId } = subscriptionData;

            // Mark the fallback subscription as inactive but keep it for later
            if (fallbackSubscriptionId) {
                await pool.query(
                    'UPDATE subscriptions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [fallbackSubscriptionId]
                );
            }

            // Create the new subscription with fallback reference
            const query = `
                INSERT INTO subscriptions (
                    user_id, plan_id, payment_id, subscription_type, 
                    sub_start, sub_end, is_active, auto_renew, fallback_subscription_id
                )
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, true, $6, $7)
                RETURNING *
            `;
            
            // Calculate end date
            let subEnd = null;
            if (subscriptionType === 'monthly') {
                subEnd = new Date();
                subEnd.setMonth(subEnd.getMonth() + 1);
            } else if (subscriptionType === 'yearly') {
                subEnd = new Date();
                subEnd.setFullYear(subEnd.getFullYear() + 1);
            }
            
            const values = [
                userId,
                planId,
                paymentId,
                subscriptionType,
                subEnd,
                subscriptionType !== 'lifetime',
                fallbackSubscriptionId
            ];
            
            const result = await pool.query(query, values);
            return new Subscription(result.rows[0]);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * HANDLE SUBSCRIPTION EXPIRATION WITH FALLBACK
     * When Ultimate expires, reactivate lifetime Premium if it exists
     */
    static async handleExpirationWithFallback() {
        try {
            // Find expired subscriptions that have fallbacks
            const query = `
                SELECT s.*, fb.id as fallback_id, fb.user_id as fallback_user_id,
                       p.name as plan_name, fb_plan.name as fallback_plan_name
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                LEFT JOIN subscriptions fb ON s.fallback_subscription_id = fb.id
                LEFT JOIN plans fb_plan ON fb.plan_id = fb_plan.id
                WHERE s.is_active = true 
                AND s.sub_end IS NOT NULL 
                AND s.sub_end <= CURRENT_TIMESTAMP
                AND s.fallback_subscription_id IS NOT NULL
            `;
            
            const result = await pool.query(query);
            const expiredWithFallback = result.rows;
            
            for (const expired of expiredWithFallback) {
                // Deactivate expired subscription
                await pool.query(
                    'UPDATE subscriptions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [expired.id]
                );
                
                // Reactivate fallback subscription
                if (expired.fallback_id) {
                    await pool.query(
                        'UPDATE subscriptions SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                        [expired.fallback_id]
                    );
                    
                    console.log(`[SUBSCRIPTION] Fallback activated: User ${expired.user_id} reverted to ${expired.fallback_plan_name}`);
                }
            }
            
            // Handle regular expirations without fallback
            const regularExpired = await this.expireSubscriptions();
            
            return {
                expiredWithFallback: expiredWithFallback.length,
                regularExpired: regularExpired.length
            };
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * VALIDATION METHODS
     */
    static validateSubscriptionType(type) {
        if (!['monthly', 'yearly', 'lifetime'].includes(type)) {
            throw new Error('Subscription type must be monthly, yearly, or lifetime');
        }
        return true;
    }

    static validateDates(startDate, endDate) {
        if (endDate && new Date(endDate) <= new Date(startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }
}

module.exports = Subscription;