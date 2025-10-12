/**
 * User Model Mock
 */
const bcrypt = require('bcryptjs');

// Mock User model for testing
class User {
    constructor(userData) {
        this.user_id = userData.user_id;
        this.email = userData.email ? userData.email.toLowerCase() : null;
        this.password = userData.password_hash || userData.password;
        this.full_name = userData.full_name;
        this.role = userData.role || 'Regular';
        this.notification_prefs = userData.notification_prefs || {};
        this.fcm_tokens = userData.fcm_tokens || []; 
        this.passwordResetToken = userData.password_reset_token;
        this.passwordResetExpires = userData.password_reset_expires;
        this.languagePreference = userData.language_preference || 'en';
        this.created_at = userData.created_at;
    }

    // Instance methods
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    async save() {
        return { user_id: this.user_id, email: this.email };
    }
    
    updatePasswordResetFields(token = null, expires = null) {
        this.passwordResetToken = token;
        this.passwordResetExpires = expires;
        return Promise.resolve(this);
    }
    
    createPasswordResetToken() {
        const resetToken = 'mock-reset-token';
        this.passwordResetToken = resetToken;
        this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        return resetToken;
    }

    createPasswordResetToken() {
        this.passwordResetToken = 'mock-reset-token';
        this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        return this.passwordResetToken;
    }

    async updatePassword(newPassword) {
        this.password = await bcrypt.hash(newPassword, 12);
        this.passwordResetToken = null;
        this.passwordResetExpires = null;
        return true;
    }

    async updatePasswordResetFields(token, expires) {
        this.passwordResetToken = token;
        this.passwordResetExpires = expires;
        return true;
    }

    toJSON() {
        const { password, passwordResetToken, passwordResetExpires, ...userObject } = this;
        return userObject;
    }

    async hashPassword(password) {
        if (!password) return this.password;
        return await bcrypt.hash(password, 12);
    }

    // Static methods
    static async findByEmail(email) {
        // This would be replaced by the jest.mock in tests
        return new User({
            user_id: 1,
            email: email.toLowerCase(),
            full_name: 'Test User',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO',
            role: 'Regular'
        });
    }

    static async findById(userId) {
        // This would be replaced by the jest.mock in tests
        return new User({
            user_id: userId,
            email: 'test@example.com',
            full_name: 'Test User',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO',
            role: 'Regular'
        });
    }

    static async findByResetToken(token) {
        // This would be replaced by the jest.mock in tests
        return new User({
            user_id: 1,
            email: 'test@example.com',
            full_name: 'Test User',
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO',
            password_reset_token: token,
            password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
            role: 'Regular'
        });
    }
}

module.exports = User;