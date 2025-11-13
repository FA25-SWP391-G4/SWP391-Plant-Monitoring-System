// Payment Controller - VNPay Integration with Community Library
// Handles UC19: Upgrade to Premium and UC22: Make Payment

const VNPayService = require('../services/vnpayService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const { generateToken } = require('../utils/tokenUtils');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

class PaymentController {
    // Create payment URL for premium upgrade
    static async createPayment(req, res) {
        try {
            const { amount, orderInfo, bankCode, planType, planName } = req.body;
            const userId = req.user.user_id;

            console.log('[PAYMENT CONTROLLER] Creating payment for user:', userId, {
                amount,
                orderInfo,
                bankCode,
                planType,
                planName
            });

            // Validate required fields
            if (!amount || !orderInfo) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: amount and orderInfo'
                });
            }

            // Check if trying to pay for admin-only plan
            if (planName) {
                const Plan = require('../models/Plan');
                const plan = await Plan.getPlanByName(planName);
                if (plan && plan.isAdminOnly && req.user.role !== 'Admin') {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied. This plan is restricted to administrators.'
                    });
                }

                // Check subscription upgrade policy
                const upgradeCheck = await Subscription.canUserUpgrade(userId, planName);
                if (!upgradeCheck.canUpgrade) {
                    return res.status(400).json({
                        success: false,
                        error: upgradeCheck.reason,
                        currentSubscription: upgradeCheck.currentSubscription
                    });
                }
            }

            // Validate amount
            if (!VNPayService.validateAmount(amount)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid amount. Must be between 5,000 and 500,000,000 VND'
                });
            }

            // Generate unique order ID based on plan type
            const planPrefix = (planType && planType.includes('ultimate')) ? 'ULTIMATE' : 'PREMIUM';
            const orderId = VNPayService.generateOrderId(planPrefix);
            
            // Get client IP
            const ipAddr = VNPayService.getClientIpAddress(req);

            // Create payment record in database
            const paymentData = {
                user_id: userId,
                order_id: orderId,
                amount: parseFloat(amount),
                order_info: orderInfo,
                bank_code: bankCode || null,
                ip_address: ipAddr,
                status: 'PENDING',
                created_at: new Date()
            };

            const paymentId = await Payment.create(paymentData);
            console.log('[PAYMENT CONTROLLER] Created payment record:', paymentId);

            // Generate VNPay payment URL
            const paymentUrlParams = {
                amount: parseFloat(amount),
                orderId,
                orderInfo,
                ipAddr
            };

            // Only add bankCode if it's explicitly provided and not empty
            if (bankCode && bankCode.trim() !== '' && bankCode.trim() !== 'null' && bankCode.trim() !== 'undefined') {
                paymentUrlParams.bankCode = bankCode.trim();
                console.log('[PAYMENT CONTROLLER] Using specific bank code:', bankCode.trim());
            } else {
                console.log('[PAYMENT CONTROLLER] No bank code specified - VNPay will show all payment methods');
                // Don't include bankCode in the params at all
            }

            const paymentUrl = VNPayService.createPaymentUrl(paymentUrlParams);

            console.log('[PAYMENT CONTROLLER] Generated payment URL:', paymentUrl);

            // Log successful payment creation
            await SystemLog.log('payment', 'create_payment', 
                'Payment created for user: ', userId);

            res.json({
                success: true,
                paymentUrl,
                orderId,
                amount: VNPayService.formatAmount(amount)
            });

        } catch (error) {
            console.error('[PAYMENT CONTROLLER] Error creating payment:', error);
            
            // Log error
            await SystemLog.error('payment', 'create_payment', error.message, req.user?.user_id);

            res.status(500).json({
                success: false,
                error: 'Failed to create payment',
                message: error.message
            });
        }
    }

    // Handle VNPay return URL (user redirected back after payment)
    static async handleVNPayReturn(req, res) {
        try {
            console.log('[PAYMENT CONTROLLER] Handling VNPay return:', req.query);

            // Verify return URL signature
            const verification = VNPayService.verifyReturnUrl(req.query);

            if (!verification.isValid) {
                console.error('[PAYMENT CONTROLLER] Invalid return signature');
                return res.redirect(`${process.env.CLIENT_URL}/payment/failed?error=invalid_signature`);
            }

            const { transaction } = verification;
            console.log('[PAYMENT CONTROLLER] Return verification successful:', transaction);

            // Update payment record
            await Payment.updateByOrderId(transaction.orderId, {
                transaction_no: transaction.transactionNo,
                bank_code: transaction.bankCode,
                pay_date: transaction.payDate,
                response_code: transaction.responseCode,
                transaction_status: transaction.transactionStatus,
                status: transaction.isSuccess ? 'SUCCESS' : 'FAILED',
                updated_at: new Date(),
                vnpay_txn_ref: transaction.vnp_TxnRef
            });

            // If payment successful, create subscription and upgrade user
            if (transaction.isSuccess) {
                const payment = await Payment.findByOrderId(transaction.orderId);
                if (payment) {
                    console.log(payment);
                    
                    // Determine plan type and subscription type from order info
                    const isUltimate = payment.order_id.search(/ULTIMATE/) !== -1 || 
                                      (payment.order_info && payment.order_info.toLowerCase().search(/ultimate/) !== -1);
                    const isLifetime = payment.order_info && payment.order_info.toLowerCase().search(/lifetime/) !== -1;
                    const isYearly = payment.order_info && payment.order_info.toLowerCase().search(/annual/) !== -1;
                    
                    const planName = isUltimate ? 'Ultimate' : 'Premium';
                    let subscriptionType = 'monthly';
                    if (isLifetime) subscriptionType = 'lifetime';
                    else if (isYearly) subscriptionType = 'yearly';
                    
                    // Find the plan and create subscription using same logic as IPN
                    const plan = await Plan.getPlanByName(planName);
                    if (plan) {
                        // Check subscription upgrade policy
                        const upgradeCheck = await Subscription.canUserUpgrade(payment.user_id, planName);
                        
                        if (upgradeCheck.canUpgrade || upgradeCheck.isExtension) {
                            if (upgradeCheck.isExtension) {
                                // Extend existing subscription
                                await Subscription.extendSubscription(
                                    payment.user_id, 
                                    subscriptionType, 
                                    payment.payment_id
                                );
                                console.log(`[PAYMENT CONTROLLER] Subscription extended via return: ${subscriptionType} for user ${payment.user_id}`);
                            } else {
                                // Create new subscription with fallback handling
                                if (upgradeCheck.currentSubscription && upgradeCheck.currentSubscription.subscriptionType === 'lifetime') {
                                    // Lifetime Premium upgrading to Ultimate
                                    await Subscription.createSubscriptionWithFallback({
                                        userId: payment.user_id,
                                        planId: plan.id,
                                        paymentId: payment.payment_id,
                                        subscriptionType: subscriptionType,
                                        fallbackSubscriptionId: upgradeCheck.currentSubscription.id
                                    });
                                } else {
                                    // Regular subscription
                                    await Subscription.deactivateUserSubscriptions(payment.user_id);
                                    await Subscription.createSubscription({
                                        userId: payment.user_id,
                                        planId: plan.id,
                                        paymentId: payment.payment_id,
                                        subscriptionType: subscriptionType
                                    });
                                }
                                console.log(`[PAYMENT CONTROLLER] Subscription created via return: ${planName} ${subscriptionType} for user ${payment.user_id}`);
                            }
                        }
                    }
                    
                    // Keep backward compatibility with User upgrade methods
                    if (isUltimate) {
                        await User.upgradeToUltimate(payment.user_id);
                        console.log('[PAYMENT CONTROLLER] User upgraded to ultimate via return:', payment.user_id);
                        
                        // Log successful upgrade
                        await SystemLog.log('payment', 'upgrade_ultimate', 
                           'User upgraded to ultimate via payment return', payment.user_id);
                    } else {
                        await User.upgradeToPremium(payment.user_id);
                        console.log('[PAYMENT CONTROLLER] User upgraded to premium via return:', payment.user_id);
                        
                        // Log successful upgrade
                        await SystemLog.log('payment', 'upgrade_premium', 
                           'User upgraded to premium via payment return', payment.user_id);
                    }

                    // Generate new token with updated user data
                    try {
                        const updatedUser = await User.findById(payment.user_id);
                        if (updatedUser) {
                            const newToken = generateToken(updatedUser);
                            console.log('[PAYMENT CONTROLLER] Generated new token for upgraded user:', payment.user_id);
                            
                            // Redirect to success page with new token
                            const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
                            return res.redirect(`${clientUrl}/payment/success?orderId=${transaction.orderId}&amount=${transaction.amount}&token=${newToken}`);
                        }
                    } catch (tokenError) {
                        console.error('[PAYMENT CONTROLLER] Error generating new token:', tokenError);
                        // Continue with redirect without token if token generation fails
                    }
                }

                // Fallback redirect to success page without token
                const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
                return res.redirect(`${clientUrl}/payment/success?orderId=${transaction.orderId}&amount=${transaction.amount}`);
            } else {
                // Redirect to failed page with error message
                const errorMessage = VNPayService.getTransactionStatusMessage(transaction.responseCode);
                const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
                return res.redirect(`${clientUrl}/payment/failed?orderId=${transaction.orderId}&error=${errorMessage}`);
            }

        } catch (error) {
            console.error('[PAYMENT CONTROLLER] Error handling VNPay return:', error);
            
            // Log error
            await SystemLog.error('payment', 'vnpay_return', error.message);

            const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${clientUrl}/payment/failed?error=system_error`);
        }
    }

    // Handle VNPay IPN (Instant Payment Notification)
    static async handleVNPayIPN(req, res) {
        try {
            console.log('[PAYMENT CONTROLLER] Handling VNPay IPN:', req.body);

            // Verify IPN signature
            const verification = VNPayService.verifyIpnCall(req.body);

            if (!verification.isValid) {
                console.error('[PAYMENT CONTROLLER] Invalid IPN signature');
                return res.json({ RspCode: '97', Message: 'Invalid signature' });
            }

            const { transaction } = verification;
            console.log('[PAYMENT CONTROLLER] IPN verification successful:', transaction);

            // Check if payment exists
            const payment = await Payment.findByOrderId(transaction.orderId);
            if (!payment) {
                console.error('[PAYMENT CONTROLLER] Payment not found:', transaction.orderId);
                return res.json({ RspCode: '01', Message: 'Order not found' });
            }

            // Check if already processed
            if (payment.status === 'SUCCESS') {
                console.log('[PAYMENT CONTROLLER] Payment already processed:', transaction.orderId);
                return res.json({ RspCode: '00', Message: 'Confirm Success' });
            }

            // Update payment record
            await Payment.updateByOrderId(transaction.orderId, {
                transaction_no: transaction.transactionNo,
                bank_code: transaction.bankCode,
                pay_date: transaction.payDate,
                response_code: transaction.responseCode,
                transaction_status: transaction.transactionStatus,
                status: transaction.isSuccess ? 'SUCCESS' : 'FAILED',
                updated_at: new Date()
            });

            // If payment successful, create subscription and upgrade user
            if (transaction.isSuccess) {
                try {                    
                    // Determine plan type and subscription type from order info
                    const isUltimate = payment.order_id.search(/ULTIMATE/) !== -1 || 
                                      (payment.order_info && payment.order_info.toLowerCase().search(/ultimate/) !== -1);
                    const isLifetime = payment.order_info && payment.order_info.toLowerCase().search(/lifetime/) !== -1;
                    const isYearly = payment.order_info && payment.order_info.toLowerCase().search(/annual/) !== -1;
                    
                    const planName = isUltimate ? 'Ultimate' : 'Premium';
                    let subscriptionType = 'monthly';
                    if (isLifetime) subscriptionType = 'lifetime';
                    else if (isYearly) subscriptionType = 'yearly';
                    
                    // Find the plan
                    const plan = await Plan.getPlanByName(planName);
                    if (plan) {
                        // Check subscription upgrade policy first
                        const upgradeCheck = await Subscription.canUserUpgrade(payment.user_id, planName);
                        
                        if (upgradeCheck.canUpgrade || upgradeCheck.isExtension) {
                            let subscription;
                            
                            if (upgradeCheck.isExtension) {
                                // Extend existing subscription
                                subscription = await Subscription.extendSubscription(
                                    payment.user_id, 
                                    subscriptionType, 
                                    payment.payment_id
                                );
                                console.log(`[PAYMENT CONTROLLER] Subscription extended: ${subscriptionType} for user ${payment.user_id}`);
                            } else {
                                // Handle based on subscription mechanism
                                if (upgradeCheck.currentSubscription && upgradeCheck.currentSubscription.subscriptionType === 'lifetime') {
                                    // Lifetime Premium upgrading to Ultimate - keep lifetime Premium as fallback
                                    await Subscription.createSubscriptionWithFallback({
                                        userId: payment.user_id,
                                        planId: plan.id,
                                        paymentId: payment.payment_id,
                                        subscriptionType: subscriptionType,
                                        fallbackSubscriptionId: upgradeCheck.currentSubscription.id
                                    });
                                } else {
                                    // Regular new subscription - deactivate old ones
                                    await Subscription.deactivateUserSubscriptions(payment.user_id);
                                    
                                    // Create new subscription
                                    subscription = await Subscription.createSubscription({
                                        userId: payment.user_id,
                                        planId: plan.id,
                                        paymentId: payment.payment_id,
                                        subscriptionType: subscriptionType
                                    });
                                }
                                console.log(`[PAYMENT CONTROLLER] Subscription created: ${planName} ${subscriptionType} for user ${payment.user_id}`);
                            }
                            
                            // Log successful subscription creation/extension
                            await SystemLog.info('payment', 'subscription_created_ipn', 
                                `${planName} ${subscriptionType} subscription ${upgradeCheck.isExtension ? 'extended' : 'created'} via IPN for user ${payment.user_id}`);
                        } else {
                            console.log(`[PAYMENT CONTROLLER] Subscription upgrade blocked: ${upgradeCheck.reason}`);
                            await SystemLog.warning('payment', 'subscription_blocked_ipn', 
                                `Subscription upgrade blocked for user ${payment.user_id}: ${upgradeCheck.reason}`);
                        }
                    }
                    
                    // The database trigger will handle user role update automatically
                    // Note: User.upgrade methods are kept for backward compatibility but the trigger handles the role update
                    
                } catch (subscriptionError) {
                    console.error('[PAYMENT CONTROLLER] Error creating subscription:', subscriptionError);
                    await SystemLog.error('payment', 'subscription_creation_error', 
                        `Failed to create subscription: ${subscriptionError.message}`);
                    // Don't fail the whole IPN process - the payment was successful
                }
            }

            // Return success response to VNPay
            res.json({ RspCode: '00', Message: 'Confirm Success' });

        } catch (error) {
            console.error('[PAYMENT CONTROLLER] Error handling VNPay IPN:', error);
            
            // Log error
            await SystemLog.error('payment', 'vnpay_ipn', error.message);

            res.json({ RspCode: '99', Message: 'Unknown error' });
        }
    }

    // Get payment status by order ID
    static async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.user_id;

            console.log('[PAYMENT CONTROLLER] Getting payment status for order:', orderId, 'user:', userId);

            // Find payment by order ID and user ID to ensure security
            const payment = await Payment.findByOrderIdAndUserId(orderId, userId);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Payment not found'
                });
            }

            // Format the payment data
            const paymentData = {
                ...payment,
                formatted_amount: VNPayService.formatAmount(payment.amount),
                status_message: payment.response_code ? 
                    VNPayService.getTransactionStatusMessage(payment.response_code) : null
            };

            res.json({
                success: payment.status === 'SUCCESS',
                payment: paymentData,
                message: payment.status === 'SUCCESS' ? 'Payment completed successfully' : 'Payment not completed'
            });

        } catch (error) {
            console.error('[PAYMENT CONTROLLER] Error getting payment status:', error);
            
            // Log error
            await SystemLog.error('payment', 'get_status', error.message, req.user?.user_id);

            res.status(500).json({
                success: false,
                error: 'Failed to get payment status',
                message: error.message
            });
        }
    }

    // Get payment history for user
    static async getPaymentHistory(req, res) {
        try {
            const userId = req.user.user_id;
            const { page = 1, limit = 10 } = req.query;

            console.log('[PAYMENT CONTROLLER] Getting payment history for user:', userId);

            const payments = await Payment.findByUserId(userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            // Format amounts for display
            const formattedPayments = payments.map(payment => ({
                ...payment,
                formatted_amount: VNPayService.formatAmount(payment.amount),
                status_message: payment.response_code ? 
                    VNPayService.getTransactionStatusMessage(payment.response_code) : null
            }));

            res.json({
                success: true,
                payments: formattedPayments
            });

        } catch (error) {
            console.error('[PAYMENT CONTROLLER] Error getting payment history:', error);
            
            // Log error
            await SystemLog.error('payment', 'get_history', error.message, req.user?.user_id);

            res.status(500).json({
                error: 'Failed to get payment history',
                message: error.message
            });
        }
    }
}

module.exports = PaymentController;
