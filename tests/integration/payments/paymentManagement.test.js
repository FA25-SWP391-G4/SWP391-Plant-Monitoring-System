/**
 * PAYMENT MANAGEMENT INTEGRATION TESTS
 * ===================================
 * 
 * Tests for UC9: Payment Processing
 * Tests for UC10: Subscription Management
 * Tests for UC11: Premium Feature Access
 * 
 * Integration testing with:
 * - Real VNPay API simulation
 * - Database transactions
 * - Authentication flows
 * - Payment webhooks
 */

const request = require('supertest');
const app = require('../../../app');
const Payment = require('../../../models/Payment');
const User = require('../../../models/User');
const { setupTestDatabase, cleanupTestDatabase, createTestUser, generateTestToken } = require('../../helpers/testHelpers');

describe('Payment Management Integration Tests', () => {
    let testUser, testUserToken, premiumUser, premiumUserToken, ultimateUser, ultimateUserToken;

    beforeAll(async () => {
        await setupTestDatabase();

        // Create test users
        testUser = await createTestUser('testuser@payment.com', 'user');
        testUserToken = generateTestToken(testUser);

        premiumUser = await createTestUser('premium@payment.com', 'Premium');
        premiumUserToken = generateTestToken(premiumUser);

        ultimateUser = await createTestUser('ultimate@payment.com', 'Ultimate');
        ultimateUserToken = generateTestToken(ultimateUser);
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    beforeEach(async () => {
        // Clean up payment data
        await Payment.deleteAllTestData();
    });

    describe('UC9: Payment Processing Integration', () => {
        describe('POST /api/payments/create', () => {
            it('should create payment URL for premium upgrade', async () => {
                const paymentData = {
                    amount: 200000,
                    orderInfo: 'Premium subscription upgrade',
                    bankCode: 'NCB',
                    planType: 'premium_upgrade'
                };

                const response = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send(paymentData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.paymentUrl).toContain('vnpayment.vn');
                expect(response.body.orderId).toMatch(/^PREMIUM_\d{13}_\d{4}$/);
                expect(response.body.amount).toBe('200.000 ₫');

                // Verify payment record created in database
                const payment = await Payment.findByOrderId(response.body.orderId);
                expect(payment).not.toBeNull();
                expect(payment.user_id).toBe(testUser.user_id);
                expect(payment.amount).toBe(200000);
                expect(payment.status).toBe('PENDING');
            });

            it('should create payment URL for ultimate upgrade', async () => {
                const paymentData = {
                    amount: 400000,
                    orderInfo: 'Ultimate subscription upgrade',
                    bankCode: 'VCB',
                    planType: 'ultimate_upgrade'
                };

                const response = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send(paymentData);

                expect(response.status).toBe(200);
                expect(response.body.orderId).toMatch(/^ULTIMATE_\d{13}_\d{4}$/);

                const payment = await Payment.findByOrderId(response.body.orderId);
                expect(payment.order_info).toBe('Ultimate subscription upgrade');
                expect(payment.bank_code).toBe('VCB');
            });

            it('should validate payment amount limits', async () => {
                const paymentData = {
                    amount: 1000, // Below minimum
                    orderInfo: 'Invalid payment',
                    planType: 'premium_upgrade'
                };

                const response = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send(paymentData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('Invalid amount');
            });

            it('should validate required fields', async () => {
                const paymentData = {
                    amount: 200000
                    // Missing orderInfo
                };

                const response = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send(paymentData);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Missing required fields');
            });

            it('should require authentication', async () => {
                const paymentData = {
                    amount: 200000,
                    orderInfo: 'Premium subscription upgrade'
                };

                const response = await request(app)
                    .post('/api/payments/create')
                    .send(paymentData);

                expect(response.status).toBe(401);
            });
        });

        describe('GET /api/payments/vnpay/return', () => {
            it('should handle successful payment return', async () => {
                // First create a payment
                const orderId = `PREMIUM_${Date.now()}_1234`;
                await Payment.create({
                    user_id: testUser.user_id,
                    order_id: orderId,
                    amount: 200000,
                    order_info: 'Premium subscription upgrade',
                    bank_code: 'NCB',
                    status: 'PENDING'
                });

                // Simulate VNPay return parameters
                const returnParams = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00',
                    vnp_TransactionNo: '13456789',
                    vnp_BankCode: 'NCB',
                    vnp_PayDate: '20231101103000'
                };

                // Mock successful signature verification
                jest.mock('../../../services/vnpayService', () => ({
                    verifyReturnUrl: jest.fn().mockReturnValue({
                        isValid: true,
                        transaction: {
                            orderId: orderId,
                            amount: 200000,
                            isSuccess: true,
                            responseCode: '00',
                            transactionNo: '13456789',
                            bankCode: 'NCB'
                        }
                    })
                }));

                const response = await request(app)
                    .get('/api/payments/vnpay/return')
                    .query(returnParams);

                expect(response.status).toBe(302); // Redirect
                expect(response.header.location).toContain('payment/success');

                // Verify payment updated in database
                const updatedPayment = await Payment.findByOrderId(orderId);
                expect(updatedPayment.status).toBe('SUCCESS');
                expect(updatedPayment.transaction_no).toBe('13456789');

                // Verify user upgraded
                const updatedUser = await User.findById(testUser.user_id);
                expect(updatedUser.role).toBe('Premium');
            });

            it('should handle failed payment return', async () => {
                const orderId = `PREMIUM_${Date.now()}_5678`;
                await Payment.create({
                    user_id: testUser.user_id,
                    order_id: orderId,
                    amount: 200000,
                    status: 'PENDING'
                });

                const returnParams = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '24', // User cancelled
                    vnp_TransactionNo: '13456789'
                };

                const response = await request(app)
                    .get('/api/payments/vnpay/return')
                    .query(returnParams);

                expect(response.status).toBe(302);
                expect(response.header.location).toContain('payment/failed');

                const updatedPayment = await Payment.findByOrderId(orderId);
                expect(updatedPayment.status).toBe('FAILED');
            });

            it('should handle invalid signature', async () => {
                const returnParams = {
                    vnp_TxnRef: 'PREMIUM_123_456',
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00',
                    vnp_SecureHash: 'invalid_signature'
                };

                const response = await request(app)
                    .get('/api/payments/vnpay/return')
                    .query(returnParams);

                expect(response.status).toBe(302);
                expect(response.header.location).toContain('error=invalid_signature');
            });
        });

        describe('POST /api/payments/vnpay/ipn', () => {
            it('should handle successful IPN notification', async () => {
                const orderId = `ULTIMATE_${Date.now()}_9999`;
                await Payment.create({
                    user_id: testUser.user_id,
                    order_id: orderId,
                    amount: 400000,
                    order_info: 'Ultimate subscription upgrade',
                    status: 'PENDING'
                });

                const ipnData = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '40000000',
                    vnp_ResponseCode: '00',
                    vnp_TransactionNo: '87654321',
                    vnp_BankCode: 'VCB'
                };

                const response = await request(app)
                    .post('/api/payments/vnpay/ipn')
                    .send(ipnData);

                expect(response.status).toBe(200);
                expect(response.body.RspCode).toBe('00');
                expect(response.body.Message).toBe('Confirm Success');

                // Verify payment updated
                const updatedPayment = await Payment.findByOrderId(orderId);
                expect(updatedPayment.status).toBe('SUCCESS');
                expect(updatedPayment.transaction_no).toBe('87654321');

                // Verify user upgraded to Ultimate
                const updatedUser = await User.findById(testUser.user_id);
                expect(updatedUser.role).toBe('Ultimate');
            });

            it('should handle duplicate IPN calls idempotently', async () => {
                const orderId = `PREMIUM_${Date.now()}_7777`;
                await Payment.create({
                    user_id: testUser.user_id,
                    order_id: orderId,
                    amount: 200000,
                    status: 'SUCCESS' // Already processed
                });

                const ipnData = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00'
                };

                const response = await request(app)
                    .post('/api/payments/vnpay/ipn')
                    .send(ipnData);

                expect(response.status).toBe(200);
                expect(response.body.RspCode).toBe('00');
                expect(response.body.Message).toBe('Confirm Success');
            });

            it('should reject IPN for non-existent order', async () => {
                const ipnData = {
                    vnp_TxnRef: 'NONEXISTENT_ORDER_ID',
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00'
                };

                const response = await request(app)
                    .post('/api/payments/vnpay/ipn')
                    .send(ipnData);

                expect(response.status).toBe(200);
                expect(response.body.RspCode).toBe('01');
                expect(response.body.Message).toBe('Order not found');
            });
        });
    });

    describe('UC10: Subscription Management Integration', () => {
        describe('GET /api/payments/history', () => {
            beforeEach(async () => {
                // Create payment history for premium user
                await Payment.create({
                    user_id: premiumUser.user_id,
                    order_id: 'PREMIUM_1635264000000_1111',
                    amount: 200000,
                    order_info: 'Premium subscription upgrade',
                    status: 'SUCCESS',
                    transaction_no: '11111111',
                    bank_code: 'NCB'
                });

                await Payment.create({
                    user_id: premiumUser.user_id,
                    order_id: 'ULTIMATE_1635264000000_2222',
                    amount: 400000,
                    order_info: 'Ultimate subscription upgrade',
                    status: 'PENDING',
                    bank_code: 'VCB'
                });

                // Create payment for different user
                await Payment.create({
                    user_id: ultimateUser.user_id,
                    order_id: 'ULTIMATE_1635264000000_3333',
                    amount: 400000,
                    order_info: 'Ultimate subscription upgrade',
                    status: 'SUCCESS'
                });
            });

            it('should retrieve user payment history', async () => {
                const response = await request(app)
                    .get('/api/payments/history')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);

                const payments = response.body.data;
                expect(payments.every(p => p.user_id === premiumUser.user_id)).toBe(true);

                const successPayment = payments.find(p => p.status === 'SUCCESS');
                expect(successPayment.amount).toBe(200000);
                expect(successPayment.transaction_no).toBe('11111111');
            });

            it('should return empty array for users with no payment history', async () => {
                const response = await request(app)
                    .get('/api/payments/history')
                    .set('Authorization', `Bearer ${testUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(0);
            });

            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/payments/history');

                expect(response.status).toBe(401);
            });
        });

        describe('GET /api/payments/status/:orderId', () => {
            beforeEach(async () => {
                await Payment.create({
                    user_id: premiumUser.user_id,
                    order_id: 'PREMIUM_STATUS_TEST_1234',
                    amount: 200000,
                    order_info: 'Premium subscription upgrade',
                    status: 'SUCCESS',
                    transaction_no: '99999999'
                });
            });

            it('should retrieve payment status by order ID', async () => {
                const response = await request(app)
                    .get('/api/payments/status/PREMIUM_STATUS_TEST_1234')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.order_id).toBe('PREMIUM_STATUS_TEST_1234');
                expect(response.body.data.status).toBe('SUCCESS');
                expect(response.body.data.amount).toBe(200000);
                expect(response.body.data.transaction_no).toBe('99999999');
            });

            it('should prevent access to other users payments', async () => {
                const response = await request(app)
                    .get('/api/payments/status/PREMIUM_STATUS_TEST_1234')
                    .set('Authorization', `Bearer ${testUserToken}`); // Different user

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Access denied');
            });

            it('should return 404 for non-existent payment', async () => {
                const response = await request(app)
                    .get('/api/payments/status/NONEXISTENT_ORDER_ID')
                    .set('Authorization', `Bearer ${testUserToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Payment not found');
            });
        });

        describe('GET /api/payments/plans', () => {
            it('should return available subscription plans', async () => {
                const response = await request(app)
                    .get('/api/payments/plans')
                    .set('Authorization', `Bearer ${testUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.plans).toHaveProperty('premium');
                expect(response.body.plans).toHaveProperty('ultimate');

                const premiumPlan = response.body.plans.premium;
                expect(premiumPlan).toHaveProperty('monthly');
                expect(premiumPlan).toHaveProperty('annual');
                expect(premiumPlan.monthly.amount).toBe(20000);
                expect(premiumPlan.annual.amount).toBe(200000);

                const ultimatePlan = response.body.plans.ultimate;
                expect(ultimatePlan.monthly.amount).toBe(45000);
                expect(ultimatePlan.annual.amount).toBe(399000);
            });

            it('should include features for each plan', async () => {
                const response = await request(app)
                    .get('/api/payments/plans')
                    .set('Authorization', `Bearer ${testUserToken}`);

                const premiumPlan = response.body.plans.premium;
                expect(premiumPlan.features).toContain('Unlimited plants');
                expect(premiumPlan.features).toContain('Advanced analytics');

                const ultimatePlan = response.body.plans.ultimate;
                expect(ultimatePlan.features).toContain('AI plant disease detection');
                expect(ultimatePlan.features).toContain('Expert consultation');
            });
        });
    });

    describe('UC11: Premium Feature Access Integration', () => {
        describe('Premium Feature Middleware Integration', () => {
            it('should allow premium users access to premium features', async () => {
                const response = await request(app)
                    .get('/api/premium/analytics')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(200);
            });

            it('should allow ultimate users access to premium features', async () => {
                const response = await request(app)
                    .get('/api/premium/analytics')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
            });

            it('should deny basic users access to premium features', async () => {
                const response = await request(app)
                    .get('/api/premium/analytics')
                    .set('Authorization', `Bearer ${testUserToken}`);

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('Premium');
            });

            it('should allow ultimate users access to ultimate features', async () => {
                const response = await request(app)
                    .get('/api/ultimate/ai-consultation')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
            });

            it('should deny premium users access to ultimate features', async () => {
                const response = await request(app)
                    .get('/api/ultimate/ai-consultation')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('Ultimate');
            });
        });

        describe('User Upgrade Integration', () => {
            it('should complete full premium upgrade flow', async () => {
                // Create basic user
                const basicUser = await createTestUser('basic@upgrade.com', 'user');
                const basicUserToken = generateTestToken(basicUser);

                // Step 1: Create payment
                const paymentResponse = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${basicUserToken}`)
                    .send({
                        amount: 200000,
                        orderInfo: 'Premium subscription upgrade',
                        planType: 'premium_upgrade'
                    });

                expect(paymentResponse.status).toBe(200);
                const orderId = paymentResponse.body.orderId;

                // Step 2: Simulate successful payment IPN
                await request(app)
                    .post('/api/payments/vnpay/ipn')
                    .send({
                        vnp_TxnRef: orderId,
                        vnp_Amount: '20000000',
                        vnp_ResponseCode: '00',
                        vnp_TransactionNo: '12345678'
                    });

                // Step 3: Verify user upgraded
                const updatedUser = await User.findById(basicUser.user_id);
                expect(updatedUser.role).toBe('Premium');

                // Step 4: Verify premium access
                const newToken = generateTestToken(updatedUser);
                const premiumAccessResponse = await request(app)
                    .get('/api/premium/analytics')
                    .set('Authorization', `Bearer ${newToken}`);

                expect(premiumAccessResponse.status).toBe(200);
            });

            it('should complete full ultimate upgrade flow', async () => {
                // Create premium user
                const premiumUser2 = await createTestUser('premium2@upgrade.com', 'Premium');
                const premiumUser2Token = generateTestToken(premiumUser2);

                // Step 1: Create ultimate payment
                const paymentResponse = await request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${premiumUser2Token}`)
                    .send({
                        amount: 400000,
                        orderInfo: 'Ultimate subscription upgrade',
                        planType: 'ultimate_upgrade'
                    });

                expect(paymentResponse.status).toBe(200);
                const orderId = paymentResponse.body.orderId;

                // Step 2: Simulate successful payment
                await request(app)
                    .post('/api/payments/vnpay/ipn')
                    .send({
                        vnp_TxnRef: orderId,
                        vnp_Amount: '40000000',
                        vnp_ResponseCode: '00',
                        vnp_TransactionNo: '87654321'
                    });

                // Step 3: Verify user upgraded to Ultimate
                const updatedUser = await User.findById(premiumUser2.user_id);
                expect(updatedUser.role).toBe('Ultimate');

                // Step 4: Verify ultimate access
                const newToken = generateTestToken(updatedUser);
                const ultimateAccessResponse = await request(app)
                    .get('/api/ultimate/ai-consultation')
                    .set('Authorization', `Bearer ${newToken}`);

                expect(ultimateAccessResponse.status).toBe(200);
            });
        });

        describe('Feature Limits Integration', () => {
            it('should enforce plant limits for basic users', async () => {
                // Create 10 plants (basic limit)
                for (let i = 0; i < 10; i++) {
                    await request(app)
                        .post('/api/plants')
                        .set('Authorization', `Bearer ${testUserToken}`)
                        .send({
                            plant_name: `Test Plant ${i}`,
                            plant_profile_id: 1,
                            zone_id: 1
                        });
                }

                // Try to create 11th plant
                const response = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send({
                        plant_name: 'Excess Plant',
                        plant_profile_id: 1,
                        zone_id: 1
                    });

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('plant limit');
            });

            it('should allow unlimited plants for premium users', async () => {
                // Create 15 plants (above basic limit)
                const responses = [];
                for (let i = 0; i < 15; i++) {
                    const response = await request(app)
                        .post('/api/plants')
                        .set('Authorization', `Bearer ${premiumUserToken}`)
                        .send({
                            plant_name: `Premium Plant ${i}`,
                            plant_profile_id: 1,
                            zone_id: 1
                        });
                    responses.push(response);
                }

                // All should succeed
                responses.forEach(response => {
                    expect(response.status).toBe(201);
                });
            });
        });
    });

    describe('Payment Security & Error Handling', () => {
        it('should handle payment timeout scenarios', async () => {
            const orderId = `PREMIUM_${Date.now()}_TIMEOUT`;
            await Payment.create({
                user_id: testUser.user_id,
                order_id: orderId,
                amount: 200000,
                status: 'PENDING',
                created_at: new Date(Date.now() - 31 * 60 * 1000) // 31 minutes ago
            });

            // Check payment status after timeout
            const response = await request(app)
                .get(`/api/payments/status/${orderId}`)
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('PENDING');
            expect(response.body.data.isExpired).toBe(true);
        });

        it('should prevent amount manipulation', async () => {
            const paymentData = {
                amount: 200000,
                orderInfo: 'Premium subscription upgrade'
            };

            const response = await request(app)
                .post('/api/payments/create')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send(paymentData);

            const orderId = response.body.orderId;

            // Try to use different amount in return URL
            const returnParams = {
                vnp_TxnRef: orderId,
                vnp_Amount: '5000000', // Different amount
                vnp_ResponseCode: '00'
            };

            const returnResponse = await request(app)
                .get('/api/payments/vnpay/return')
                .query(returnParams);

            expect(returnResponse.status).toBe(302);
            expect(returnResponse.header.location).toContain('error=amount_mismatch');
        });

        it('should handle concurrent payment attempts', async () => {
            const paymentData = {
                amount: 200000,
                orderInfo: 'Premium subscription upgrade',
                planType: 'premium_upgrade'
            };

            // Make concurrent payment requests
            const promises = Array(3).fill().map(() =>
                request(app)
                    .post('/api/payments/create')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .send(paymentData)
            );

            const responses = await Promise.all(promises);

            // All should succeed with unique order IDs
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            const orderIds = responses.map(r => r.body.orderId);
            const uniqueOrderIds = new Set(orderIds);
            expect(uniqueOrderIds.size).toBe(3);
        });

        it('should validate payment completion within time window', async () => {
            // Create an old pending payment
            const oldOrderId = `PREMIUM_${Date.now() - 24 * 60 * 60 * 1000}_OLD`;
            await Payment.create({
                user_id: testUser.user_id,
                order_id: oldOrderId,
                amount: 200000,
                status: 'PENDING',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });

            // Try to complete old payment
            const ipnResponse = await request(app)
                .post('/api/payments/vnpay/ipn')
                .send({
                    vnp_TxnRef: oldOrderId,
                    vnp_Amount: '20000000',
                    vnp_ResponseCode: '00'
                });

            expect(ipnResponse.status).toBe(200);
            expect(ipnResponse.body.RspCode).toBe('04'); // Payment expired
            expect(ipnResponse.body.Message).toBe('Payment expired');
        });
    });
});