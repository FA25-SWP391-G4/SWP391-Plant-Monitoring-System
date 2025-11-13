const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

class PlanController {
  /**
   * Get all public plans (not admin-only)
   * GET /api/plans
   */
  static async getPublicPlans(req, res) {
    try {
      const plans = await Plan.getPublicPlans();
      
      res.status(200).json({
        success: true,
        data: plans
      });
    } catch (error) {
      await SystemLog.error('planController', 'getPublicPlans', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch plans'
      });
    }
  }

  /**
   * Get all plans including admin plans (admin only)
   * GET /api/plans/all
   */
  static async getAllPlans(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const publicPlans = await Plan.getPublicPlans();
      const adminPlans = await Plan.getAdminPlans();
      
      res.status(200).json({
        success: true,
        data: {
          public: publicPlans,
          admin: adminPlans
        }
      });
    } catch (error) {
      await SystemLog.error('planController', 'getAllPlans', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch plans'
      });
    }
  }

  /**
   * Get plan by ID
   * GET /api/plans/:id
   */
  static async getPlanById(req, res) {
    try {
      const { id } = req.params;
      const plan = await Plan.findById(id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          error: 'Plan not found'
        });
      }

      // Check if plan is admin-only and user is not admin
      if (plan.isAdminOnly && req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This plan is restricted.'
        });
      }

      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      await SystemLog.error('planController', 'getPlanById', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch plan'
      });
    }
  }

  /**
   * Create new plan (admin only)
   * POST /api/plans
   */
  static async createPlan(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const planData = req.body;
      const plan = await Plan.create(planData);

      await SystemLog.info('planController', 'createPlan', `Plan created: ${plan.name}`);
      
      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      await SystemLog.error('planController', 'createPlan', error.message);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(e => e.message)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create plan'
      });
    }
  }

  /**
   * Update plan (admin only)
   * PUT /api/plans/:id
   */
  static async updatePlan(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const plan = await Plan.findById(id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: 'Plan not found'
        });
      }

      await plan.update(updateData);
      await SystemLog.info('planController', 'updatePlan', `Plan updated: ${plan.name}`);

      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      await SystemLog.error('planController', 'updatePlan', error.message);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(e => e.message)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update plan'
      });
    }
  }

  /**
   * Get user's current subscription and plan
   * GET /api/plans/my-subscription
   */
  static async getUserSubscription(req, res) {
    try {
      const userId = req.user.user_id;
      
      // Use the plain SQL function since User is not a Sequelize model
      const { pool } = require('../config/db');
      const result = await pool.query('SELECT * FROM get_user_active_subscription($1)', [userId]);
      
      if (result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            subscription: null,
            plan: null,
            hasActiveSubscription: false
          }
        });
      }

      const subscriptionData = result.rows[0];
      
      res.status(200).json({
        success: true,
        data: {
          subscription: subscriptionData,
          hasActiveSubscription: true
        }
      });
    } catch (error) {
      await SystemLog.error('planController', 'getUserSubscription', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user subscription'
      });
    }
  }

  /**
   * Check if user can access admin plans
   * GET /api/plans/admin-access
   */
  static async checkAdminAccess(req, res) {
    try {
      const hasAccess = req.user.role === 'Admin';
      
      res.status(200).json({
        success: true,
        data: {
          hasAdminAccess: hasAccess,
          userRole: req.user.role
        }
      });
    } catch (error) {
      await SystemLog.error('planController', 'checkAdminAccess', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to check admin access'
      });
    }
  }
}

module.exports = PlanController;