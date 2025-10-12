/**
 * User Model Mock
 */
const bcrypt = require('bcryptjs');

// Mock User constructor
function UserConstructor(userData) {
  this.user_id = userData.user_id;
  this.email = userData.email?.toLowerCase();
  this.password = userData.password_hash || userData.password;
  this.full_name = userData.full_name;
  this.role = userData.role || 'Regular';
  this.notification_prefs = userData.notification_prefs || {};
  this.passwordResetToken = userData.password_reset_token;
  this.passwordResetExpires = userData.password_reset_expires;
  this.created_at = userData.created_at;
  
  this.validatePassword = jest.fn().mockResolvedValue(true);
  this.createPasswordResetToken = jest.fn().mockImplementation(() => {
    const token = 'mock-reset-token';
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    return token;
  });
  this.updatePasswordResetFields = jest.fn().mockImplementation((token, expires) => {
    this.passwordResetToken = token;
    this.passwordResetExpires = expires;
    return Promise.resolve(this);
  });
  this.updatePassword = jest.fn().mockImplementation(async (newPassword) => {
    this.password = '$2b$12$mockHashedPassword';
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
    return this;
  });
  this.hashPassword = jest.fn().mockImplementation((password) => {
    if (!password) return this.password;
    return Promise.resolve('$2b$12$mockHashedPassword');
  });
  this.save = jest.fn().mockImplementation(() => Promise.resolve(this));
  this.toJSON = jest.fn().mockImplementation(() => {
    const { password, passwordResetToken, ...publicData } = this;
    return publicData;
  });
}

// Mock User model for testing
const User = {
  constructor: UserConstructor,
  async findByEmail(email) {
    // Trigger a database query for testing
    const lowercaseEmail = email.toLowerCase();
    
    // Check for error case first
    if (email === 'error@example.com') {
      throw new Error('Database connection failed');
    }
    
    // For normal cases, record the query call
    require('../config/db').pool.query('SELECT * FROM Users WHERE email = $1', [lowercaseEmail]);
    
    if (lowercaseEmail === 'nonexistent@example.com') {
      return null;
    }
    
    return {
      user_id: 1,
      email: lowercaseEmail,
      full_name: 'Test User',
      validatePassword: jest.fn().mockResolvedValue(true),
      createPasswordResetToken: jest.fn(),
      updatePasswordResetFields: jest.fn(),
      updatePassword: jest.fn(),
      save: jest.fn()
    };
  },
  
  async findById(userId) {
    // Trigger a database query for testing
    require('../config/db').pool.query('SELECT * FROM Users WHERE user_id = $1', [userId]);
    
    if (userId === 999) {
      return null;
    }
    
    return {
      user_id: userId,
      email: 'test@example.com',
      full_name: 'Test User',
      validatePassword: jest.fn(),
      createPasswordResetToken: jest.fn(),
      updatePasswordResetFields: jest.fn(),
      updatePassword: jest.fn(),
      save: jest.fn()
    };
  },
  
  async findByResetToken(token) {
    // Trigger a database query for testing
    require('../config/db').pool.query(
      'SELECT * FROM Users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', 
      [token]
    );
    
    if (token === 'expired-token') {
      return null;
    }
    
    return {
      user_id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      validatePassword: jest.fn(),
      createPasswordResetToken: jest.fn(),
      updatePasswordResetFields: jest.fn(),
      updatePassword: jest.fn(),
      save: jest.fn()
    };
  }
};

// Add constructor to User
const UserModule = function(userData) {
  return new UserConstructor(userData);
};

// Copy all properties from User to UserModule
Object.assign(UserModule, User);

module.exports = UserModule;