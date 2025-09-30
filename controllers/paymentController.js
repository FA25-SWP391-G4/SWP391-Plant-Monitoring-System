/**
 * ============================================================================
 * PAYMENT CONTROLLER - VNPAY INTEGRATION
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * - UC19: Upgrade to Premium - Premium subscription payment processing
 * - UC22: Make Payment for Premium - Complete payment workflow
 * 
 * ENDPOINTS:
 * - POST /payment/create - Create payment URL for VNPay
 * - GET /payment/vnpay-return - Handle return from VNPay
 * - POST /payment/vnpay-ipn - Handle IPN from VNPay
 * - GET /payment/status/:orderId - Check payment status
 * 
 * SECURITY FEATURES:
 * - Signature verification for all VNPay responses
 * - Amount validation and transaction tracking
 * - User authentication for payment creation
 * - Audit logging for all payment operations
 */

const Payment = require('../models/Payment');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const VNPayService = require('../services/vnpayService');
const vnpayConfig = require('../config/vnpay');

class PaymentController {
    
    /**
     * UC19 & UC22: CREATE PAYMENT URL
     * Generates VNPay payment URL for premium upgrade or subscription
     */
    static async createPaymentUrl(req, res) {
        try {
            const { amount, orderInfo, orderType, bankCode } = req.body;
            const userId = req.user ? req.user.user_id : null; // Assuming auth middleware sets req.user
            
            // Validate required fields
            if (!amount || !orderInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: amount, orderInfo'
                });
            }
            
