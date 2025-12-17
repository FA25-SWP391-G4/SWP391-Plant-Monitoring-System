/**
 * ============================================================================
 * ACCESS CONTROL MIDDLEWARE
 * ============================================================================
 * 
 * Comprehensive middleware for role-based access control
 * Supports: Admin, Premium, Ultimate roles with different access levels
 */

/**
 * Middleware to check if the user has Admin access
 * Admin role has access to all features
 */
const isAdmin = (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    console.log('[ADMIN MIDDLEWARE] Checking admin access for user:', {
        user_id: req.user.user_id,
        role: req.user.role
    });
    
    // Check if user has admin access
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Admin access required. This feature is restricted to administrators.',
            code: 'ADMIN_REQUIRED'
        });
    }
    
    console.log('[ADMIN MIDDLEWARE] Admin access granted for user:', req.user.user_id);
    next();
};

/**
 * Middleware to check if the user has Premium access
 * Premium role has access to premium features (but not Ultimate features like AI)
 */
const isPremium = (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    console.log('[PREMIUM MIDDLEWARE] Checking premium access for user:', {
        user_id: req.user.user_id,
        role: req.user.role,
        roleType: typeof req.user.role
    });
    
    // Ensure role is a string and trim whitespace
    const userRole = String(req.user.role || '').trim();
    const allowedRoles = ['Premium', 'Ultimate', 'Admin'];
    
    // Check if user has premium access (Premium, Ultimate, or Admin)
    if (!allowedRoles.includes(userRole)) {
        console.log('[PREMIUM MIDDLEWARE] Access denied. User role:', userRole, 'Allowed:', allowedRoles);
        return res.status(403).json({ 
            success: false,
            error: 'Premium subscription required. Please upgrade your account to access premium features.',
            code: 'PREMIUM_REQUIRED'
        });
    }
    
    console.log('[PREMIUM MIDDLEWARE] Premium access granted for user:', req.user.user_id, 'with role:', userRole);
    next();
};

/**
 * Middleware to check if the user has Ultimate access
 * Ultimate role has access to AI features and all premium features
 */
const isUltimate = (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    console.log('[ULTIMATE MIDDLEWARE] Checking Ultimate access for user:', {
        user_id: req.user.user_id,
        role: req.user.role
    });
    
    // Check if user has Ultimate access (Ultimate or Admin only)
    if (!['Ultimate', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            error: 'Ultimate subscription required. Please upgrade your account to access AI features.',
            code: 'ULTIMATE_REQUIRED'
        });
    }
    
    console.log('[ULTIMATE MIDDLEWARE] Ultimate access granted for user:', req.user.user_id);
    next();
};

/**
 * Middleware to check if the user has Premium access (excluding Ultimate)
 * Used for features that are specifically for Premium tier only
 */
const isPremiumOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    if (req.user.role !== 'Premium') {
        return res.status(403).json({ 
            success: false,
            error: 'Premium subscription required (Premium tier only)',
            code: 'PREMIUM_ONLY_REQUIRED'
        });
    }
    
    next();
};

/**
 * Middleware to check if the user has Ultimate access (excluding Admin)
 * Used for features that are specifically for Ultimate tier only
 */
const isUltimateOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    if (req.user.role !== 'Ultimate') {
        return res.status(403).json({ 
            success: false,
            error: 'Ultimate subscription required (Ultimate tier only)',
            code: 'ULTIMATE_ONLY_REQUIRED'
        });
    }
    
    next();
};

/**
 * Middleware that adds role status flags to the user object
 * Used for conditional features based on role status
 */
const addRoleStatus = (req, res, next) => {
    if (req.user) {
        req.user.isRegular = req.user.role === 'Regular';
        req.user.isPremium = req.user.role === 'Premium';
        req.user.isUltimate = req.user.role === 'Ultimate';
        req.user.isAdmin = req.user.role === 'Admin';
        
        // Helper flags for access levels
        req.user.hasPremiumAccess = ['Premium', 'Ultimate', 'Admin'].includes(req.user.role);
        req.user.hasUltimateAccess = ['Ultimate', 'Admin'].includes(req.user.role);
        req.user.hasAdminAccess = req.user.role === 'Admin';
    }
    
    next();
};

/**
 * Combined middleware factory for checking multiple role requirements
 * Usage: requireRoles(['Premium', 'Ultimate']) or requireRoles(['Admin'])
 */
const requireRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            const roleNames = allowedRoles.join(', ');
            return res.status(403).json({ 
                success: false,
                error: `Access denied. Required roles: ${roleNames}`,
                code: 'INSUFFICIENT_ROLE'
            });
        }
        
        next();
    };
};

module.exports = {
    isAdmin,
    isPremium,
    isUltimate,
    isPremiumOnly,
    isUltimateOnly,
    addRoleStatus,
    requireRoles
};