const request = require('supertest');
const app = require('../app');
const mockVNPayService = require('../__mocks__/vnpayService');

// Integration tests for complete payment flow
describe('Payment Integration Tests - Test Card Scenarios', () => {
    let authToken;
    let mockUser;

    beforeAll(async () => {
        // Setup test environment
        process.env.NODE_ENV = 'test';
        process.env.VNPAY_TMN_CODE = 'TEST_TMN_CODE';
        process.env.VNPAY_HASH_SECRET = 'TEST_HASH_SECRET';
        process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
        process.env.VNPAY_RETURN_URL = 'http://localhost:3000/api/payment/vnpay-return';
        process.env.CLIENT_URL = 'http://localhost:3001';
    });

    beforeEach(() => {
        // Setup mock user and auth
        mockUser = {
            user_id: 'test-user-123',
            email: 'test@example.com',
            username: 'testuser',
            is_premium: false
        };

        // Mock JWT auth token (adjust based on your auth implementation)
        authToken = 'Bearer test-jwt-token';
        
        // Reset all mocks
        jest.clearAllMocks();
    });

    const testScenarios = {
        success: {
            cardNumber: '9704198526191432198',
            cardName: 'NGUYEN VAN A',
            bank: 'NCB',
            expectedResult: 'SUCCESS',
            description: 'Successful payment with sufficient balance'
        },
        insufficientFunds: {
            cardNumber: '9704195798459170488',
            cardName: 'NGUYEN VAN A',
            bank: 'NCB',
            expectedResult: 'FAILED',
            expectedCode: '51',
            description: 'Payment failed due to insufficient funds'
        },
        cardNotActivated: {
            cardNumber: '9704192181368742',
            cardName: 'NGUYEN VAN A',
            bank: 'NCB',
            expectedResult: 'FAILED',
            expectedCode: '09',
            description: 'Payment failed - card not activated for internet banking'
        },
        cardBlocked: {
            cardNumber: '9704193370791314',
            cardName: 'NGUYEN VAN A',
            bank: 'NCB',
            expectedResult: 'FAILED',
            expectedCode: '12',
            description: 'Payment failed - card is blocked'
        },
        cardExpired: {
            cardNumber: '9704194841945513',
            cardName: 'NGUYEN VAN A',
            bank: 'NCB',
            expectedResult: 'FAILED',
            expectedCode: '11',
            description: 'Payment failed - card expired'
        },
        internationalVisa: {
            cardNumber: '4456530000001005',
            cardName: 'NGUYEN VAN A',
            cardType: 'VISA',
            expectedResult: 'SUCCESS',
            description: 'Successful payment with international VISA card'
        }
    };

    describe('Complete Payment Flow Tests', () => {
        Object.entries(testScenarios).forEach(([scenarioName, scenario]) => {
            test(`${scenarioName}: ${scenario.description}`, async () => {
                // Step 1: Create payment request
                const paymentData = {
                    amount: 100000, // 100,000 VND
                    orderInfo: `Premium subscription upgrade - Test ${scenarioName}`,
                    bankCode: scenario.bank || 'NCB'
                };

                const createResponse = await request(app)
                    .post('/api/payment/create')
                    .set('Authorization', authToken)
                    .send(paymentData);

                expect(createResponse.status).toBe(200);
                expect(createResponse.body.success).toBe(true);
                expect(createResponse.body.paymentUrl).toBeDefined();
                
                const orderId = createResponse.body.orderId;

                // Step 2: Simulate VNPay response based on card
                const cardResponse = mockVNPayService.simulateCardResponse(scenario.cardNumber, orderId);
                
                const returnUrlData = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '10000000', // Amount in VNPay format (x100)
                    vnp_OrderInfo: paymentData.orderInfo,
                    vnp_ResponseCode: cardResponse.vnp_ResponseCode,
                    vnp_TransactionNo: `TXN_${Date.now()}`,
                    vnp_BankCode: cardResponse.vnp_BankCode,
                    vnp_PayDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
                    vnp_TransactionStatus: cardResponse.vnp_TransactionStatus,
                    vnp_CardType: cardResponse.vnp_CardType,
                    vnp_SecureHash: 'valid_hash_signature'
                };

                // Step 3: Simulate return from VNPay
                const returnResponse = await request(app)
                    .get('/api/payment/vnpay-return')
                    .query(returnUrlData);

                // Step 4: Verify response based on expected result
                expect(returnResponse.status).toBe(302); // Redirect response

                if (scenario.expectedResult === 'SUCCESS') {
                    expect(returnResponse.headers.location).toContain('/payment/success');
                    // In a real test, you would also verify that the user was upgraded to premium
                } else {
                    expect(returnResponse.headers.location).toContain('/payment/failed');
                    if (scenario.expectedCode) {
                        expect(returnResponse.headers.location).toContain(`error=${scenario.expectedCode}`);
                    }
                }

                // Step 5: Verify payment status
                const statusResponse = await request(app)
                    .get(`/api/payment/status/${orderId}`)
                    .set('Authorization', authToken);

                expect(statusResponse.status).toBe(200);
                expect(statusResponse.body.success).toBe(true);
                expect(statusResponse.body.payment).toBeDefined();
                
                if (scenario.expectedResult === 'SUCCESS') {
                    expect(statusResponse.body.payment.status).toBe('COMPLETED');
                } else {
                    expect(statusResponse.body.payment.status).toBe('FAILED');
                }

                // Step 6: Test IPN notification
                const ipnResponse = await request(app)
                    .get('/api/payment/vnpay-ipn')
                    .query(returnUrlData);

                expect(ipnResponse.status).toBe(200);
                expect(ipnResponse.body.RspCode).toBe('00'); // IPN acknowledgment
                expect(ipnResponse.body.Message).toBe('Confirm Success');
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('Should handle concurrent payment attempts', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'Concurrent payment test',
                bankCode: 'NCB'
            };

            // Create multiple payment requests simultaneously
            const promises = Array(3).fill().map(() => 
                request(app)
                    .post('/api/payment/create')
                    .set('Authorization', authToken)
                    .send(paymentData)
            );

            const responses = await Promise.all(promises);

            // All should succeed but have different order IDs
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            const orderIds = responses.map(r => r.body.orderId);
            const uniqueOrderIds = new Set(orderIds);
            expect(uniqueOrderIds.size).toBe(3); // All order IDs should be unique
        });

        test('Should handle invalid signature in return URL', async () => {
            const invalidReturnData = {
                vnp_TxnRef: 'INVALID_ORDER_123',
                vnp_Amount: '10000000',
                vnp_ResponseCode: '00',
                vnp_SecureHash: 'invalid_signature'
            };

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(invalidReturnData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
            expect(response.headers.location).toContain('error=invalid_signature');
        });

        test('Should handle payment timeout scenario', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'Timeout test payment',
                bankCode: 'NCB'
            };

            const createResponse = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send(paymentData);

            const orderId = createResponse.body.orderId;

            // Simulate timeout response (code 11)
            const timeoutReturnData = {
                vnp_TxnRef: orderId,
                vnp_Amount: '10000000',
                vnp_ResponseCode: '11', // Timeout
                vnp_TransactionStatus: '11',
                vnp_SecureHash: 'valid_hash_signature'
            };

            const returnResponse = await request(app)
                .get('/api/payment/vnpay-return')
                .query(timeoutReturnData);

            expect(returnResponse.status).toBe(302);
            expect(returnResponse.headers.location).toContain('/payment/failed');
            expect(returnResponse.headers.location).toContain('error=11');
        });

        test('Should handle user cancellation', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'User cancellation test',
                bankCode: 'NCB'
            };

            const createResponse = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send(paymentData);

            const orderId = createResponse.body.orderId;

            // Simulate user cancellation (code 24)
            const cancelReturnData = {
                vnp_TxnRef: orderId,
                vnp_Amount: '10000000',
                vnp_ResponseCode: '24', // User cancelled
                vnp_TransactionStatus: '24',
                vnp_SecureHash: 'valid_hash_signature'
            };

            const returnResponse = await request(app)
                .get('/api/payment/vnpay-return')
                .query(cancelReturnData);

            expect(returnResponse.status).toBe(302);
            expect(returnResponse.headers.location).toContain('/payment/failed');
            expect(returnResponse.headers.location).toContain('error=24');
        });

        test('Should handle payment amount validation', async () => {
            const invalidAmounts = [1000, 600000000, -5000, 'invalid'];

            for (const amount of invalidAmounts) {
                const response = await request(app)
                    .post('/api/payment/create')
                    .set('Authorization', authToken)
                    .send({
                        amount,
                        orderInfo: 'Invalid amount test'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid amount');
            }
        });

        test('Should handle double processing prevention', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'Double processing test',
                bankCode: 'NCB'
            };

            const createResponse = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send(paymentData);

            const orderId = createResponse.body.orderId;

            const successReturnData = {
                vnp_TxnRef: orderId,
                vnp_Amount: '10000000',
                vnp_ResponseCode: '00',
                vnp_TransactionStatus: '00',
                vnp_TransactionNo: 'TXN_123456',
                vnp_SecureHash: 'valid_hash_signature'
            };

            // Process the payment first time
            const firstResponse = await request(app)
                .get('/api/payment/vnpay-return')
                .query(successReturnData);

            expect(firstResponse.status).toBe(302);
            expect(firstResponse.headers.location).toContain('/payment/success');

            // Try to process the same payment again
            const secondResponse = await request(app)
                .get('/api/payment/vnpay-return')
                .query(successReturnData);

            // Should handle gracefully (might redirect to already processed page)
            expect(secondResponse.status).toBe(302);
        });
    });

    describe('Performance Tests', () => {
        test('Should handle high volume of payment status checks', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'Performance test payment',
                bankCode: 'NCB'
            };

            const createResponse = await request(app)
                .post('/api/payment/create')
                .set('Authorization', authToken)
                .send(paymentData);

            const orderId = createResponse.body.orderId;

            // Create multiple concurrent status check requests
            const statusPromises = Array(10).fill().map(() =>
                request(app)
                    .get(`/api/payment/status/${orderId}`)
                    .set('Authorization', authToken)
            );

            const startTime = Date.now();
            const responses = await Promise.all(statusPromises);
            const endTime = Date.now();

            // All requests should complete successfully
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Should complete within reasonable time (adjust threshold as needed)
            expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
        });
    });

    describe('Security Tests', () => {
        test('Should reject unauthorized payment creation', async () => {
            const response = await request(app)
                .post('/api/payment/create')
                .send({
                    amount: 100000,
                    orderInfo: 'Unauthorized test'
                });

            expect(response.status).toBe(401); // Unauthorized
        });

        test('Should validate payment ownership for status checks', async () => {
            // This test would be more comprehensive with actual user isolation
            const response = await request(app)
                .get('/api/payment/status/INVALID_ORDER_ID')
                .set('Authorization', authToken);

            expect(response.status).toBe(404); // Not found
        });

        test('Should handle malformed VNPay responses', async () => {
            const malformedData = {
                vnp_TxnRef: 'TEST_ORDER',
                // Missing required fields
                vnp_ResponseCode: '00'
            };

            const response = await request(app)
                .get('/api/payment/vnpay-return')
                .query(malformedData);

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');
        });
    });
});