const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middlewares/authMiddleware');
const User = require('../../../models/User');
const { isValidUUID } = require('../../../utils/uuidGenerator');

    /**
     * ============================================================================
     * UNIT TEST: Auth Middleware
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: middlewares/authMiddleware.js
     */


    // Mock dependencies
    jest.mock('jsonwebtoken');
    jest.mock('../../../models/User');
    jest.mock('../../../utils/uuidGenerator');

    describe('authMiddleware', () => {
      let req, res, next;

      beforeEach(() => {
        req = {
          headers: {},
          url: '/test',
          method: 'GET'
        };
        res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        next = jest.fn();
        
        // Clear console logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Reset mocks
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      describe('verifyToken()', () => {
        const mockUser = {
          user_id: 'test-uuid-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'User',
          family_name: 'Test',
          given_name: 'User'
        };

        const mockDecodedToken = {
          user_id: 'test-uuid-123',
          email: 'test@example.com',
          role: 'User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        };

        test('should allow request with valid token in Authorization header', async () => {
          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
          expect(User.findById).toHaveBeenCalledWith('test-uuid-123');
          expect(req.user).toBeDefined();
          expect(req.user.user_id).toBe('test-uuid-123');
          expect(next).toHaveBeenCalled();
        });

        test('should allow request with valid token in cookies', async () => {
          req.headers.cookie = 'token=valid-token; other=value';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
          expect(next).toHaveBeenCalled();
        });

        test('should allow request with token_client cookie', async () => {
          req.headers.cookie = 'token_client=valid-token; other=value';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
          expect(next).toHaveBeenCalled();
        });

        test('should reject request without token', async () => {
          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required. No token provided.'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject expired token', async () => {
          req.headers.authorization = 'Bearer expired-token';
          const expiredError = new Error('Token expired');
          expiredError.name = 'TokenExpiredError';
          jwt.verify.mockImplementation(() => { throw expiredError; });

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Token expired'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject invalid token', async () => {
          req.headers.authorization = 'Bearer invalid-token';
          const invalidError = new Error('Invalid token');
          invalidError.name = 'JsonWebTokenError';
          jwt.verify.mockImplementation(() => { throw invalidError; });

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid token'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject token with invalid UUID', async () => {
          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue({ ...mockDecodedToken, user_id: 'invalid-uuid' });
          isValidUUID.mockReturnValue(false);

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid token format. Please log in again.'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject when user not found', async () => {
          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(null);

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'User not found. Token may be invalid.'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should handle malformed Authorization header', async () => {
          req.headers.authorization = 'InvalidFormat token';

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required. No token provided.'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should handle database error gracefully', async () => {
          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockRejectedValue(new Error('Database error'));

          await authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication error'
          });
          expect(next).not.toHaveBeenCalled();
        });
      });

      describe('extractUserFromToken()', () => {
        test('should extract user data from token', async () => {
          const mockUser = {
            user_id: 'test-uuid-123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'Premium',
            family_name: 'Test',
            given_name: 'User'
          };

          const mockDecodedToken = {
            user_id: 'test-uuid-123',
            email: 'test@example.com',
            role: 'User', // Different from database role
            family_name: 'Test',
            given_name: 'User',
            full_name: 'Test User'
          };

          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(req.user).toMatchObject({
            user_id: 'test-uuid-123',
            userId: 'test-uuid-123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'Premium', // Should use database role, not token role
            family_name: 'Test',
            given_name: 'User',
            full_name: 'Test User'
          });
        });

        test('should handle missing user properties gracefully', async () => {
          const mockUser = {
            user_id: 'test-uuid-123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'User'
            // Missing family_name, given_name
          };

          const mockDecodedToken = {
            user_id: 'test-uuid-123',
            email: 'test@example.com',
            role: 'User'
            // Missing names
          };

          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(req.user.family_name).toBeUndefined();
          expect(req.user.given_name).toBeUndefined();
          expect(req.user.full_name).toBeUndefined();
        });

        test('should prioritize database user data over token data', async () => {
          const mockUser = {
            user_id: 'test-uuid-123',
            username: 'updateduser',
            email: 'updated@example.com',
            role: 'Admin',
            family_name: 'Updated',
            given_name: 'User'
          };

          const mockDecodedToken = {
            user_id: 'test-uuid-123',
            email: 'old@example.com',
            role: 'User',
            family_name: 'Old',
            given_name: 'User'
          };

          req.headers.authorization = 'Bearer valid-token';
          jwt.verify.mockReturnValue(mockDecodedToken);
          isValidUUID.mockReturnValue(true);
          User.findById.mockResolvedValue(mockUser);

          await authMiddleware(req, res, next);

          expect(req.user.username).toBe('updateduser');
          expect(req.user.email).toBe('updated@example.com');
          expect(req.user.role).toBe('Admin');
          expect(req.user.family_name).toBe('Updated');
        });
      });

      describe('isAdmin middleware', () => {
        test('should allow admin user to proceed', () => {
          req.user = { role: 'Admin' };

          authMiddleware.isAdmin(req, res, next);

          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        });

        test('should reject non-admin user', () => {
          req.user = { role: 'User' };

          authMiddleware.isAdmin(req, res, next);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Admin access required'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject request without user', () => {
          req.user = null;

          authMiddleware.isAdmin(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should reject premium user trying to access admin route', () => {
          req.user = { role: 'Premium' };

          authMiddleware.isAdmin(req, res, next);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Admin access required'
          });
          expect(next).not.toHaveBeenCalled();
        });
      });
    });