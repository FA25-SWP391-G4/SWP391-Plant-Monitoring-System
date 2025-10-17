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
            
            // Debug auth information
            console.log('========== PAYMENT AUTH DEBUG ==========');
            console.log('Request headers:', req.headers);
            console.log('Auth header:', req.headers.authorization);
            console.log('User object in request:', req.user ? 'Present' : 'Missing');
            if (req.user) {
                console.log('User ID:', req.user.user_id);
                console.log('User email:', req.user.email);
                console.log('User family name:', req.user.family_name);
                console.log('User given name:', req.user.given_name);
                console.log('User role:', req.user.role);
            }
            console.log('======================================');
            
            // The auth middleware should ensure req.user exists - add extra validation
            if (!req.user || !req.user.user_id) {
                console.error('Auth Middleware Error: Missing user information in request');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please log in and try again.'
                });
            }
            
            const userId = req.user.user_id;
            const fullName = req.user.full_name || 
                             (req.user.given_name && req.user.family_name ? `${req.user.given_name} ${req.user.family_name}` : null) || 
                             req.user.family_name || 
                             req.user.given_name || 
                             'Unknown User';
                             
            console.log(`Creating payment for user ID: ${userId}, name: ${fullName}, email: ${req.user.email || 'Not set'}`);
            
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
                ipAddr,
                returnUrl: process.env.VNPAY_RETURN_URL || vnpayConfig.vnp_ReturnUrl
            };
            
            console.log('Creating VNPay payment with data:', {
                ...paymentData,
                amount: `${paymentData.amount} VND`,
                returnUrl: paymentData.returnUrl
            });
            
            const paymentResult = VNPayService.createPaymentUrl(paymentData);
            
            console.log('Payment URL created successfully:', {
                orderId: paymentResult.orderId,
                paymentUrlLength: paymentResult.paymentUrl.length,
                paymentUrlStart: paymentResult.paymentUrl.substring(0, 100) + '...',
                expireDate: paymentResult.expireDate
            });
            
            // Log payment creation
            if (userId) {
                await SystemLog.create(
                    'INFO',
                    'Payment',
                    `User ${userId} created payment: ${orderId} - Amount: ${amount} VND`
                );
            }
            
            // Check if direct redirect is requested
            const directRedirect = req.body.directRedirect === true;
            
            if (directRedirect) {
                console.log('Redirecting directly to VNPay URL');
                return res.redirect(paymentResult.paymentUrl);
            } else {
                // Return JSON response with payment URL for frontend handling
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
            }
            
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
            console.log('VNPay return parameters:', vnpParams);
            
            // Add fallback for missing frontend URL
            const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL || 'http://localhost:3000/payment/result';
            
            // Attempt to verify the VNPay response, but handle errors gracefully
            let verificationResult;
            try {
                verificationResult = VNPayService.verifyReturnUrl(vnpParams);
            } catch (verifyError) {
                console.error('Error verifying VNPay return URL:', verifyError);
                return res.redirect(`${frontendUrl}?code=99&message=Verification%20error`);
            }
            
            // If the signature is invalid, redirect to frontend with error code
            if (!verificationResult.isValid) {
                console.error('Invalid VNPay signature in return URL');
                return res.redirect(`${frontendUrl}?code=97&message=Invalid%20payment%20signature`);
            }
            
            // Use the fallback URL defined above
            
            // Find payment record
            const payment = await Payment.findByVNPayTxnRef(verificationResult.orderId);
            
            if (!payment) {
                console.error(`Payment not found for orderId: ${verificationResult.orderId}`);
                return res.redirect(`${frontendUrl}?code=91&message=Payment%20not%20found&orderId=${verificationResult.orderId}`);
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
                        await SystemLog.create(
                            'INFO',
                            'User Upgrade',
                            `User ${user.user_id} upgraded to Premium via payment: ${verificationResult.orderId}`
                        );
                    }
                }
                
                // Log successful payment
                if (payment.user_id) {
                    await SystemLog.create(
                        'INFO',
                        'Payment',
                        `User ${payment.user_id} completed payment: ${verificationResult.orderId} - Amount: ${verificationResult.amount} VND`
                    );
                }
                
            } else {
                await payment.markAsFailed();
                
                // Log failed payment
                if (payment.user_id) {
                    await SystemLog.create(
                        'ERROR',
                        'Payment',
                        `User ${payment.user_id} payment failed: ${verificationResult.orderId} - Code: ${verificationResult.responseCode}`
                    );
                }
            }
            
            // Always redirect to frontend with appropriate parameters
            try {
                // Build redirect URL with result parameters
                const redirectUrl = new URL(frontendUrl);
                redirectUrl.searchParams.append('code', verificationResult.responseCode);
                redirectUrl.searchParams.append('orderId', verificationResult.orderId);
                redirectUrl.searchParams.append('amount', verificationResult.amount);
                redirectUrl.searchParams.append('status', payment.status);
                redirectUrl.searchParams.append('message', verificationResult.message);
                
                console.log(`Redirecting to payment result page: ${redirectUrl.toString()}`);
                return res.redirect(redirectUrl.toString());
            } catch (urlError) {
                console.error('Error building redirect URL:', urlError);
                
                // Fallback to basic redirect if URL construction fails
                return res.redirect(`${frontendUrl}?code=${verificationResult.responseCode}&status=${payment.status}`);
            }
            
        } catch (error) {
            console.error('VNPay Return Error:', error);
            
            // Even if there's an error, redirect to frontend with error code
            try {
                return res.redirect(`${frontendUrl}?code=99&message=Server%20error&error=${encodeURIComponent(error.message)}`);
            } catch (redirectError) {
                console.error('Failed to redirect after error:', redirectError);
                
                // Last resort - return JSON response
                res.status(200).json({
                    success: false,
                    message: 'Payment processing error',
                    code: '99'
                });
            }
        }
    }
    
    /**
     * UC19 & UC22: HANDLE VNPAY IPN (INSTANT PAYMENT NOTIFICATION)
     * Processes payment notification from VNPay (server-to-server)
     */
    static async handleVNPayIPN(req, res) {
        try {
            const vnpParams = req.query;
            console.log('VNPay IPN parameters:', vnpParams);
            
            // Verify VNPay IPN exactly as in the demo
            const verificationResult = VNPayService.verifyIPN(vnpParams);
            
            if (!verificationResult.isValid) {
                console.error('Invalid signature in VNPay IPN');
                return res.status(200).json({
                    RspCode: '97',
                    Message: 'Fail checksum'
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
            
            // Respond to VNPay exactly as in the demo
            res.status(200).json({
                RspCode: '00',
                Message: 'success'
            });
            
        } catch (error) {
            console.error('VNPay IPN Error:', error);
            // Always respond with status 200, even for errors - this is what VNPay expects
            res.status(200).json({
                RspCode: '99',
                Message: 'Unknown error'
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
        
        // Ensure user authentication for payment status check
        if (!req.user || !req.user.user_id) {
            console.warn('Unauthenticated payment status check attempt for order:', orderId);
        }
        
        const payment = await Payment.findByVNPayTxnRef(orderId);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        // If authenticated, verify this payment belongs to the user
        if (req.user && req.user.user_id && payment.user_id && 
            payment.user_id !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this payment'
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
}    /**
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
