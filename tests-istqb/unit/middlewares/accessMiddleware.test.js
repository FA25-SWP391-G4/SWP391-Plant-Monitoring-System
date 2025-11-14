    /**
     * ============================================================================
     * UNIT TEST: Access Middleware
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: middlewares/accessMiddleware.js
     */

    const {
      isAdmin,
      isPremium,
      isUltimate,
      isPremiumOnly,
      isUltimateOnly,
      addRoleStatus,
      requireRoles
    } = require('../../../middlewares/accessMiddleware');

    describe('accessMiddleware', () => {
      let req, res, next;

      beforeEach(() => {
        req = {};
        res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        next = jest.fn();
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('isAdmin()', () => {
        test('should allow access for admin role', () => {
          req.user = { user_id: 1, role: 'Admin' };
          
          isAdmin(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        });

        test('should deny access for non-admin role', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          isAdmin(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Admin access required. This feature is restricted to administrators.',
            code: 'ADMIN_REQUIRED'
          });
          expect(next).not.toHaveBeenCalled();
        });

        test('should deny access when user not authenticated', () => {
          req.user = null;
          
          isAdmin(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        });
      });

      describe('isPremium()', () => {
        test('should allow premium users', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          isPremium(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        });

        test('should allow ultimate users', () => {
          req.user = { user_id: 1, role: 'Ultimate' };
          
          isPremium(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should allow admin users', () => {
          req.user = { user_id: 1, role: 'Admin' };
          
          isPremium(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should deny regular users', () => {
          req.user = { user_id: 1, role: 'Regular' };
          
          isPremium(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Premium subscription required. Please upgrade your account to access premium features.',
            code: 'PREMIUM_REQUIRED'
          });
        });

        test('should handle role with whitespace', () => {
          req.user = { user_id: 1, role: ' Premium ' };
          
          isPremium(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });
      });

      describe('isUltimate()', () => {
        test('should allow ultimate users', () => {
          req.user = { user_id: 1, role: 'Ultimate' };
          
          isUltimate(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should allow admin users', () => {
          req.user = { user_id: 1, role: 'Admin' };
          
          isUltimate(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should deny premium users', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          isUltimate(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Ultimate subscription required. Please upgrade your account to access AI features.',
            code: 'ULTIMATE_REQUIRED'
          });
        });

        test('should deny regular users', () => {
          req.user = { user_id: 1, role: 'Regular' };
          
          isUltimate(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
        });
      });

      describe('isPremiumOnly()', () => {
        test('should allow only premium users', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          isPremiumOnly(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should deny ultimate users', () => {
          req.user = { user_id: 1, role: 'Ultimate' };
          
          isPremiumOnly(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Premium subscription required (Premium tier only)',
            code: 'PREMIUM_ONLY_REQUIRED'
          });
        });

        test('should deny admin users', () => {
          req.user = { user_id: 1, role: 'Admin' };
          
          isPremiumOnly(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
        });
      });

      describe('isUltimateOnly()', () => {
        test('should allow only ultimate users', () => {
          req.user = { user_id: 1, role: 'Ultimate' };
          
          isUltimateOnly(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should deny admin users', () => {
          req.user = { user_id: 1, role: 'Admin' };
          
          isUltimateOnly(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Ultimate subscription required (Ultimate tier only)',
            code: 'ULTIMATE_ONLY_REQUIRED'
          });
        });

        test('should deny premium users', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          isUltimateOnly(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
        });
      });

      describe('addRoleStatus()', () => {
        test('should add role flags for regular user', () => {
          req.user = { user_id: 1, role: 'Regular' };
          
          addRoleStatus(req, res, next);
          
          expect(req.user.isRegular).toBe(true);
          expect(req.user.isPremium).toBe(false);
          expect(req.user.hasPremiumAccess).toBe(false);
          expect(req.user.hasUltimateAccess).toBe(false);
          expect(next).toHaveBeenCalled();
        });

        test('should add role flags for premium user', () => {
          req.user = { user_id: 1, role: 'Premium' };
          
          addRoleStatus(req, res, next);
          
          expect(req.user.isPremium).toBe(true);
          expect(req.user.hasPremiumAccess).toBe(true);
          expect(req.user.hasUltimateAccess).toBe(false);
        });

        test('should add role flags for ultimate user', () => {
          req.user = { user_id: 1, role: 'Ultimate' };
          
          addRoleStatus(req, res, next);
          
          expect(req.user.isUltimate).toBe(true);
          expect(req.user.hasPremiumAccess).toBe(true);
          expect(req.user.hasUltimateAccess).toBe(true);
        });

        test('should handle missing user object', () => {
          req.user = null;
          
          addRoleStatus(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });
      });

      describe('requireRoles()', () => {
        test('should allow access for correct role', () => {
          const middleware = requireRoles(['Premium', 'Ultimate']);
          req.user = { user_id: 1, role: 'Premium' };
          
          middleware(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should deny access for incorrect role', () => {
          const middleware = requireRoles(['Admin']);
          req.user = { user_id: 1, role: 'Premium' };
          
          middleware(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Access denied. Required roles: Admin',
            code: 'INSUFFICIENT_ROLE'
          });
        });

        test('should handle multiple allowed roles', () => {
          const middleware = requireRoles(['Premium', 'Ultimate', 'Admin']);
          req.user = { user_id: 1, role: 'Ultimate' };
          
          middleware(req, res, next);
          
          expect(next).toHaveBeenCalled();
        });

        test('should require authentication', () => {
          const middleware = requireRoles(['Premium']);
          req.user = null;
          
          middleware(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        });
      });
    });