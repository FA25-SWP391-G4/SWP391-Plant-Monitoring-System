// Payment Controller - VNPay Integration with Community Library
// Handles UC19: Upgrade to Premium and UC22: Make Payment

const VNPayService = require('../services/vnpayService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

class PaymentController {
    // Create payment URL for premium upgrade
    static async createPayment(req, res) {
        try {
            const { amount, orderInfo, bankCode, planType } = req.body;
            const userId = req.user.user_id;

            console.log('[PAYMENT CONTROLLER] Creating payment for user:', userId, {
                amount,
                orderInfo,
                bankCode,
                planType
            });

            // Validate required fields
            if (!amount || !orderInfo) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: amount and orderInfo'
                });
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
                updated_at: new Date()
            });

            // If payment successful, upgrade user to appropriate tier
            if (transaction.isSuccess) {
                const payment = await Payment.findByOrderId(transaction.orderId);
                if (payment) {
                    // Check order ID or order info for plan type
                    const isUltimate = payment.order_id.includes('ULTIMATE') || 
                                      (payment.order_info && payment.order_info.toLowerCase().includes('ultimate'));
                    
                    if (isUltimate) {
                        await User.upgradeToUltimate(payment.user_id);
                        console.log('[PAYMENT CONTROLLER] User upgraded to ultimate:', payment.user_id);
                        
                        // Log successful upgrade
                        await SystemLog.log('payment', 'upgrade_ultimate', 
                           'User upgraded to ultimate via payment', payment.user_id);
                    } else {
                        await User.upgradeToPremium(payment.user_id);
                        console.log('[PAYMENT CONTROLLER] User upgraded to premium:', payment.user_id);
                        
                        // Log successful upgrade
                        await SystemLog.log('payment', 'upgrade_premium', 
                           'User upgraded to premium via payment', payment.user_id);
                    }
                }

                // Redirect to success page
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

            // If payment successful, upgrade user to appropriate tier
            if (transaction.isSuccess) {
                // Check order ID or order info for plan type
                const isUltimate = payment.order_id.includes('ULTIMATE') || 
                                  (payment.order_info && payment.order_info.toLowerCase().includes('ultimate'));
                
                if (isUltimate) {
                    await User.upgradeToUltimate(payment.user_id);
                    console.log('[PAYMENT CONTROLLER] User upgraded to ultimate via IPN:', payment.user_id);
                    
                    // Log successful upgrade
                    await SystemLog.log('payment', 'upgrade_ultimate_ipn', 
                        `User upgraded to ultimate via IPN`, payment.user_id);
                } else {
                    await User.upgradeToPremium(payment.user_id);
                    console.log('[PAYMENT CONTROLLER] User upgraded to premium via IPN:', payment.user_id);
                    
                    // Log successful upgrade
                    await SystemLog.log('payment', 'upgrade_premium_ipn', 
                        `User upgraded to premium via IPN`, payment.user_id);
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
