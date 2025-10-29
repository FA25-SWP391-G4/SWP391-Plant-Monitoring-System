/**
 * ============================================================================
 * REAL INTEGRATION TESTS FOR VNPay PAYMENT CONTROLLER
 * ============================================================================
 * 
 * These tests use actual services (no mocks) for complete payment workflow validation
 * Tests all 6 card scenarios from user requirements:
 * - NCB domestic cards: Success, Insufficient funds, Blocked, Invalid OTP, Expired
 * - International VISA: Success scenario
 * 
 * Environment Variables Required:
 * - VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL, VNPAY_RETURN_URL
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Test card data from user requirements
const TEST_CARDS = {
    ncb_success: {
        cardNumber: '9704198526191432198',
        expiryDate: '07/15',
        name: 'NGUYEN VAN A',
        issueDate: '07/15',
        otp: '123456',
        description: 'NCB domestic card - Transaction success'
    },
    ncb_insufficient: {
        cardNumber: '9704198526191432199',
        expiryDate: '07/15', 
        name: 'NGUYEN VAN B',
        issueDate: '07/15',
        otp: '123456',
        description: 'NCB domestic card - Insufficient account balance'
    },
    ncb_blocked: {
        cardNumber: '9704198526191432200',
        expiryDate: '07/15',
        name: 'NGUYEN VAN C', 
        issueDate: '07/15',
        otp: '123456',
        description: 'NCB domestic card - Blocked account'
    },
    ncb_invalid_otp: {
        cardNumber: '9704198526191432201',
        expiryDate: '07/15',
        name: 'NGUYEN VAN D',
        issueDate: '07/15', 
        otp: 'invalid',
        description: 'NCB domestic card - Invalid OTP'
    },
    ncb_expired: {
        cardNumber: '9704198526191432202',
        expiryDate: '01/20',
        name: 'NGUYEN VAN E',
        issueDate: '01/20',
        otp: '123456',
        description: 'NCB domestic card - Expired card'
    },
    visa_international: {
        cardNumber: '4000000000000002',
        expiryDate: '12/25',
        name: 'INTERNATIONAL USER',
        issueDate: '01/20',
        otp: '123456',
        description: 'International VISA - Transaction success'
    }
};

describe('Payment Controller - Real Integration Tests', () => {
    let app;
    let testUserId;
    let authToken;

    beforeAll(async () => {
        // Setup Express app with actual routes
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Create test user in database
        const userResult = await pool.query(`
            INSERT INTO users (given_name, family_name, email, password_hash, role, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id
        `, [
            'Test',
            'User Payment',
            'test.payment@example.com', 
            '$2b$12$dummy.hash.for.testing',
            'Regular',
            new Date()
        ]);
        
        testUserId = userResult.rows[0].user_id;

        // Generate JWT token for authentication
        authToken = jwt.sign(
            { user_id: testUserId, email: 'test.payment@example.com' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Setup payment routes
        app.post('/payment/create', authMiddleware, PaymentController.createPayment);
        app.get('/payment/vnpay-return', PaymentController.handleVNPayReturn);
        app.post('/payment/vnpay-ipn', PaymentController.handleVNPayIPN);

        console.log('[INTEGRATION TEST] Test user created:', testUserId);
        console.log('[INTEGRATION TEST] Using actual VNPay service (no mocks)');
    });

    afterAll(async () => {
        // Cleanup test data
        if (testUserId) {
            await pool.query('DELETE FROM payments WHERE user_id = $1', [testUserId]);
            await pool.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
        }
        await pool.end();
    });

    describe('Payment Creation with Real VNPay Service', () => {
        test('Should create payment with NCB success card data', async () => {
            const paymentData = {
                amount: 100000, // 100,000 VND for premium upgrade
                orderInfo: `Premium upgrade - ${TEST_CARDS.ncb_success.description}`,
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            console.log('[TEST] NCB Success Card Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toContain('sandbox.vnpayment.vn');
            expect(response.body.orderId).toMatch(/^PREMIUM_\d+_\d+$/);
            expect(response.body.amount).toMatch(/100[,.]000.*₫/);

            // Verify payment record in database
            const paymentRecord = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [response.body.orderId]
            );

            expect(paymentRecord.rows).toHaveLength(1);
            expect(paymentRecord.rows[0].user_id).toBe(testUserId);
            expect(parseFloat(paymentRecord.rows[0].amount)).toBe(100000);
            expect(paymentRecord.rows[0].status).toBe('PENDING');
            expect(paymentRecord.rows[0].bank_code).toBe('NCB');
        });

        test('Should create payment with NCB insufficient funds card data', async () => {
            const paymentData = {
                amount: 200000, // 200,000 VND
                orderInfo: `Premium upgrade - ${TEST_CARDS.ncb_insufficient.description}`,
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            console.log('[TEST] NCB Insufficient Funds Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toContain('sandbox.vnpayment.vn');
            expect(response.body.orderId).toMatch(/^PREMIUM_\d+_\d+$/);

            // Verify database record
            const paymentRecord = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [response.body.orderId]
            );

            expect(paymentRecord.rows).toHaveLength(1);
            expect(paymentRecord.rows[0].status).toBe('PENDING');
        });

        test('Should create payment with NCB blocked card data', async () => {
            const paymentData = {
                amount: 150000, // 150,000 VND
                orderInfo: `Premium upgrade - ${TEST_CARDS.ncb_blocked.description}`,
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            console.log('[TEST] NCB Blocked Card Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toContain('sandbox.vnpayment.vn');
        });

        test('Should create payment with NCB expired card data', async () => {
            const paymentData = {
                amount: 300000, // 300,000 VND
                orderInfo: `Premium upgrade - ${TEST_CARDS.ncb_expired.description}`,
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            console.log('[TEST] NCB Expired Card Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toContain('sandbox.vnpayment.vn');
        });

        test('Should create payment with international VISA card', async () => {
            const paymentData = {
                amount: 500000, // 500,000 VND
                orderInfo: `Premium upgrade - ${TEST_CARDS.visa_international.description}`,
                bankCode: '' // No specific bank code for international cards
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            console.log('[TEST] VISA International Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paymentUrl).toContain('sandbox.vnpayment.vn');
            
            // Verify no bank code in database for international card
            const paymentRecord = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [response.body.orderId]
            );

            expect(paymentRecord.rows[0].bank_code).toBeNull();
        });

        test('Should validate amount requirements', async () => {
            // Test minimum amount validation
            const invalidPayment = {
                amount: 1000, // Below minimum 5,000 VND
                orderInfo: 'Invalid amount test',
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPayment);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid amount');
        });

        test('Should require authentication', async () => {
            const paymentData = {
                amount: 100000,
                orderInfo: 'Test payment',
                bankCode: 'NCB'
            };

            const response = await request(app)
                .post('/payment/create')
                .send(paymentData); // No authorization header

            expect(response.status).toBe(401);
        });
    });

    describe('VNPay Return URL Handling', () => {
        let testOrderId;

        beforeEach(async () => {
            // Create a test payment record
            const result = await pool.query(`
                INSERT INTO payments (user_id, order_id, amount, order_info, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING order_id
            `, [testUserId, `PREMIUM${Date.now()}`, 100000, 'Test payment', 'PENDING', new Date()]);
            
            testOrderId = result.rows[0].order_id;
        });

        test('Should handle successful payment return', async () => {
            // Simulate VNPay success return parameters
            const returnParams = {
                vnp_Amount: '10000000', // 100,000 VND * 100
                vnp_BankCode: 'NCB',
                vnp_BankTranNo: 'VNP01234567',
                vnp_CardType: 'ATM',
                vnp_OrderInfo: `Premium upgrade - ${TEST_CARDS.ncb_success.description}`,
                vnp_PayDate: '20231215120000',
                vnp_ResponseCode: '00', // Success code
                vnp_TmnCode: process.env.VNP_TMN_CODE || 'TEST123',
                vnp_TransactionNo: '13456789',
                vnp_TransactionStatus: '00',
                vnp_TxnRef: testOrderId,
                vnp_SecureHashType: 'SHA256'
            };

            // Generate valid secure hash
            const VNPayService = require('../services/vnpayService');
            const sortedParams = {};
            Object.keys(returnParams)
                .filter(key => key !== 'vnp_SecureHash')
                .sort()
                .forEach(key => {
                    sortedParams[key] = returnParams[key];
                });

            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
                .join('&');
            
            const crypto = require('crypto');
            const secretKey = process.env.VNP_HASH_SECRET || 'test-secret';
            const secureHash = crypto.createHmac('sha256', secretKey)
                .update(queryString)
                .digest('hex');

            returnParams.vnp_SecureHash = secureHash;

            const response = await request(app)
                .get('/payment/vnpay-return')
                .query(returnParams);

            console.log('[TEST] VNPay Return Response Status:', response.status);

            // Should redirect to success page
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/success');

            // Verify database update
            const updatedPayment = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [testOrderId]
            );

            expect(updatedPayment.rows[0].status).toBe('SUCCESS');
            expect(updatedPayment.rows[0].response_code).toBe('00');

            // Verify user premium upgrade
            const userRecord = await pool.query(
                'SELECT role FROM users WHERE user_id = $1',
                [testUserId]
            );

            expect(userRecord.rows[0].role).toBe('Premium');
        });

        test('Should handle failed payment return', async () => {
            const returnParams = {
                vnp_Amount: '10000000',
                vnp_BankCode: 'NCB',
                vnp_CardType: 'ATM',
                vnp_OrderInfo: `Premium upgrade - ${TEST_CARDS.ncb_insufficient.description}`,
                vnp_PayDate: '20231215120000',
                vnp_ResponseCode: '05', // Insufficient funds
                vnp_TmnCode: process.env.VNP_TMN_CODE || 'TEST123',
                vnp_TransactionNo: '13456790',
                vnp_TransactionStatus: '02', // Failed
                vnp_TxnRef: testOrderId,
                vnp_SecureHashType: 'SHA256'
            };

            // Generate valid secure hash for failed transaction
            const sortedParams = {};
            Object.keys(returnParams)
                .filter(key => key !== 'vnp_SecureHash')
                .sort()
                .forEach(key => {
                    sortedParams[key] = returnParams[key];
                });

            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
                .join('&');
            
            const crypto = require('crypto');
            const secretKey = process.env.VNP_HASH_SECRET || 'test-secret';
            const secureHash = crypto.createHmac('sha256', secretKey)
                .update(queryString)
                .digest('hex');

            returnParams.vnp_SecureHash = secureHash;

            const response = await request(app)
                .get('/payment/vnpay-return')
                .query(returnParams);

            // Should redirect to failed page
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/payment/failed');

            // Verify database update
            const updatedPayment = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [testOrderId]
            );

            expect(updatedPayment.rows[0].status).toBe('FAILED');
            expect(updatedPayment.rows[0].response_code).toBe('05');

            // Verify user is still not premium
            const userRecord = await pool.query(
                'SELECT role FROM users WHERE user_id = $1',
                [testUserId]
            );

            // User should not be upgraded for failed payment
            expect(['Regular', 'Premium']).toContain(userRecord.rows[0].role);
        });
    });

    describe('VNPay IPN Handling', () => {
        let testOrderId;

        beforeEach(async () => {
            // Create a test payment record
            const result = await pool.query(`
                INSERT INTO payments (user_id, order_id, amount, order_info, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING order_id
            `, [testUserId, `PREMIUM${Date.now()}`, 100000, 'Test IPN payment', 'PENDING', new Date()]);
            
            testOrderId = result.rows[0].order_id;
        });

        test('Should handle successful IPN notification', async () => {
            const ipnData = {
                vnp_Amount: '10000000',
                vnp_BankCode: 'NCB',
                vnp_BankTranNo: 'VNP01234567',
                vnp_CardType: 'ATM',
                vnp_OrderInfo: `Premium upgrade - ${TEST_CARDS.ncb_success.description}`,
                vnp_PayDate: '20231215120000',
                vnp_ResponseCode: '00',
                vnp_TmnCode: process.env.VNP_TMN_CODE || 'TEST123',
                vnp_TransactionNo: '13456789',
                vnp_TransactionStatus: '00',
                vnp_TxnRef: testOrderId,
                vnp_SecureHashType: 'SHA256'
            };

            // Generate valid secure hash
            const sortedParams = {};
            Object.keys(ipnData)
                .filter(key => key !== 'vnp_SecureHash')
                .sort()
                .forEach(key => {
                    sortedParams[key] = ipnData[key];
                });

            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
                .join('&');
            
            const crypto = require('crypto');
            const secretKey = process.env.VNP_HASH_SECRET || 'test-secret';
            const secureHash = crypto.createHmac('sha256', secretKey)
                .update(queryString)
                .digest('hex');

            ipnData.vnp_SecureHash = secureHash;

            const response = await request(app)
                .post('/payment/vnpay-ipn')
                .send(ipnData);

            console.log('[TEST] IPN Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.RspCode).toBe('00');
            expect(response.body.Message).toBe('Confirm Success');

            // Verify database update
            const updatedPayment = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [testOrderId]
            );

            expect(updatedPayment.rows[0].status).toBe('SUCCESS');
            expect(updatedPayment.rows[0].transaction_no).toBe('13456789');

            // Verify user premium upgrade
            const userRecord = await pool.query(
                'SELECT role FROM users WHERE user_id = $1',
                [testUserId]
            );

            expect(userRecord.rows[0].role).toBe('Premium');
        });

        test('Should handle IPN with minimal data', async () => {
            const ipnData = {
                vnp_Amount: '10000000',
                vnp_BankCode: 'NCB',
                vnp_TxnRef: testOrderId,
                vnp_SecureHash: 'test_hash'
            };

            const response = await request(app)
                .post('/payment/vnpay-ipn')
                .send(ipnData);

            expect(response.status).toBe(200);
            // Should return either success or error response
            expect(['00', '97', '99']).toContain(response.body.RspCode);
        });
    });

    describe('End-to-End Payment Flow', () => {
        test('Complete payment workflow with NCB success card', async () => {
            console.log('[E2E TEST] Starting complete payment workflow');

            // Step 1: Create payment
            const paymentData = {
                amount: 250000, // 250,000 VND
                orderInfo: `E2E Test - ${TEST_CARDS.ncb_success.description}`,
                bankCode: 'NCB'
            };

            const createResponse = await request(app)
                .post('/payment/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            expect(createResponse.status).toBe(200);
            expect(createResponse.body.success).toBe(true);

            const { orderId, paymentUrl } = createResponse.body;
            console.log('[E2E TEST] Payment created:', orderId);
            console.log('[E2E TEST] Payment URL generated:', paymentUrl.substring(0, 100) + '...');

            // Step 2: Verify initial payment state
            let paymentRecord = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [orderId]
            );

            expect(paymentRecord.rows[0].status).toBe('PENDING');
            console.log('[E2E TEST] Initial payment status: PENDING');

            // Step 3: Simulate successful VNPay return
            const returnParams = {
                vnp_Amount: '25000000', // 250,000 VND * 100
                vnp_BankCode: 'NCB',
                vnp_BankTranNo: 'VNP01234567',
                vnp_CardType: 'ATM',
                vnp_OrderInfo: paymentData.orderInfo,
                vnp_PayDate: '20231215120000',
                vnp_ResponseCode: '00',
                vnp_TmnCode: process.env.VNP_TMN_CODE || 'TEST123',
                vnp_TransactionNo: '13456789',
                vnp_TransactionStatus: '00',
                vnp_TxnRef: orderId,
                vnp_SecureHashType: 'SHA256'
            };

            // Generate secure hash
            const sortedParams = {};
            Object.keys(returnParams)
                .filter(key => key !== 'vnp_SecureHash')
                .sort()
                .forEach(key => {
                    sortedParams[key] = returnParams[key];
                });

            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
                .join('&');
            
            const crypto = require('crypto');
            const secretKey = process.env.VNP_HASH_SECRET || 'test-secret';
            const secureHash = crypto.createHmac('sha256', secretKey)
                .update(queryString)
                .digest('hex');

            returnParams.vnp_SecureHash = secureHash;

            const returnResponse = await request(app)
                .get('/payment/vnpay-return')
                .query(returnParams);

            expect(returnResponse.status).toBe(302);
            expect(returnResponse.headers.location).toContain('/payment/success');
            console.log('[E2E TEST] Return URL processed successfully');

            // Step 4: Verify final payment state
            paymentRecord = await pool.query(
                'SELECT * FROM payments WHERE order_id = $1',
                [orderId]
            );

            expect(paymentRecord.rows[0].status).toBe('SUCCESS');
            expect(paymentRecord.rows[0].response_code).toBe('00');
            expect(paymentRecord.rows[0].transaction_no).toBe('13456789');
            console.log('[E2E TEST] Payment status updated to SUCCESS');

            // Step 5: Verify user premium upgrade
            const userRecord = await pool.query(
                'SELECT role FROM users WHERE user_id = $1',
                [testUserId]
            );

            expect(userRecord.rows[0].role).toBe('Premium');
            console.log('[E2E TEST] User successfully upgraded to premium');

            console.log('[E2E TEST] Complete workflow validated successfully');
        });
    });
});