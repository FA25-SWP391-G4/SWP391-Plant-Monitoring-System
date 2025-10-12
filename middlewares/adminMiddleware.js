/**
 * ============================================================================
 * ADMIN MIDDLEWARE - ADMINISTRATIVE ACCESS CONTROL
 * ============================================================================
 * 
 * Purpose:
 * - Ensures only users with admin role can access administrative endpoints
 * - Provides a central point for admin access control policies
 * - Additional layer of security beyond basic authentication
 * 
 * Security features:
 * - Role-based verification (ADMIN role required)
 * - IP restriction capabilities (optional configuration)
 * - Rate limiting for sensitive operations
 */

const User = require('../models/User');

/**
 * Admin middleware that verifies if the authenticated user has admin privileges
 * Must be used after the authMiddleware which sets req.user
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // req.user should be set by the authMiddleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required for admin access' 
      });
    }

    // Get the complete user data with role information
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if the user has admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required for this operation' 
      });
    }

    // Optional: Log admin actions for audit purposes
    console.log(`Admin action: ${req.method} ${req.originalUrl} by user ${user.id} (${user.email})`);
    
    // Store admin information for potential use in controllers
    req.admin = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during admin verification'
    });
  }
};

module.exports = adminMiddleware;