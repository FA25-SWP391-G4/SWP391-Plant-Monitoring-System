const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// User subscription routes
router.post('/', SubscriptionController.createSubscription);
router.get('/history', SubscriptionController.getUserSubscriptionHistory);
router.get('/can-upgrade/:planName', SubscriptionController.checkUpgradeEligibility);
router.post('/cancel', SubscriptionController.cancelSubscription);

// Admin subscription routes
router.get('/expiring', SubscriptionController.getExpiringSubscriptions);
router.post('/assign', SubscriptionController.assignSubscription);

module.exports = router;