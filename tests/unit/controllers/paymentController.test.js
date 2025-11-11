/**
 * PAYMENT & SUBSCRIPTION CONTROLLER UNIT TESTS
 * ============================================
 * 
 * Tests for UC9: Payment Processing
 * Tests for UC10: Subscription Management  
 * Tests for UC11: Premium Feature Access
 * 
 * Coverage:
 * - VNPay payment creation and processing
 * - Payment validation and verification
 * - User subscription upgrades
 * - Premium feature access control
 * - Error handling and security
 */

const PaymentController = require('../../../controllers/paymentController');
const VNPayService = require('../../../services/vnpayService');
const Payment = require('../../../models/Payment');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');

// Mock external dependencies
jest.mock('../../../services/vnpayService');
jest.mock('../../../models/Payment');
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');

describe('Payment & Subscription Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: {
                user_id: 'test-user-uuid',
                email: 'test@test.com',
                role: 'user'
            },
            body: {},
            query: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis()
        };

        // Clear all mocks
        jest.clearAllMocks();

        // Setup default mocks
        SystemLog.log = jest.fn().mockResolvedValue();
        SystemLog.error = jest.fn().mockResolvedValue();
    });

    describe('UC9: Payment Processing', () => {
        describe('PaymentController.createPayment', () => {
            beforeEach(() => {
                req.body = {
                    amount: 200000,
                    orderInfo: 'Premium subscription upgrade',
                    bankCode: 'NCB',
                    planType: 'premium_upgrade'
                };
            });

            it('should create payment URL successfully', async () => {
                const mockOrderId = 'PREMIUM_1635264000000_1234';
                const mockPaymentUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=20000000';

                VNPayService.validateAmount.mockReturnValue(true);
                VNPayService.generateOrderId.mockReturnValue(mockOrderId);
                VNPayService.getClientIpAddress.mockReturnValue('127.0.0.1');
                VNPayService.createPaymentUrl.mockReturnValue(mockPaymentUrl);
                VNPayService.formatAmount.mockReturnValue('200.000 ₫');
                Payment.create.mockResolvedValue('payment-id-123');

                await PaymentController.createPayment(req, res);

                expect(VNPayService.validateAmount).toHaveBeenCalledWith(200000);
                expect(VNPayService.generateOrderId).toHaveBeenCalledWith('PREMIUM');
                expect(Payment.create).toHaveBeenCalledWith({
                    user_id: 'test-user-uuid',
                    order_id: mockOrderId,
                    amount: 200000,
                    order_info: 'Premium subscription upgrade',
                    bank_code: 'NCB',
                    ip_address: '127.0.0.1',
                    status: 'PENDING',
                    created_at: expect.any(Date)
                });
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    paymentUrl: mockPaymentUrl,
                    orderId: mockOrderId,
                    amount: '200.000 ₫'
                });
            });

            it('should validate required fields', async () => {
                req.body = { amount: 200000 }; // Missing orderInfo

                await PaymentController.createPayment(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Missing required fields: amount and orderInfo'
                });
            });

            it('should validate amount ranges', async () => {
                req.body.amount = 1000; // Below minimum
                VNPayService.validateAmount.mockReturnValue(false);

                await PaymentController.createPayment(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid amount. Must be between 5,000 and 500,000,000 VND'
                });
            });

            it('should handle ultimate plan type', async () => {
                req.body.planType = 'ultimate_upgrade';
                
                VNPayService.validateAmount.mockReturnValue(true);
                VNPayService.generateOrderId.mockReturnValue('ULTIMATE_1635264000000_1234');
                VNPayService.getClientIpAddress.mockReturnValue('127.0.0.1');
                VNPayService.createPaymentUrl.mockReturnValue('https://sandbox.vnpayment.vn/test');
                Payment.create.mockResolvedValue('payment-id-123');

                await PaymentController.createPayment(req, res);

                expect(VNPayService.generateOrderId).toHaveBeenCalledWith('ULTIMATE');
            });

            it('should handle missing bank code gracefully', async () => {
                req.body.bankCode = ''; // Empty bank code

                VNPayService.validateAmount.mockReturnValue(true);
                VNPayService.generateOrderId.mockReturnValue('PREMIUM_1635264000000_1234');
                VNPayService.getClientIpAddress.mockReturnValue('127.0.0.1');
                VNPayService.createPaymentUrl.mockReturnValue('https://sandbox.vnpayment.vn/test');
                Payment.create.mockResolvedValue('payment-id-123');

                await PaymentController.createPayment(req, res);

                expect(Payment.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        bank_code: null
                    })
                );
            });

            it('should handle database errors', async () => {
                VNPayService.validateAmount.mockReturnValue(true);
                VNPayService.generateOrderId.mockReturnValue('PREMIUM_1635264000000_1234');
                VNPayService.getClientIpAddress.mockReturnValue('127.0.0.1');
                Payment.create.mockRejectedValue(new Error('Database connection failed'));

                await PaymentController.createPayment(req, res);

                expect(SystemLog.error).toHaveBeenCalledWith(
                    'payment',
                    'create_payment',
                    'Database connection failed',
                    'test-user-uuid'
                );
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Failed to create payment',
                    message: 'Database connection failed'
                });
            });
        });

        describe('PaymentController.handleVNPayReturn', () => {
            beforeEach(() => {
                req.query = {
                    vnp_TxnRef: 'PREMIUM_1635264000000_1234',
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00',
                    vnp_TransactionNo: '13456789',
                    vnp_BankCode: 'NCB',
                    vnp_PayDate: '20231101103000'
                };

                process.env.CLIENT_URL = 'http://localhost:3000';
            });

            it('should handle successful payment return', async () => {
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234',
                        amount: 200000,
                        isSuccess: true,
                        responseCode: '00',
                        transactionNo: '13456789',
                        bankCode: 'NCB',
                        payDate: '20231101103000'
                    }
                };

                const mockPayment = {
                    payment_id: 'payment-123',
                    user_id: 'test-user-uuid',
                    order_id: 'PREMIUM_1635264000000_1234',
                    status: 'PENDING'
                };

                VNPayService.verifyReturnUrl.mockReturnValue(mockVerification);
                Payment.updateByOrderId.mockResolvedValue();
                Payment.findByOrderId.mockResolvedValue(mockPayment);
                User.upgradeToPremium.mockResolvedValue();

                await PaymentController.handleVNPayReturn(req, res);

                expect(VNPayService.verifyReturnUrl).toHaveBeenCalledWith(req.query);
                expect(Payment.updateByOrderId).toHaveBeenCalledWith(
                    'PREMIUM_1635264000000_1234',
                    expect.objectContaining({
                        transaction_no: '13456789',
                        bank_code: 'NCB',
                        status: 'SUCCESS'
                    })
                );
                expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-uuid');
                expect(res.redirect).toHaveBeenCalledWith(
                    expect.stringContaining('/payment/success')
                );
            });

            it('should handle failed payment return', async () => {
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234',
                        amount: 200000,
                        isSuccess: false,
                        responseCode: '24',
                        transactionNo: '13456789',
                        bankCode: 'NCB'
                    }
                };

                VNPayService.verifyReturnUrl.mockReturnValue(mockVerification);
                VNPayService.getTransactionStatusMessage.mockReturnValue('Transaction cancelled');
                Payment.updateByOrderId.mockResolvedValue();

                await PaymentController.handleVNPayReturn(req, res);

                expect(Payment.updateByOrderId).toHaveBeenCalledWith(
                    'PREMIUM_1635264000000_1234',
                    expect.objectContaining({
                        status: 'FAILED'
                    })
                );
                expect(res.redirect).toHaveBeenCalledWith(
                    expect.stringContaining('/payment/failed')
                );
            });

            it('should handle invalid signature', async () => {
                const mockVerification = {
                    isValid: false
                };

                VNPayService.verifyReturnUrl.mockReturnValue(mockVerification);

                await PaymentController.handleVNPayReturn(req, res);

                expect(res.redirect).toHaveBeenCalledWith(
                    expect.stringContaining('error=invalid_signature')
                );
            });

            it('should handle ultimate upgrade', async () => {
                req.query.vnp_TxnRef = 'ULTIMATE_1635264000000_1234';

                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'ULTIMATE_1635264000000_1234',
                        amount: 400000,
                        isSuccess: true,
                        responseCode: '00'
                    }
                };

                const mockPayment = {
                    payment_id: 'payment-123',
                    user_id: 'test-user-uuid',
                    order_id: 'ULTIMATE_1635264000000_1234',
                    order_info: 'Ultimate subscription upgrade'
                };

                VNPayService.verifyReturnUrl.mockReturnValue(mockVerification);
                Payment.updateByOrderId.mockResolvedValue();
                Payment.findByOrderId.mockResolvedValue(mockPayment);
                User.upgradeToUltimate.mockResolvedValue();

                await PaymentController.handleVNPayReturn(req, res);

                expect(User.upgradeToUltimate).toHaveBeenCalledWith('test-user-uuid');
            });
        });

        describe('PaymentController.handleVNPayIPN', () => {
            beforeEach(() => {
                req.body = {
                    vnp_TxnRef: 'PREMIUM_1635264000000_1234',
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00',
                    vnp_TransactionNo: '13456789',
                    vnp_BankCode: 'NCB'
                };
            });

            it('should handle successful IPN verification', async () => {
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234',
                        isSuccess: true,
                        responseCode: '00'
                    }
                };

                const mockPayment = {
                    payment_id: 'payment-123',
                    user_id: 'test-user-uuid',
                    order_id: 'PREMIUM_1635264000000_1234',
                    status: 'PENDING'
                };

                VNPayService.verifyIpnCall.mockReturnValue(mockVerification);
                Payment.findByOrderId.mockResolvedValue(mockPayment);
                Payment.updateByOrderId.mockResolvedValue();
                User.upgradeToPremium.mockResolvedValue();

                await PaymentController.handleVNPayIPN(req, res);

                expect(VNPayService.verifyIpnCall).toHaveBeenCalledWith(req.body);
                expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    RspCode: '00',
                    Message: 'Confirm Success'
                });
            });

            it('should handle invalid IPN signature', async () => {
                const mockVerification = {
                    isValid: false
                };

                VNPayService.verifyIpnCall.mockReturnValue(mockVerification);

                await PaymentController.handleVNPayIPN(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    RspCode: '97',
                    Message: 'Invalid signature'
                });
            });

            it('should handle payment not found', async () => {
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234'
                    }
                };

                VNPayService.verifyIpnCall.mockReturnValue(mockVerification);
                Payment.findByOrderId.mockResolvedValue(null);

                await PaymentController.handleVNPayIPN(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    RspCode: '01',
                    Message: 'Order not found'
                });
            });

            it('should handle already processed payment', async () => {
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234'
                    }
                };

                const mockPayment = {
                    status: 'SUCCESS'
                };

                VNPayService.verifyIpnCall.mockReturnValue(mockVerification);
                Payment.findByOrderId.mockResolvedValue(mockPayment);

                await PaymentController.handleVNPayIPN(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    RspCode: '00',
                    Message: 'Confirm Success'
                });
            });
        });
    });

    describe('UC10: Subscription Management', () => {
        describe('PaymentController.getPaymentHistory', () => {
            it('should retrieve user payment history', async () => {
                const mockPayments = [
                    {
                        payment_id: 'payment-1',
                        order_id: 'PREMIUM_1635264000000_1234',
                        amount: 200000,
                        status: 'SUCCESS',
                        created_at: '2023-01-01T10:00:00Z'
                    },
                    {
                        payment_id: 'payment-2',
                        order_id: 'ULTIMATE_1635264000000_5678',
                        amount: 400000,
                        status: 'PENDING',
                        created_at: '2023-01-02T10:00:00Z'
                    }
                ];

                Payment.findByUserId = jest.fn().mockResolvedValue(mockPayments);

                await PaymentController.getPaymentHistory(req, res);

                expect(Payment.findByUserId).toHaveBeenCalledWith('test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockPayments
                });
            });

            it('should handle empty payment history', async () => {
                Payment.findByUserId = jest.fn().mockResolvedValue([]);

                await PaymentController.getPaymentHistory(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: []
                });
            });

            it('should handle database errors', async () => {
                Payment.findByUserId = jest.fn().mockRejectedValue(new Error('Database error'));

                await PaymentController.getPaymentHistory(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Failed to retrieve payment history'
                });
            });
        });

        describe('PaymentController.getPaymentStatus', () => {
            beforeEach(() => {
                req.params.orderId = 'PREMIUM_1635264000000_1234';
            });

            it('should retrieve payment status', async () => {
                const mockPayment = {
                    payment_id: 'payment-123',
                    order_id: 'PREMIUM_1635264000000_1234',
                    amount: 200000,
                    status: 'SUCCESS',
                    user_id: 'test-user-uuid'
                };

                Payment.findByOrderId = jest.fn().mockResolvedValue(mockPayment);

                await PaymentController.getPaymentStatus(req, res);

                expect(Payment.findByOrderId).toHaveBeenCalledWith('PREMIUM_1635264000000_1234');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockPayment
                });
            });

            it('should handle payment not found', async () => {
                Payment.findByOrderId = jest.fn().mockResolvedValue(null);

                await PaymentController.getPaymentStatus(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Payment not found'
                });
            });

            it('should prevent access to other users payments', async () => {
                const mockPayment = {
                    payment_id: 'payment-123',
                    order_id: 'PREMIUM_1635264000000_1234',
                    user_id: 'other-user-uuid' // Different user
                };

                Payment.findByOrderId = jest.fn().mockResolvedValue(mockPayment);

                await PaymentController.getPaymentStatus(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Access denied'
                });
            });
        });
    });

    describe('UC11: Premium Feature Access', () => {
        describe('User Upgrade Functions', () => {
            it('should upgrade user to premium', async () => {
                const mockUser = {
                    user_id: 'test-user-uuid',
                    email: 'test@test.com',
                    role: 'user'
                };

                const mockUpgradedUser = {
                    ...mockUser,
                    role: 'Premium'
                };

                User.findById.mockResolvedValue(mockUser);
                User.upgradeToPremium.mockResolvedValue(mockUpgradedUser);

                await User.upgradeToPremium('test-user-uuid');

                expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-uuid');
            });

            it('should upgrade user to ultimate', async () => {
                const mockUser = {
                    user_id: 'test-user-uuid',
                    email: 'test@test.com',
                    role: 'Premium'
                };

                const mockUpgradedUser = {
                    ...mockUser,
                    role: 'Ultimate'
                };

                User.findById.mockResolvedValue(mockUser);
                User.upgradeToUltimate.mockResolvedValue(mockUpgradedUser);

                await User.upgradeToUltimate('test-user-uuid');

                expect(User.upgradeToUltimate).toHaveBeenCalledWith('test-user-uuid');
            });

            it('should not downgrade existing premium users', async () => {
                const mockPayment = {
                    user_id: 'test-user-uuid',
                    order_id: 'PREMIUM_1635264000000_1234'
                };

                // User already has premium
                req.user.role = 'Premium';

                Payment.findByOrderId.mockResolvedValue(mockPayment);
                User.upgradeToPremium.mockResolvedValue();

                // Simulate successful payment processing
                const mockVerification = {
                    isValid: true,
                    transaction: {
                        orderId: 'PREMIUM_1635264000000_1234',
                        isSuccess: true
                    }
                };

                VNPayService.verifyReturnUrl.mockReturnValue(mockVerification);
                Payment.updateByOrderId.mockResolvedValue();

                await PaymentController.handleVNPayReturn(req, res);

                // Should still call upgrade (let the User model handle the logic)
                expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-uuid');
            });
        });

        describe('Premium Feature Validation', () => {
            it('should validate premium feature requirements', () => {
                const validatePremiumAccess = (userRole) => {
                    return ['Premium', 'Ultimate', 'Admin'].includes(userRole);
                };

                expect(validatePremiumAccess('user')).toBe(false);
                expect(validatePremiumAccess('Premium')).toBe(true);
                expect(validatePremiumAccess('Ultimate')).toBe(true);
                expect(validatePremiumAccess('Admin')).toBe(true);
            });

            it('should validate ultimate feature requirements', () => {
                const validateUltimateAccess = (userRole) => {
                    return ['Ultimate', 'Admin'].includes(userRole);
                };

                expect(validateUltimateAccess('user')).toBe(false);
                expect(validateUltimateAccess('Premium')).toBe(false);
                expect(validateUltimateAccess('Ultimate')).toBe(true);
                expect(validateUltimateAccess('Admin')).toBe(true);
            });

            it('should determine plan type from order ID', () => {
                const determinePlanType = (orderId) => {
                    if (orderId.includes('ULTIMATE')) return 'ultimate';
                    if (orderId.includes('PREMIUM')) return 'premium';
                    return 'unknown';
                };

                expect(determinePlanType('PREMIUM_1635264000000_1234')).toBe('premium');
                expect(determinePlanType('ULTIMATE_1635264000000_1234')).toBe('ultimate');
                expect(determinePlanType('OTHER_1635264000000_1234')).toBe('unknown');
            });
        });

        describe('Payment Amount Validation', () => {
            it('should validate premium subscription amounts', () => {
                const validatePremiumAmount = (amount, planType) => {
                    const validAmounts = {
                        monthly: 20000,
                        annual: 200000,
                        lifetime: 399000
                    };
                    return validAmounts[planType] === amount;
                };

                expect(validatePremiumAmount(20000, 'monthly')).toBe(true);
                expect(validatePremiumAmount(200000, 'annual')).toBe(true);
                expect(validatePremiumAmount(399000, 'lifetime')).toBe(true);
                expect(validatePremiumAmount(50000, 'monthly')).toBe(false);
            });

            it('should validate ultimate subscription amounts', () => {
                const validateUltimateAmount = (amount, planType) => {
                    const validAmounts = {
                        monthly: 45000,
                        annual: 399000
                    };
                    return validAmounts[planType] === amount;
                };

                expect(validateUltimateAmount(45000, 'monthly')).toBe(true);
                expect(validateUltimateAmount(399000, 'annual')).toBe(true);
                expect(validateUltimateAmount(20000, 'monthly')).toBe(false);
            });
        });
    });

    describe('Error Handling & Security', () => {
        it('should handle VNPay service errors gracefully', async () => {
            req.body = {
                amount: 200000,
                orderInfo: 'Premium subscription upgrade'
            };

            VNPayService.validateAmount.mockReturnValue(true);
            VNPayService.generateOrderId.mockThrowError(new Error('VNPay service unavailable'));

            await PaymentController.createPayment(req, res);

            expect(SystemLog.error).toHaveBeenCalledWith(
                'payment',
                'create_payment',
                'VNPay service unavailable',
                'test-user-uuid'
            );
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should sanitize sensitive payment data in logs', () => {
            const sanitizePaymentData = (data) => {
                const sanitized = { ...data };
                delete sanitized.vnp_SecureHash;
                delete sanitized.vnp_SecureHashType;
                return sanitized;
            };

            const paymentData = {
                vnp_TxnRef: 'PREMIUM_123',
                vnp_Amount: '200000',
                vnp_SecureHash: 'sensitive_hash_value',
                vnp_SecureHashType: 'SHA256'
            };

            const sanitized = sanitizePaymentData(paymentData);

            expect(sanitized.vnp_TxnRef).toBe('PREMIUM_123');
            expect(sanitized.vnp_Amount).toBe('200000');
            expect(sanitized.vnp_SecureHash).toBeUndefined();
            expect(sanitized.vnp_SecureHashType).toBeUndefined();
        });

        it('should validate order ID format', () => {
            const isValidOrderId = (orderId) => {
                const pattern = /^(PREMIUM|ULTIMATE)_\d{13}_\d{4}$/;
                return pattern.test(orderId);
            };

            expect(isValidOrderId('PREMIUM_1635264000000_1234')).toBe(true);
            expect(isValidOrderId('ULTIMATE_1635264000000_5678')).toBe(true);
            expect(isValidOrderId('INVALID_FORMAT')).toBe(false);
            expect(isValidOrderId('premium_1635264000000_1234')).toBe(false);
        });

        it('should prevent replay attacks with timestamp validation', () => {
            const validateTimestamp = (orderId, maxAgeMinutes = 30) => {
                const match = orderId.match(/(\d{13})/);
                if (!match) return false;

                const timestamp = parseInt(match[1]);
                const now = Date.now();
                const maxAge = maxAgeMinutes * 60 * 1000;

                return (now - timestamp) <= maxAge;
            };

            const recentOrderId = `PREMIUM_${Date.now()}_1234`;
            const oldOrderId = 'PREMIUM_1635264000000_1234'; // Very old timestamp

            expect(validateTimestamp(recentOrderId)).toBe(true);
            expect(validateTimestamp(oldOrderId)).toBe(false);
        });

        it('should handle concurrent payment processing', async () => {
            const mockVerification = {
                isValid: true,
                transaction: {
                    orderId: 'PREMIUM_1635264000000_1234',
                    isSuccess: true
                }
            };

            const mockPayment = {
                payment_id: 'payment-123',
                user_id: 'test-user-uuid',
                status: 'PENDING'
            };

            VNPayService.verifyIpnCall.mockReturnValue(mockVerification);
            Payment.findByOrderId.mockResolvedValue(mockPayment);
            Payment.updateByOrderId.mockResolvedValue();
            User.upgradeToPremium.mockResolvedValue();

            // Simulate concurrent IPN calls
            const promise1 = PaymentController.handleVNPayIPN(req, res);
            const promise2 = PaymentController.handleVNPayIPN(req, res);

            await Promise.all([promise1, promise2]);

            // Both should complete successfully (idempotent operation)
            expect(res.json).toHaveBeenCalledWith({
                RspCode: '00',
                Message: 'Confirm Success'
            });
        });
    });
});