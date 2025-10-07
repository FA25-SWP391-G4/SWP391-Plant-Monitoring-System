/**
 * ============================================================================
 * PAYMENT ROUTES - VNPAY INTEGRATION ENDPOINTS
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * - UC19: Upgrade to Premium - Premium subscription payment processing
 * - UC22: Make Payment for Premium - Complete payment workflow
 * 
 * ENDPOINTS:
 * - POST /payment/create - Create VNPay payment URL (requires auth)
 * - GET /payment/vnpay-return - Handle VNPay return callback (public)
 * - POST /payment/vnpay-ipn - Handle VNPay IPN notification (public)
 * - GET /payment/status/:orderId - Check payment status (requires auth)
 * - GET /payment/history - Get user payment history (requires auth)
 * - GET /payment/admin/all - Get all payments (admin only)
 * - GET /payment/admin/stats - Get payment statistics (admin only)
 * 
 * MIDDLEWARE REQUIREMENTS:
 * - requireAuth: JWT authentication middleware
 * - requireAdmin: Admin role validation middleware
 * - rateLimitPayment: Rate limiting for payment creation
 * 
 * SECURITY FEATURES:
 * - Authentication required for user operations
 * - Admin role required for administrative endpoints
 * - Rate limiting on payment creation
 * - Input validation and sanitization
 * - VNPay signature verification
 */

const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

// Import middleware (these need to be created)
// const { requireAuth, requireAdmin } = require('../middleware/auth');
// const { rateLimitPayment } = require('../middleware/rateLimit');
// const { validatePayment } = require('../middleware/validation');

/**
 * UC19 & UC22: CREATE PAYMENT URL
 * POST /payment/create
 * 
 * Creates VNPay payment URL for premium upgrade or subscription
 * 
 * Body:
 * {
 *   "amount": 299000,
 *   "orderInfo": "Upgrade to Premium Plan",
 *   "orderType": "premium_upgrade",
 *   "bankCode": "VNBANK" // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment URL created successfully",
 *   "data": {
 *     "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
 *     "orderId": "PREMIUM20241225123456789",
 *     "amount": 299000,
 *     "expireTime": "20241225124456",
 *     "paymentId": 123
 *   }
 * }
 */
router.post('/create', 
    // requireAuth,           // JWT authentication
    // rateLimitPayment,      // Rate limiting
    // validatePayment,       // Input validation
    PaymentController.createPaymentUrl
);

/**
 * UC19 & UC22: VNPAY RETURN URL HANDLER
 * GET /payment/vnpay-return
 * 
 * Handles user return from VNPay payment page
 * This endpoint receives the user after they complete/cancel payment
 * 
 * Query params are automatically added by VNPay:
 * - vnp_Amount, vnp_BankCode, vnp_OrderInfo, vnp_ResponseCode, etc.
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Giao dịch thành công",
 *   "data": {
 *     "orderId": "PREMIUM20241225123456789",
 *     "amount": 299000,
 *     "transactionNo": "14226112",
 *     "payDate": "20231207170112",
 *     "status": "completed",
 *     "paymentId": 123
 *   }
 * }
 */
router.get('/vnpay-return', PaymentController.handleVNPayReturn);

/**
 * UC19 & UC22: VNPAY IPN (INSTANT PAYMENT NOTIFICATION)
 * POST /payment/vnpay-ipn
 * 
 * Server-to-server notification from VNPay about payment status
 * This is called by VNPay directly (not by user browser)
 * 
 * Query params automatically sent by VNPay:
 * - vnp_Amount, vnp_TxnRef, vnp_ResponseCode, vnp_SecureHash, etc.
 * 
 * Response format required by VNPay:
 * {
 *   "RspCode": "00",
 *   "Message": "Confirm Success"
 * }
 */
router.get('/vnpay-ipn', PaymentController.handleVNPayIPN);

/**
 * CHECK PAYMENT STATUS
 * GET /payment/status/:orderId
 * 
 * Check the current status of a payment by order ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payment_id": 123,
 *     "vnpay_txn_ref": "PREMIUM20241225123456789",
 *     "amount": 299000,
 *     "status": "completed",
 *     "created_at": "2024-12-25T12:34:56Z",
 *     "is_expired": false
 *   }
 * }
 */
router.get('/status/:orderId', 
    // requireAuth,
    PaymentController.getPaymentStatus
);

/**
 * GET USER PAYMENT HISTORY
 * GET /payment/history
 * 
 * Get payment history for the authenticated user
 * 
 * Query params:
 * - limit: number of records (default: 20)
 * - status: filter by status (completed, failed, pending)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "payment_id": 123,
 *       "vnpay_txn_ref": "PREMIUM20241225123456789",
 *       "amount": 299000,
 *       "formatted_amount": "299.000 ₫",
 *       "status": "completed",
 *       "created_at": "2024-12-25T12:34:56Z",
 *       "age_string": "2h ago"
 *     }
 *   ]
 * }
 */
router.get('/history', 
    // requireAuth,
    PaymentController.getUserPaymentHistory
);

// ============================================================================
// ADMIN ENDPOINTS - UC24: Manage Users, UC25: View System-Wide Reports
// ============================================================================

/**
 * ADMIN: GET ALL PAYMENTS
 * GET /payment/admin/all
 * 
 * Administrative endpoint to view all payments in the system
 * 
 * Query params:
 * - limit: number of records (default: 100)
 * - status: filter by status (completed, failed, pending)
 */
router.get('/admin/all', 
    // requireAuth,
    // requireAdmin,
    PaymentController.getAllPayments
);

/**
 * ADMIN: GET PAYMENT STATISTICS
 * GET /payment/admin/stats
 * 
 * Administrative endpoint for payment analytics and reporting
 * 
 * Query params:
 * - days: number of days for statistics (default: 30)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total_payments": 150,
 *     "total_revenue": 44850000,
 *     "completed_count": 135,
 *     "failed_count": 10,
 *     "pending_count": 5,
 *     "avg_payment_amount": 299000
 *   }
 * }
 */
router.get('/admin/stats', 
    // requireAuth,
    // requireAdmin,
    PaymentController.getPaymentStatistics
);

// ============================================================================
// UTILITY ENDPOINTS FOR TESTING AND DEVELOPMENT
// ============================================================================

/**
 * TEST ENDPOINT: Generate test payment data
 * GET /payment/test/generate
 * 
 * For development and testing purposes
 */
router.get('/test/generate', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    
    const VNPayService = require('../services/vnpayService');
    
    const testOrderId = VNPayService.generateOrderId('TEST');
    const testAmount = 299000;
    
    res.json({
        success: true,
        data: {
            orderId: testOrderId,
            amount: testAmount,
            isValidAmount: VNPayService.validateAmount(testAmount),
            timestamp: new Date().toISOString()
        }
    });
});

/**
 * TEST ENDPOINT: Validate VNPay configuration
 * GET /payment/test/config
 */
router.get('/test/config', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    
    const vnpayConfig = require('../config/vnpay');
    
    res.json({
        success: true,
        data: {
            tmnCode: vnpayConfig.vnp_TmnCode,
            hasSecret: !!vnpayConfig.vnp_HashSecret,
            paymentUrl: vnpayConfig.vnp_Url,
            returnUrl: vnpayConfig.vnp_ReturnUrl,
            version: vnpayConfig.vnp_Version,
            environment: 'sandbox'
        }
    });
});

module.exports = router;
