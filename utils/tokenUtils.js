/**
 * Token utility functions for JWT generation and management
 */
const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with ID and role
 * @returns {string} JWT token
 */
function generateToken(user) {
    return jwt.sign(
        { 
            user_id: user.user_id,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
    );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload or throws error
 */
function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
    generateToken,
    verifyToken
};