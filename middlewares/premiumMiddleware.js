/**
 * ============================================================================
 * PREMIUM ACCESS MIDDLEWARE
 * ============================================================================
 * 
 * Middleware to check if user has premium access (Premium or Admin role)
 * Used for protecting premium-only features like AI services
 */

/**
 * Middleware to check if the user has premium access
 * Premium access includes both Premium and Admin roles
 */
const isPremium = (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required' 
        });
    }
    
    console.log('[PREMIUM MIDDLEWARE] Checking premium access for user:', {
        user_id: req.user.user_id,
        role: req.user.role
    });
    
    // Check if user has premium access (Premium or Admin role)
    if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Premium access required. Please upgrade your account to access AI features.',
            code: 'PREMIUM_REQUIRED'
        });
    }
    
    console.log('[PREMIUM MIDDLEWARE] Premium access granted for user:', req.user.user_id);
    next();
};

/**
 * Middleware to check if the user is Premium (not Admin)
 * Used for features that are specifically for Premium users only
 */
const isPremiumOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required' 
        });
    }
    
    if (req.user.role !== 'Premium') {
        return res.status(403).json({ 
            success: false,
            error: 'Premium subscription required',
            code: 'PREMIUM_SUBSCRIPTION_REQUIRED'
        });
    }
    
    next();
};

/**
 * Middleware that adds premium status to response
 * Used for conditional features based on premium status  
 */
const addPremiumStatus = (req, res, next) => {
    if (req.user) {
        req.user.isPremium = req.user.role === 'Premium' || req.user.role === 'Admin';
        req.user.isAdmin = req.user.role === 'Admin';
    }
    
    next();
};

module.exports = {
    isPremium,
    isPremiumOnly,
    addPremiumStatus
};