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
const { isValidUUID } = require('../utils/uuidGenerator');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
    console.log('\n=== AUTH MIDDLEWARE START ===');
    console.log('[AUTH MIDDLEWARE] Request URL:', req.url);
    console.log('[AUTH MIDDLEWARE] Request method:', req.method);
    console.log('[AUTH MIDDLEWARE] Request headers:');
    console.log('  - Authorization:', req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'MISSING');
    console.log('  - Cookie:', req.headers.cookie || 'MISSING');
    console.log('  - User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...' || 'MISSING');
    
    try {
        // Get token from Authorization header OR cookies
        const authHeader = req.headers.authorization;
        let token = null;
        
        console.log('[AUTH MIDDLEWARE] Token source validation:');
        console.log('  - Auth header exists:', !!authHeader);
        console.log('  - Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));
        
        // Try Authorization header first
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('[AUTH MIDDLEWARE] ✅ Token found in Authorization header');
        } else {
            // Fallback to cookies
            console.log('[AUTH MIDDLEWARE] No valid Authorization header, checking cookies...');
            
            // Parse cookie header for token
            const cookieHeader = req.headers.cookie;
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {});
                
                token = cookies.token;
                console.log('[AUTH MIDDLEWARE] Cookie parsing result:');
                console.log('  - Cookies found:', Object.keys(cookies));
                console.log('  - Token in cookies:', !!token);
                
                if (token) {
                    console.log('[AUTH MIDDLEWARE] ✅ Token found in cookies');
                }
            }
        }
        
        if (!token) {
            console.log('[AUTH MIDDLEWARE] ❌ No token found in Authorization header or cookies');
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required. No token provided.' 
            });
        }
        
        console.log('[AUTH MIDDLEWARE] Token extraction:');
        console.log('  - Token length:', token?.length || 0);
        console.log('  - Token preview:', token ? `${token.substring(0, 20)}...` : 'MISSING');
        
        if (!token) {
            console.log('[AUTH MIDDLEWARE] ❌ Token extraction failed');
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required. Invalid token format.' 
            });
        }
        
        // Verify token
        console.log('[AUTH MIDDLEWARE] Verifying JWT token...');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[AUTH MIDDLEWARE] ✅ Token verification successful');
            console.log('  - User ID:', decoded.user_id);
            console.log('  - Email:', decoded.email);
            console.log('  - Role:', decoded.role);
            console.log('  - Issued at:', new Date(decoded.iat * 1000).toISOString());
            console.log('  - Expires at:', new Date(decoded.exp * 1000).toISOString());
        } catch (jwtError) {
            console.log('[AUTH MIDDLEWARE] ❌ Token verification failed:', jwtError.message);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid or expired token. Please log in again.' 
            });
        }
        
        // Validate UUID format from token
        if (!decoded.user_id || !isValidUUID(decoded.user_id)) {
            console.error('[AUTH MIDDLEWARE] ❌ Invalid user_id UUID in token:', decoded.user_id);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token format. Please log in again.' 
            });
        }
        
        console.log('[AUTH MIDDLEWARE] Looking up user in database...');
        
        // Find user by ID from decoded token
        const user = await User.findById(decoded.user_id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found. Token may be invalid.' 
            });
        }

        // Attach user to request object
        req.user = {
            userId: user.user_id || decoded.user_id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        console.log('[AUTH MIDDLEWARE] User authenticated:', req.user.username);
        
        // Attach user to request and include JWT decoded fields
        req.user = {
            ...user,
            family_name: decoded.family_name || user.family_name,
            given_name: decoded.given_name || user.given_name,
            full_name: decoded.full_name || user.fullName
        };
        
        console.log('User data attached to request:', {
            user_id: req.user.user_id,
            email: req.user.email,
            family_name: req.user.family_name,
            given_name: req.user.given_name,
            full_name: req.user.full_name
        });
        
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

/**
 * Middleware to check if the user is an admin
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required' 
        });
    }
    
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Admin access required' 
        });
    }
    
    next();
}

// Export the middleware functions
const auth = authMiddleware;
module.exports = auth;
module.exports.verifyToken = authMiddleware; // Add this alias for compatibility
module.exports.authMiddleware = authMiddleware;
module.exports.isAdmin = isAdmin;

