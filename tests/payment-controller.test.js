/**
 * Payment Controller Tests
 */

const { 
    createPayment, 
    getPaymentStatus, 
    getPaymentHistory,
    handleVNPayCallback,
    refundPayment
} = require('../__mocks__/paymentController');

describe('Payment Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    
    beforeEach(() => {
        // Mock request and response objects
        mockRequest = {
            params: {},
            body: {},
            query: {},
            user: {
                id: 'user123',
                email: 'test@example.com'
            }
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn()
        };
    });
    
    describe('UC10: Payment Processing', () => {
        it('should create a new payment', async () => {
            // Setup request body
            mockRequest.body = {
                amount: 100000,
                orderInfo: 'Premium subscription',
                returnUrl: 'http://example.com/return'
            };
            
            // Call the controller
            await createPayment(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentUrl: expect.stringContaining('vnpayment.vn'),
                    orderId: expect.any(String),
                    amount: 100000
                })
            );
        });
        
        it('should get payment status', async () => {
            // Setup request params
            mockRequest.params = { paymentId: 'pay123' };
            
            // Call the controller
            await getPaymentStatus(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'pay123',
                    status: expect.any(String),
                    amount: expect.any(Number),
                    createdAt: expect.any(String)
                })
            );
        });
        
        it('should retrieve payment history', async () => {
            // Call the controller
            await getPaymentHistory(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        amount: expect.any(Number),
                        status: expect.any(String),
                        createdAt: expect.any(String)
                    })
                ])
            );
        });
        
        it('should handle VNPay callback', async () => {
            // Setup request query - simulating VNPay response
            mockRequest.query = {
                vnp_ResponseCode: '00',
                vnp_TxnRef: 'order123',
                vnp_Amount: '10000000', // VNPay returns amount * 100
                vnp_TransactionNo: 'txn123',
                vnp_BankCode: 'NCB',
                vnp_PayDate: '20220101120000',
                vnp_OrderInfo: 'Premium subscription',
                vnp_SecureHash: 'validHash123'
            };
            
            // Call the controller
            await handleVNPayCallback(mockRequest, mockResponse);
            
            // Check response - should redirect to success page
            expect(mockResponse.redirect).toHaveBeenCalledWith(
                expect.stringContaining('success')
            );
        });
        
        it('should handle failed VNPay callback', async () => {
            // Setup request query - simulating failed VNPay response
            mockRequest.query = {
                vnp_ResponseCode: '24', // Error code
                vnp_TxnRef: 'order123',
                vnp_Amount: '10000000',
                vnp_TransactionNo: 'txn123',
                vnp_BankCode: 'NCB',
                vnp_PayDate: '20220101120000',
                vnp_OrderInfo: 'Premium subscription',
                vnp_SecureHash: 'validHash123'
            };
            
            // Call the controller
            await handleVNPayCallback(mockRequest, mockResponse);
            
            // Check response - should redirect to failure page
            expect(mockResponse.redirect).toHaveBeenCalledWith(
                expect.stringContaining('failure')
            );
        });
        
        it('should process refund request', async () => {
            // Setup request body
            mockRequest.body = {
                paymentId: 'pay123',
                reason: 'Customer request'
            };
            
            // Setup request params
            mockRequest.params = { paymentId: 'pay123' };
            
            // Call the controller
            await refundPayment(mockRequest, mockResponse);
            
            // Check response
            const response = mockResponse.json.mock.calls[0][0];
            
            // Check individual properties
            expect(response.success).toBe(true);
            expect(typeof response.refundId).toBe('string');
            expect(response.message.toLowerCase()).toContain('refund');
            expect(response.payment.id).toBe('pay123');
            expect(response.payment.status).toBe('REFUNDED');
        });
    });
});