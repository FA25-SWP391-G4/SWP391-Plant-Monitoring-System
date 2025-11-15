const { handleVNPayReturn, handleRedirect } = require('./paymentUtils');
const VNPayService = require('../services/VNPayService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const originalHandleRedirect = require('./paymentUtils').handleRedirect;

// Mock dependencies
jest.mock('../services/VNPayService');
jest.mock('../models/Payment');
jest.mock('../models/User');
jest.mock('../models/SystemLog');


describe('Payment Utils', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            query: {
                vnp_Amount: '10000000',
                vnp_BankCode: 'NCB',
                vnp_OrderInfo: 'Premium upgrade',
                vnp_ResponseCode: '00',
                vnp_TxnRef: 'ORDER123',
                vnp_SecureHash: 'valid_hash'
            }
        };

        mockRes = {
            redirect: jest.fn(),
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Clear environment variables
        delete process.env.FRONTEND_PAYMENT_RESULT_URL;

        // Clear all mocks
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    describe('handleVNPayReturn', () => {
        it('should handle successful payment with user upgrade', async () => {
            const mockPayment = {
                payment_id: 'PAY123',
                user_id: 'USER123',
                status: 'pending',
                markAsCompleted: jest.fn()
            };

            const mockUser = {
                role: 'user',
                update: jest.fn()
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                isSuccess: true,
                orderId: 'ORDER123',
                amount: '100000',
                responseCode: '00',
                message: 'Success',
                transactionNo: 'TXN123',
                payDate: '20231201120000'
            });

            Payment.findByVNPayTxnRef.mockResolvedValue(mockPayment);
            User.findById.mockResolvedValue(mockUser);
            SystemLog.create.mockResolvedValue({});

            await handleVNPayReturn(mockReq, mockRes);

            expect(VNPayService.verifyReturnUrl).toHaveBeenCalledWith(mockReq.query);
            expect(Payment.findByVNPayTxnRef).toHaveBeenCalledWith('ORDER123');
            expect(mockPayment.markAsCompleted).toHaveBeenCalled();
            expect(User.findById).toHaveBeenCalledWith('USER123');
            expect(mockUser.update).toHaveBeenCalledWith({ role: 'premium' });
            expect(SystemLog.create).toHaveBeenCalledWith(
                'INFO',
                'Payment',
                'User USER123 upgraded from user to premium via payment PAY123'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', expect.stringContaining('http://localhost:3000/payment/result'));
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle successful payment without user upgrade (already premium)', async () => {
            const mockPayment = {
                payment_id: 'PAY123',
                user_id: 'USER123',
                status: 'pending',
                markAsCompleted: jest.fn()
            };

            const mockUser = {
                role: 'premium',
                update: jest.fn()
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                isSuccess: true,
                orderId: 'ORDER123',
                amount: '100000',
                responseCode: '00',
                message: 'Success'
            });

            Payment.findByVNPayTxnRef.mockResolvedValue(mockPayment);
            User.findById.mockResolvedValue(mockUser);

            await handleVNPayReturn(mockReq, mockRes);

            expect(mockPayment.markAsCompleted).toHaveBeenCalled();
            expect(mockUser.update).not.toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle failed payment', async () => {
            const mockPayment = {
                payment_id: 'PAY123',
                status: 'pending',
                markAsFailed: jest.fn()
            };

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                isSuccess: false,
                orderId: 'ORDER123',
                amount: '100000',
                responseCode: '10',
                message: 'Failed'
            });

            Payment.findByVNPayTxnRef.mockResolvedValue(mockPayment);
            SystemLog.create.mockResolvedValue({});

            await handleVNPayReturn(mockReq, mockRes);

            expect(mockPayment.markAsFailed).toHaveBeenCalled();
            expect(SystemLog.create).toHaveBeenCalledWith(
                'WARNING',
                'Payment',
                'Payment PAY123 failed with code 10'
            );
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle VNPay verification error', async () => {
            VNPayService.verifyReturnUrl.mockImplementation(() => {
                throw new Error('Verification failed');
            });

            await handleVNPayReturn(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith('Error verifying VNPay return URL:', expect.any(Error));
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', 'http://localhost:3000/payment/result?code=99&message=Verification%20error');
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle invalid signature', async () => {
            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: false,
                orderId: 'ORDER123'
            });

            await handleVNPayReturn(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith('Invalid VNPay signature in return URL');
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', 'http://localhost:3000/payment/result?code=97&message=Invalid%20payment%20signature');
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle payment not found', async () => {
            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                orderId: 'ORDER123'
            });

            Payment.findByVNPayTxnRef.mockResolvedValue(null);

            await handleVNPayReturn(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith('Payment not found for orderId: ORDER123');
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', 'http://localhost:3000/payment/result?code=91&message=Payment%20not%20found&orderId=ORDER123');
            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should use custom frontend URL from environment', async () => {
            process.env.FRONTEND_PAYMENT_RESULT_URL = 'https://example.com/payment/result';

            VNPayService.verifyReturnUrl.mockImplementation(() => {
                throw new Error('Verification failed');
            });

            await handleVNPayReturn(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', 'https://example.com/payment/result?code=99&message=Verification%20error');
        });

        it('should handle URL construction error', async () => {
            const mockPayment = {
                payment_id: 'PAY123',
                status: 'completed',
                markAsCompleted: jest.fn()
            };

            // Mock URL constructor to throw error
            const originalURL = global.URL;
            global.URL = jest.fn().mockImplementation(() => {
                throw new Error('Invalid URL');
            });

            VNPayService.verifyReturnUrl.mockReturnValue({
                isValid: true,
                isSuccess: true,
                orderId: 'ORDER123',
                responseCode: '00',
                message: 'Success'
            });

            Payment.findByVNPayTxnRef.mockResolvedValue(mockPayment);

            await handleVNPayReturn(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith('Error building redirect URL:', expect.any(Error));
            expect(mockRes.redirect).toHaveBeenCalled();

            // Restore URL constructor
            global.URL = originalURL;
        });

        it('should handle general error with JSON fallback', async () => {
            VNPayService.verifyReturnUrl.mockImplementation(() => {
                throw new Error('General error');
            });

            // Mock handleRedirect to throw error
            const mockHandleRedirect = jest.fn().mockImplementation(() => {
                throw new Error('Redirect failed');
            });

            // We need to test the scenario where both redirect attempts fail
            const mockError = new Error('Test error');
            mockReq.query = null; // This will cause an error

            await handleVNPayReturn(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                code: '99',
                message: 'Server error processing payment'
            });
        });
    });

    describe('handleRedirect', () => {
        it('should set headers and redirect with valid URL', () => {
            const url = 'https://example.com/payment/result';

            handleRedirect(mockRes, url);

            expect(mockRes.setHeader).toHaveBeenCalledWith('x-direct-redirect', url);
            expect(mockRes.redirect).toHaveBeenCalledWith(url);
        });

        it('should return error for invalid URL', () => {
            handleRedirect(mockRes, null);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid redirect URL'
            });
        });

        it('should return error for empty URL', () => {
            handleRedirect(mockRes, '');

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid redirect URL'
            });
        });
    });
});