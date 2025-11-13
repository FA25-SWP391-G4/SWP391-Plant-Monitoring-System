// Payment Routes - VNPay Integration
// Routes for UC19: Upgrade to Premium and UC22: Make Payment

const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create payment URL (requires authentication)
router.post('/create', authMiddleware, PaymentController.createPayment);

// VNPay return URL (no auth required - VNPay callback)
router.get('/vnpay-return', PaymentController.handleVNPayReturn);

// VNPay IPN endpoint (no auth required - VNPay webhook)
router.post('/vnpay-ipn', PaymentController.handleVNPayIPN);

// Get payment status by order ID (requires authentication)
router.get('/status/:orderId', authMiddleware, PaymentController.getPaymentStatus);

// Get payment history (requires authentication)
router.get('/history', authMiddleware, PaymentController.getPaymentHistory);

module.exports = router;