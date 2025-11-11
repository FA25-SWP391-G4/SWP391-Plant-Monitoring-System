const request = require('supertest');
const app = require('../app');
const VNPayService = require('../services/vnpayService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

// Mock all external dependencies
jest.mock('../services/vnpayService');
jest.mock('../models/Payment');
jest.mock('../models/User');
jest.mock('../models/SystemLog');

describe('Payment Controller Tests', () => {
    let authToken;
    let mockUser;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup mock user
        mockUser = {
            user_id: 'test-user-123',
            email: 'test@example.com',
            username: 'testuser'
        };

        // Mock auth token (you might need to adjust this based on your auth implementation)
        authToken = 'Bearer test-jwt-token';

        // Setup default mocks
        SystemLog.log = jest.fn().mockResolvedValue(true);
        SystemLog.error = jest.fn().mockResolvedValue(true);
        Payment.create = jest.fn().mockResolvedValue('payment-id-123');
        Payment.findByOrderId = jest.fn();
        Payment.updateStatus = jest.fn().mockResolvedValue(true);
        User.upgradeToPremium = jest.fn().mockResolvedValue(true);
        User.findById = jest.fn().mockResolvedValue(mockUser);
        
        // Setup VNPayService mocks
        VNPayService.validateAmount = jest.fn().mockReturnValue(true);
        VNPayService.generateOrderId = jest.fn().mockReturnValue('PREMIUM_1635264000000_1234');
        VNPayService.getClientIpAddress = jest.fn().mockReturnValue('127.0.0.1');
        VNPayService.createPaymentUrl = jest.fn().mockReturnValue('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_Command=pay');
        VNPayService.formatAmount = jest.fn().mockReturnValue('100.000 ₫');
        VNPayService.verifyReturnUrl = jest.fn();
        VNPayService.verifyIpnCall = jest.fn();
        VNPayService.getTransactionStatusMessage = jest.fn();
    });

    describe('Payment Creation Tests', () => {
        const validPaymentData = {
            amount: 100000,
            orderInfo: 'Premium subscription upgrade',
            bankCode: 'NCB'
        };

        test('Should create payment successfully with valid data', async () => {
            const response = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send(validPaymentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toBeDefined();
            expect(response.body.orderId).toBeDefined();
            expect(VNPayService.createPaymentUrl).toHaveBeenCalled();
            expect(Payment.create).toHaveBeenCalled();
        });

        test('Should reject payment with invalid amount', async () => {
            VNPayService.validateAmount.mockReturnValue(false);

            const response = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send({
                    ...validPaymentData,
                    amount: 1000 // Below minimum
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid amount');
        });

        test('Should reject payment with missing required fields', async () => {
            const response = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send({
                    amount: 100000
                    // Missing orderInfo
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });
    });

    describe('VNPay Return URL Tests - Test Card Scenarios', () => {
        const baseReturnData = {
            vnp_TxnRef: 'PREMIUM_1635264000000_1234',
            vnp_Amount: '10000000',
            vnp_OrderInfo: 'Premium subscription upgrade',
            vnp_TransactionNo: '13456789',
            vnp_BankCode: 'NCB',
            vnp_PayDate: '20231026120000',
            vnp_TransactionStatus: '00'
        };

        beforeEach(() => {
            Payment.findByOrderId.mockResolvedValue({
                payment_id: 'payment-123',
                user_id: 'test-user-123',
                amount: 100000,
                status: 'PENDING'
            });
        });

        test('Test Card 1: Successful payment - NCB 9704198526191432198', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '00', // Success
                vnp_CardType: 'ATM',
                vnp_BankCode: 'NCB'
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: true,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue('Giao dịch thành công');

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302); // Redirect
            expect(response.headers.location).toContain('/payment/success');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'COMPLETED',
                expect.any(Object)
            );
            expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-123');
        });

        test('Test Card 2: Insufficient funds - NCB 9704195798459170488', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '51', // Insufficient funds
                vnp_BankCode: 'NCB'
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: false,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue(
                'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.'
            );

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=51');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'FAILED',
                expect.any(Object)
            );
            expect(User.upgradeToPremium).not.toHaveBeenCalled();
        });

        test('Test Card 3: Card not activated - NCB 9704192181368742', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '09', // Card not registered for internet banking
                vnp_BankCode: 'NCB'
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: false,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue(
                'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.'
            );

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=09');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'FAILED',
                expect.any(Object)
            );
        });

        test('Test Card 4: Card blocked - NCB 9704193370791314', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '12', // Card/Account blocked
                vnp_BankCode: 'NCB'
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: false,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue(
                'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.'
            );

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=12');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'FAILED',
                expect.any(Object)
            );
        });

        test('Test Card 5: Card expired - NCB 9704194841945513', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '11', // Transaction timeout/expired
                vnp_BankCode: 'NCB'
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: false,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue(
                'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.'
            );

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=11');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'FAILED',
                expect.any(Object)
            );
        });

        test('Test Card 6: International VISA card success - 4456530000001005', async () => {
            const returnData = {
                ...baseReturnData,
                vnp_ResponseCode: '00', // Success
                vnp_CardType: 'VISA',
                vnp_BankCode: 'INTCARD' // International card
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...returnData,
                    isSuccess: true,
                    amount: 100000
                }
            });

            VNPayService.getTransactionStatusMessage.mockReturnValue('Giao dịch thành công');

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(returnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/success');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                returnData.vnp_TxnRef,
                'COMPLETED',
                expect.any(Object)
            );
            expect(User.upgradeToPremium).toHaveBeenCalledWith('test-user-123');
        });

        test('Should handle invalid signature', async () => {
            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: false,
                message: 'Invalid signature'
            });

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(baseReturnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=invalid_signature');
        });

        test('Should handle payment not found', async () => {
            Payment.findByOrderId.mockResolvedValue(null);

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                transaction: {
                    ...baseReturnData,
                    isSuccess: true,
                    amount: 100000
                }
            });

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(baseReturnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=payment_not_found');
        });
    });

    describe('VNPay IPN Tests', () => {
        const baseIpnData = {
            vnp_TxnRef: 'PREMIUM_1635264000000_1234',
            vnp_Amount: '10000000',
            vnp_OrderInfo: 'Premium subscription upgrade',
            vnp_ResponseCode: '00',
            vnp_TransactionNo: '13456789',
            vnp_BankCode: 'NCB',
            vnp_PayDate: '20231026120000',
            vnp_TransactionStatus: '00'
        };

        beforeEach(() => {
            Payment.findByOrderId.mockResolvedValue({
                payment_id: 'payment-123',
                user_id: 'test-user-123',
                amount: 100000,
                status: 'PENDING'
            });
        });

        test('Should process successful IPN notification', async () => {
            VNPayService.verifyIpnCall.mockReturnValue({
                isValid: true,
                transaction: {
                    ...baseIpnData,
                    isSuccess: true,
                    amount: 100000
                }
            });

            const response = await request(app)
                .get('/api/payment/vnpay-ipn')
                .query(baseIpnData);

            expect(response.status).toBe(200);
            expect(response.body.RspCode).toBe('00');
            expect(response.body.Message).toBe('Confirm Success');
            expect(Payment.updateStatus).toHaveBeenCalled();
        });

        test('Should handle failed IPN with insufficient funds', async () => {
            const ipnData = {
                ...baseIpnData,
                vnp_ResponseCode: '51' // Insufficient funds
            };

            VNPayService.verifyIpnCall.mockReturnValue({
                isValid: true,
                transaction: {
                    ...ipnData,
                    isSuccess: false,
                    amount: 100000
                }
            });

            const response = await request(app)
                .get('/api/payment/vnpay-ipn')
                .query(ipnData);

            expect(response.status).toBe(200);
            expect(response.body.RspCode).toBe('00');
            expect(response.body.Message).toBe('Confirm Success');
            expect(Payment.updateStatus).toHaveBeenCalledWith(
                ipnData.vnp_TxnRef,
                'FAILED',
                expect.any(Object)
            );
        });

        test('Should reject invalid IPN signature', async () => {
            VNPayService.verifyIpnCall.mockReturnValue({
                isValid: false,
                message: 'Invalid signature'
            });

            const response = await request(app)
                .get('/api/payment/vnpay-ipn')
                .query(baseIpnData);

            expect(response.status).toBe(200);
            expect(response.body.RspCode).toBe('97');
            expect(response.body.Message).toBe('Invalid signature');
        });
    });

    describe('Payment Status Retrieval Tests', () => {
        test('Should get payment status successfully', async () => {
            const mockPayment = {
                payment_id: 'payment-123',
                order_id: 'PREMIUM_1635264000000_1234',
                amount: 100000,
                status: 'COMPLETED',
                created_at: new Date(),
                transaction_no: '13456789'
            };

            Payment.findByOrderId.mockResolvedValue(mockPayment);

            const response = await request(app)
                .get('/api/payment/status/PREMIUM_1635264000000_1234')
                .set('Authorization', authToken);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.payment).toEqual(mockPayment);
        });

        test('Should return 404 for non-existent payment', async () => {
            Payment.findByOrderId.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/payment/status/NON_EXISTENT_ORDER')
                .set('Authorization', authToken);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Payment not found');
        });
    });

    describe('VNPayService Unit Tests', () => {
        // Reset mocks for unit testing the service directly
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
        });

        test('Should validate amount correctly', () => {
            const VNPayService = require('../services/vnpayService');
            
            expect(VNPayService.validateAmount(10000)).toBe(true);
            expect(VNPayService.validateAmount(1000)).toBe(false); // Below minimum
            expect(VNPayService.validateAmount(500000001)).toBe(false); // Above maximum
            expect(VNPayService.validateAmount('invalid')).toBe(false);
        });

        test('Should generate unique order IDs', () => {
            const VNPayService = require('../services/vnpayService');
            
            const orderId1 = VNPayService.generateOrderId('TEST');
            const orderId2 = VNPayService.generateOrderId('TEST');
            
            expect(orderId1).toContain('TEST_');
            expect(orderId2).toContain('TEST_');
            expect(orderId1).not.toBe(orderId2);
        });

        test('Should format amount correctly', () => {
            const VNPayService = require('../services/vnpayService');
            
            const formatted = VNPayService.formatAmount(100000);
            expect(formatted).toContain('100');
            expect(formatted).toContain('₫');
        });

        test('Should get correct transaction status messages', () => {
            const VNPayService = require('../services/vnpayService');
            
            expect(VNPayService.getTransactionStatusMessage('00')).toBe('Giao dịch thành công');
            expect(VNPayService.getTransactionStatusMessage('51')).toContain('không đủ số dư');
            expect(VNPayService.getTransactionStatusMessage('12')).toContain('bị khóa');
            expect(VNPayService.getTransactionStatusMessage('09')).toContain('chưa đăng ký');
            expect(VNPayService.getTransactionStatusMessage('11')).toContain('hết hạn');
        });
    });

    describe('Error Handling Tests', () => {
        test('Should handle database errors gracefully', async () => {
            Payment.create.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send({
                    amount: 100000,
                    orderInfo: 'Premium subscription upgrade'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to create payment');
            expect(SystemLog.error).toHaveBeenCalled();
        });

        test('Should handle VNPay service errors', async () => {
            VNPayService.createPaymentUrl.mockImplementation(() => {
                throw new Error('VNPay service unavailable');
            });

            const response = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send({
                    amount: 100000,
                    orderInfo: 'Premium subscription upgrade'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to create payment');
        });
    });
});