/**
 * AI Service Authentication Configuration
 * Middleware for JWT authentication in AI service
 */

const jwt = require('jsonwebtoken');

// AI Service Authentication Middleware
const aiAuthMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    // Verify token using same secret as main backend
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plant-monitoring-secret-key');
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Premium User Check Middleware
const aiPremiumMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isPremium) {
    return res.status(403).json({
      success: false,
      error: 'Premium subscription required for AI features',
      code: 'PREMIUM_REQUIRED'
    });
  }
  next();
};

// Optional Authentication (for test endpoints)
const aiOptionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
      }
    }
    
    // Continue regardless of auth status
    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

module.exports = {
  aiAuthMiddleware,
  aiPremiumMiddleware,
  aiOptionalAuthMiddleware
};