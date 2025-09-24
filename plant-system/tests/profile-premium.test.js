/**
 * ============================================================================
 * PROFILE MANAGEMENT & PREMIUM UPGRADE TESTS
 * ============================================================================
 * 
 * This test suite covers:
 * - UC13: Profile Management - View/edit user info
 * - UC19: Upgrade to Premium - Role upgrade after payment
 * 
 * All tests use mock data and don't rely on actual database connections
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../models/Payment');
jest.mock('bcryptjs');

// Import mocked models
const User = require('../models/User');
const Payment = require('../models/Payment');

// Create Express app instance for testing
const express = require('express');
const app = express();
app.use(express.json());

// Import and mount routes
const authMiddleware = require('../middlewares/authMiddleware');
const userRoutes = require('../routes/users');
app.use('/users', userRoutes);

// Mock user data
const mockUser = {
  user_id: 1,
  email: 'test@example.com',
  password: 'hashedPassword123',
  full_name: 'Test User',
  role: 'Regular',
  notification_prefs: { email: true, push: false },
  created_at: new Date().toISOString(),
  toJSON: function() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  },
  update: jest.fn(),
  updatePassword: jest.fn()
};

// Mock payment data
const mockPayment = {
  payment_id: 1,
  user_id: 1,
  vnpay_txn_ref: 'TXN123456',
  amount: 299000,
  status: 'completed',
  created_at: new Date().toISOString()
};

// Mock JWT and auth middleware
jest.mock('jsonwebtoken');
jest.mock('../middlewares/authMiddleware', () => {
  return (req, res, next) => {
    req.user = mockUser;
    next();
  };
});

describe('Profile Management', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /users/profile', () => {
    it('should get user profile successfully', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      const response = await request(app).get('/users/profile');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser.toJSON());
      expect(User.findById).toHaveBeenCalledWith(mockUser.user_id);
    });
    
    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);
      
      const response = await request(app).get('/users/profile');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
    
    it('should handle server errors', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/users/profile');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve user profile');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, full_name: 'Updated Name' };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue(updatedUser);
      
      const response = await request(app)
        .put('/users/profile')
        .send({ full_name: 'Updated Name' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(mockUser.update).toHaveBeenCalledWith({ full_name: 'Updated Name' });
    });
    
    it('should update notification preferences', async () => {
      const updatedPrefs = { email: false, push: true };
      const updatedUser = { ...mockUser, notification_prefs: updatedPrefs };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue(updatedUser);
      
      const response = await request(app)
        .put('/users/profile')
        .send({ notification_prefs: updatedPrefs });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUser.update).toHaveBeenCalledWith({ notification_prefs: updatedPrefs });
    });
    
    it('should handle user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);
      
      const response = await request(app)
        .put('/users/profile')
        .send({ full_name: 'Updated Name' });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /users/change-password', () => {
    beforeEach(() => {
      bcrypt.compare = jest.fn().mockResolvedValue(true);
    });
    
    it('should change password successfully', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);
      mockUser.updatePassword.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .put('/users/change-password')
        .send({ 
          currentPassword: 'oldPassword123', 
          newPassword: 'newPassword456' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', mockUser.password);
      expect(mockUser.updatePassword).toHaveBeenCalledWith('newPassword456');
    });
    
    it('should reject if current password is incorrect', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      
      const response = await request(app)
        .put('/users/change-password')
        .send({ 
          currentPassword: 'wrongPassword', 
          newPassword: 'newPassword456' 
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
      expect(mockUser.updatePassword).not.toHaveBeenCalled();
    });
    
    it('should validate password requirements', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      const response = await request(app)
        .put('/users/change-password')
        .send({ 
          currentPassword: 'oldPassword123', 
          newPassword: 'short' 
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New password must be at least 8 characters long');
      expect(mockUser.updatePassword).not.toHaveBeenCalled();
    });
  });
});

describe('Premium Upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Payment.findById = jest.fn().mockResolvedValue(mockPayment);
  });
  
  describe('POST /users/upgrade-to-premium', () => {
    it('should upgrade user to premium successfully', async () => {
      const upgradedUser = { ...mockUser, role: 'Premium' };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue(upgradedUser);
      
      const response = await request(app)
        .post('/users/upgrade-to-premium')
        .send({ paymentId: 1 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully upgraded to Premium');
      expect(mockUser.update).toHaveBeenCalledWith({ role: 'Premium' });
    });
    
    it('should reject if payment not found', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser);
      Payment.findById = jest.fn().mockResolvedValue(null);
      
      const response = await request(app)
        .post('/users/upgrade-to-premium')
        .send({ paymentId: 999 });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment not found');
      expect(mockUser.update).not.toHaveBeenCalled();
    });
    
    it('should reject if payment belongs to another user', async () => {
      const differentUserPayment = { ...mockPayment, user_id: 2 };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      Payment.findById = jest.fn().mockResolvedValue(differentUserPayment);
      
      const response = await request(app)
        .post('/users/upgrade-to-premium')
        .send({ paymentId: 1 });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment does not belong to this user');
    });
    
    it('should reject if payment is not completed', async () => {
      const pendingPayment = { ...mockPayment, status: 'pending' };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      Payment.findById = jest.fn().mockResolvedValue(pendingPayment);
      
      const response = await request(app)
        .post('/users/upgrade-to-premium')
        .send({ paymentId: 1 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment has not been completed');
    });
    
    it('should reject if user is already premium', async () => {
      const premiumUser = { ...mockUser, role: 'Premium' };
      User.findById = jest.fn().mockResolvedValue(premiumUser);
      
      const response = await request(app)
        .post('/users/upgrade-to-premium')
        .send({ paymentId: 1 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User already has Premium or higher privileges');
    });
  });
  
  describe('GET /users/premium-status', () => {
    it('should return regular status for non-premium users', async () => {
      User.findById = jest.fn().mockResolvedValue(mockUser); // Regular user
      
      const response = await request(app).get('/users/premium-status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        isPremium: false,
        role: 'Regular',
        premiumFeatures: []
      });
    });
    
    it('should return premium status and features for premium users', async () => {
      const premiumUser = { ...mockUser, role: 'Premium' };
      User.findById = jest.fn().mockResolvedValue(premiumUser);
      
      const response = await request(app).get('/users/premium-status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPremium).toBe(true);
      expect(response.body.data.role).toBe('Premium');
      expect(response.body.data.premiumFeatures.length).toBeGreaterThan(0);
    });
    
    it('should handle user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);
      
      const response = await request(app).get('/users/premium-status');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });
});
