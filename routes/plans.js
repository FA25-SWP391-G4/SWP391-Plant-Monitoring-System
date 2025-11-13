const express = require('express');
const router = express.Router();
const PlanController = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/', PlanController.getPublicPlans);

// Protected routes (require authentication)
router.use(authMiddleware);

router.get('/my-subscription', PlanController.getUserSubscription);
router.get('/admin-access', PlanController.checkAdminAccess);
router.get('/all', PlanController.getAllPlans); // Admin only
router.get('/:id', PlanController.getPlanById);
router.post('/', PlanController.createPlan); // Admin only
router.put('/:id', PlanController.updatePlan); // Admin only

module.exports = router;