            // Validate amount
            if (!VNPayService.validateAmount(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount. Must be between 5,000 and 500,000,000 VND'
                });
            }
            
            // Get client IP
            const ipAddr = VNPayService.getClientIpAddress(req);
            
            // Generate unique order ID
            const orderId = VNPayService.generateOrderId('PREMIUM');
            
            // Create payment record in database
            const payment = await Payment.createPayment(userId, amount, orderId);
            
            // Generate VNPay payment URL
            const paymentData = {
                amount,
                orderId,
                orderInfo: `${orderInfo} - User: ${userId || 'Guest'}`,
                orderType: orderType || vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE,
                bankCode,
                ipAddr
            };
            
            const paymentResult = VNPayService.createPaymentUrl(paymentData);
            
            // Log payment creation
            if (userId) {
                await SystemLog.logActivity(
                    userId,
                    'payment_created',
                    `Payment created: ${orderId} - Amount: ${amount} VND`
                );
            }
            
            res.status(200).json({
                success: true,
                message: 'Payment URL created successfully',
                data: {
                    paymentUrl: paymentResult.paymentUrl,
                    orderId: paymentResult.orderId,
                    amount: paymentResult.amount,
                    expireTime: paymentResult.expireDate,
                    paymentId: payment.payment_id
                }
            });
            
        } catch (error) {
            console.error('Create Payment URL Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating payment URL',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * UC19 & UC22: HANDLE VNPAY RETURN URL
     * Processes user return from VNPay payment page
     */
    static async handleVNPayReturn(req, res) {
        try {
            const vnpParams = req.query;
            
            // Verify VNPay response
            const verificationResult = VNPayService.verifyReturnUrl(vnpParams);
            
            if (!verificationResult.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment signature'
                });
            }
            
            // Find payment record
            const payment = await Payment.findByVNPayTxnRef(verificationResult.orderId);
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            
            // Update payment status based on VNPay response
            if (verificationResult.isSuccess) {
                await payment.markAsCompleted();
                
                // Update user to premium if this is an upgrade payment
                if (payment.user_id && vnpParams.vnp_OrderType === vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE) {
                    const user = await User.findById(payment.user_id);
                    if (user && user.role !== 'Premium') {
                        user.role = 'Premium';
                        await user.save();
                        
                        // Log upgrade
                        await SystemLog.logActivity(
                            user.user_id,
                            'user_upgraded_to_premium',
                            `User upgraded to Premium via payment: ${verificationResult.orderId}`
                        );
                    }
                }
                
                // Log successful payment
                if (payment.user_id) {
                    await SystemLog.logActivity(
                        payment.user_id,
                        'payment_completed',
                        `Payment completed: ${verificationResult.orderId} - Amount: ${verificationResult.amount} VND`
                    );
                }
                
            } else {
                await payment.markAsFailed();
                
                // Log failed payment
                if (payment.user_id) {
                    await SystemLog.logActivity(
                        payment.user_id,
                        'payment_failed',
                        `Payment failed: ${verificationResult.orderId} - Code: ${verificationResult.responseCode}`
                    );
                }
            }
            
            // Return result to frontend
            res.status(200).json({
                success: verificationResult.isSuccess,
                message: verificationResult.message,
                data: {
                    orderId: verificationResult.orderId,
                    amount: verificationResult.amount,
                    transactionNo: verificationResult.transactionNo,
                    payDate: verificationResult.payDate,
                    status: payment.status,
                    paymentId: payment.payment_id
                }
            });
            
        } catch (error) {
            console.error('VNPay Return Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while processing payment return'
            });
        }
    }
    
    /**
     * UC19 & UC22: HANDLE VNPAY IPN (INSTANT PAYMENT NOTIFICATION)
     * Processes payment notification from VNPay (server-to-server)
     */
    static async handleVNPayIPN(req, res) {
        try {
            const vnpParams = req.query;
            
            // Verify VNPay IPN
            const verificationResult = VNPayService.verifyIPN(vnpParams);
            
            if (!verificationResult.isValid) {
                return res.status(200).json({
                    RspCode: vnpayConfig.RESPONSE_CODES.FAIL_CHECKSUM,
                    Message: 'Invalid checksum'
                });
            }
            
            // Find payment record
            const payment = await Payment.findByVNPayTxnRef(verificationResult.orderId);
            
            if (!payment) {
                return res.status(200).json({
                    RspCode: vnpayConfig.RESPONSE_CODES.TRANSACTION_NOT_FOUND,
                    Message: 'Transaction not found'
                });
            }
            
            // Validate amount
            if (payment.amount !== verificationResult.amount) {
                return res.status(200).json({
                    RspCode: vnpayConfig.RESPONSE_CODES.INVALID_AMOUNT,
                    Message: 'Invalid amount'
                });
            }
            
            // Update payment status if not already processed
            if (payment.status === 'pending') {
                if (verificationResult.isSuccess) {
                    await payment.markAsCompleted();
                    
                    // Update user to premium if needed
                    if (payment.user_id) {
                        const user = await User.findById(payment.user_id);
                        if (user && user.role !== 'Premium') {
                            user.role = 'Premium';
                            await user.save();
                        }
                    }
                } else {
                    await payment.markAsFailed();
                }
            }
            
            // Log IPN processing
            console.log(`VNPay IPN processed: ${verificationResult.orderId} - Status: ${payment.status}`);
            
            // Respond to VNPay
            res.status(200).json({
                RspCode: vnpayConfig.RESPONSE_CODES.SUCCESS,
                Message: 'Confirm Success'
            });
            
        } catch (error) {
            console.error('VNPay IPN Error:', error);
            res.status(200).json({
                RspCode: '99',
                Message: 'Internal server error'
            });
        }
    }
    
    /**
     * GET PAYMENT STATUS
     * Retrieves current payment status by order ID
     */
    static async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;
            
            const payment = await Payment.findByVNPayTxnRef(orderId);
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: payment.toJSON()
            });
            
        } catch (error) {
            console.error('Get Payment Status Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    /**
     * GET USER PAYMENT HISTORY
     * Retrieves payment history for authenticated user
     */
    static async getUserPaymentHistory(req, res) {
        try {
            const userId = req.user.user_id;
            const { limit = 20, status } = req.query;
            
            let payments;
            if (status) {
                payments = await Payment.findByStatus(status, limit);
                payments = payments.filter(p => p.user_id === userId);
            } else {
                payments = await Payment.findByUserId(userId, limit);
            }
            
            res.status(200).json({
                success: true,
                data: payments.map(p => p.toJSON())
            });
            
        } catch (error) {
            console.error('Get Payment History Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    /**
     * ADMIN: GET ALL PAYMENTS
     * Administrative endpoint to view all payments
     */
    static async getAllPayments(req, res) {
        try {
            const { limit = 100, status } = req.query;
            
            let payments;
            if (status) {
                payments = await Payment.findByStatus(status, limit);
            } else {
                payments = await Payment.findAll(limit);
            }
            
            res.status(200).json({
                success: true,
                data: payments.map(p => p.toJSON())
            });
            
        } catch (error) {
            console.error('Get All Payments Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    /**
     * ADMIN: GET PAYMENT STATISTICS
     * Administrative endpoint for payment analytics
     */
    static async getPaymentStatistics(req, res) {
        try {
            const { days = 30 } = req.query;
            const stats = await Payment.getPaymentStats(days);
            
            res.status(200).json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Get Payment Statistics Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = PaymentController;
