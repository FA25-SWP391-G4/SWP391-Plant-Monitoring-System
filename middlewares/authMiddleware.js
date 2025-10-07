/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * 
 * This middleware verifies JWT tokens and attaches the user to the request
 * Used for protecting routes that require authentication
 * 
 * SUPPORTS THESE USE CASES:
 * - UC2: User Login - JWT token validation
 * - UC3: User Logout - Token validation before logout
 * - UC12: Change Password - Authenticated access
 * - UC13: Manage Profile - Authenticated access
 * - UC19: Upgrade to Premium - Authenticated access
 * - All other authenticated routes
 * 
 * SECURITY FEATURES:
 * - JWT token verification
 * - User lookup for each request
 * - Bearer token extraction
 * - Proper error handling
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 */
async function authMiddleware(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required. No token provided.' 
            });
        }
        
        // Extract token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required. Invalid token format.' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from decoded token
        const user = await User.findById(decoded.user_id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found. Token may be invalid.' 
            });
        }
        
        // Attach user to request
        req.user = user;
        
        // Proceed to next middleware/route handler
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Authentication error' 
        });
    }
}

module.exports = authMiddleware;
