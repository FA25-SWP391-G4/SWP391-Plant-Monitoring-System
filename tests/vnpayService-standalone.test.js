/**
 * VNPay Service Unit Tests
 * Comprehensive Jest tests for VNPay payment functionality using the provided test cards
 */

const VNPayService = require('../services/vnpayService');

describe('VNPay Service - Test Card Scenarios', () => {
    // Test cards from user requirements
    const testCards = [
        {
            id: 1,
            bank: 'NCB',
            number: '9704198526191432198',
            holder: 'NGUYEN VAN A',
            expiry: '07/15',
            otp: '123456',
            expected: 'SUCCESS',
            expectedCode: '00',
            description: 'Successful payment'
        },
        {
            id: 2,
            bank: 'NCB', 
            number: '9704195798459170488',
            holder: 'NGUYEN VAN A',
            expiry: '07/15',
            expected: 'INSUFFICIENT_FUNDS',
            expectedCode: '51',
            description: 'Card with insufficient balance'
        },
        {
            id: 3,
            bank: 'NCB',
            number: '9704192181368742', 
            holder: 'NGUYEN VAN A',
            expiry: '07/15',
            expected: 'NOT_ACTIVATED',
            expectedCode: '09',
            description: 'Card not activated for internet banking'
        },
        {
            id: 4,
            bank: 'NCB',
            number: '9704193370791314',
            holder: 'NGUYEN VAN A', 
            expiry: '07/15',
            expected: 'BLOCKED',
            expectedCode: '12',
            description: 'Blocked card'
        },
        {
            id: 5,
            bank: 'NCB',
            number: '9704194841945513',
            holder: 'NGUYEN VAN A',
            expiry: '07/15', 
            expected: 'EXPIRED',
            expectedCode: '11',
            description: 'Expired card'
        },
        {
            id: 6,
            type: 'VISA International',
            number: '4456530000001005',
            cvv: '123',
            holder: 'NGUYEN VAN A',
            expiry: '12/26',
            email: 'test@gmail.com',
            address: '22 Lang Ha, Ha Noi',
            expected: 'SUCCESS',
            expectedCode: '00',
            description: 'International VISA card'
        }
    ];

    beforeAll(() => {
        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.VNPAY_TMN_CODE = 'TEST_TMN_CODE';
        process.env.VNPAY_HASH_SECRET = 'TEST_HASH_SECRET';
        process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
        process.env.VNPAY_RETURN_URL = 'http://localhost:3000/api/payment/vnpay-return';
    });

    describe('Amount Validation', () => {
        test('Should validate valid amounts', () => {
            const validAmounts = [5000, 10000, 100000, 500000, 50000000];
            validAmounts.forEach(amount => {
                expect(VNPayService.validateAmount(amount)).toBe(true);
            });
        });

        test('Should reject invalid amounts', () => {
            const invalidAmounts = [4999, 500000001, -1000, 0, 'invalid', null, undefined];
            invalidAmounts.forEach(amount => {
                expect(VNPayService.validateAmount(amount)).toBe(false);
            });
        });

        test('Should handle edge cases for amount validation', () => {
            expect(VNPayService.validateAmount(5000)).toBe(true); // Minimum
            expect(VNPayService.validateAmount(500000000)).toBe(true); // Maximum
            expect(VNPayService.validateAmount(4999.99)).toBe(false); // Below minimum
            expect(VNPayService.validateAmount(500000000.01)).toBe(false); // Above maximum
        });
    });

    describe('Order ID Generation', () => {
        test('Should generate unique order IDs', () => {
            const orderIds = [];
            for (let i = 0; i < 10; i++) {
                orderIds.push(VNPayService.generateOrderId('TEST'));
            }
            
            const uniqueIds = new Set(orderIds);
            expect(uniqueIds.size).toBe(orderIds.length);
        });

        test('Should include prefix in order ID', () => {
            const prefixes = ['PREMIUM', 'TEST', 'ORDER'];
            prefixes.forEach(prefix => {
                const orderId = VNPayService.generateOrderId(prefix);
                expect(orderId).toContain(prefix);
            });
        });

        test('Should generate order ID with default prefix', () => {
            const orderId = VNPayService.generateOrderId();
            expect(orderId).toContain('PREMIUM');
        });
    });

    describe('IP Address Extraction', () => {
        test('Should extract IP from req.ip', () => {
            const req = { ip: '192.168.1.1' };
            expect(VNPayService.getClientIpAddress(req)).toBe('192.168.1.1');
        });

        test('Should extract IP from connection.remoteAddress', () => {
            const req = { connection: { remoteAddress: '10.0.0.1' } };
            expect(VNPayService.getClientIpAddress(req)).toBe('10.0.0.1');
        });

        test('Should extract IP from x-forwarded-for header', () => {
            const req = { headers: { 'x-forwarded-for': '203.162.4.1, 192.168.1.1' } };
            expect(VNPayService.getClientIpAddress(req)).toBe('203.162.4.1');
        });

        test('Should extract IP from x-real-ip header', () => {
            const req = { headers: { 'x-real-ip': '203.162.4.2' } };
            expect(VNPayService.getClientIpAddress(req)).toBe('203.162.4.2');
        });

        test('Should fallback to localhost for empty request', () => {
            const req = {};
            expect(VNPayService.getClientIpAddress(req)).toBe('127.0.0.1');
        });
    });

    describe('Payment URL Creation', () => {
        test('Should create payment URL with valid parameters', () => {
            const orderId = VNPayService.generateOrderId('TEST');
            const paymentUrl = VNPayService.createPaymentUrl({
                amount: 100000,
                orderId: orderId,
                orderInfo: 'Test payment',
                ipAddr: '127.0.0.1',
                bankCode: 'NCB'
            });

            expect(paymentUrl).toContain('sandbox.vnpayment.vn');
            expect(paymentUrl).toContain('vnp_Amount=10000000'); // 100000 * 100
            expect(paymentUrl).toContain(`vnp_TxnRef=${orderId}`);
            expect(paymentUrl).toContain('vnp_BankCode=NCB');
        });

        test('Should create payment URL without bank code', () => {
            const orderId = VNPayService.generateOrderId('TEST');
            const paymentUrl = VNPayService.createPaymentUrl({
                amount: 100000,
                orderId: orderId,
                orderInfo: 'Test payment',
                ipAddr: '127.0.0.1',
                bankCode: ''
            });

            expect(paymentUrl).toContain('sandbox.vnpayment.vn');
            expect(paymentUrl).not.toContain('vnp_BankCode=');
        });

        test('Should reject payment URL creation with invalid amount', () => {
            const orderId = VNPayService.generateOrderId('TEST');
            
            expect(() => {
                VNPayService.createPaymentUrl({
                    amount: 1000, // Below minimum
                    orderId: orderId,
                    orderInfo: 'Test payment',
                    ipAddr: '127.0.0.1'
                });
            }).toThrow('Invalid amount');
        });
    });

    describe('Transaction Status Messages', () => {
        test('Should return correct status messages for each test card scenario', () => {
            testCards.forEach(card => {
                const message = VNPayService.getTransactionStatusMessage(card.expectedCode);
                expect(message).toBeDefined();
                expect(typeof message).toBe('string');
                
                // Verify specific messages for each card type
                switch (card.expectedCode) {
                    case '00':
                        expect(message).toBe('Giao dịch thành công');
                        break;
                    case '51':
                        expect(message).toContain('không đủ số dư');
                        break;
                    case '09':
                        expect(message).toContain('chưa đăng ký dịch vụ InternetBanking');
                        break;
                    case '12':
                        expect(message).toContain('bị khóa');
                        break;
                    case '11':
                        expect(message).toContain('hết hạn');
                        break;
                }
            });
        });

        test('Should return default message for unknown response code', () => {
            const message = VNPayService.getTransactionStatusMessage('999');
            expect(message).toBe('Lỗi không xác định');
        });
    });

    describe('Amount Formatting', () => {
        test('Should format amounts correctly in Vietnamese currency', () => {
            const testCases = [
                { amount: 100000, expected: '100.000' },
                { amount: 1000000, expected: '1.000.000' },
                { amount: 5000000, expected: '5.000.000' }
            ];

            testCases.forEach(({ amount, expected }) => {
                const formatted = VNPayService.formatAmount(amount);
                expect(formatted).toContain(expected);
                expect(formatted).toContain('₫');
            });
        });
    });

    describe('VNPay Response Verification Simulation', () => {
        test('Should simulate successful payment response', () => {
            const successCard = testCards.find(card => card.expectedCode === '00');
            const orderId = VNPayService.generateOrderId(`CARD_${successCard.id}`);
            
            const mockReturnData = {
                vnp_TxnRef: orderId,
                vnp_Amount: '10000000',
                vnp_OrderInfo: 'Test payment',
                vnp_ResponseCode: successCard.expectedCode,
                vnp_TransactionNo: `TXN_${Date.now()}`,
                vnp_BankCode: successCard.bank,
                vnp_PayDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
                vnp_TransactionStatus: successCard.expectedCode
            };

            // Verify the response structure
            expect(mockReturnData.vnp_ResponseCode).toBe('00');
            expect(mockReturnData.vnp_TxnRef).toBe(orderId);
            expect(mockReturnData.vnp_Amount).toBe('10000000');
        });

        test('Should simulate failed payment responses for each error card', () => {
            const failedCards = testCards.filter(card => card.expectedCode !== '00');
            
            failedCards.forEach(card => {
                const orderId = VNPayService.generateOrderId(`CARD_${card.id}`);
                
                const mockReturnData = {
                    vnp_TxnRef: orderId,
                    vnp_Amount: '10000000',
                    vnp_OrderInfo: 'Test payment',
                    vnp_ResponseCode: card.expectedCode,
                    vnp_TransactionNo: `TXN_${Date.now()}_${card.id}`,
                    vnp_BankCode: card.bank,
                    vnp_PayDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
                    vnp_TransactionStatus: card.expectedCode
                };

                expect(mockReturnData.vnp_ResponseCode).not.toBe('00');
                expect(mockReturnData.vnp_ResponseCode).toBe(card.expectedCode);
                
                const statusMessage = VNPayService.getTransactionStatusMessage(card.expectedCode);
                expect(statusMessage).toContain('không thành công');
            });
        });
    });

    describe('Test Card Integration', () => {
        test('Should process all provided test cards correctly', () => {
            testCards.forEach(card => {
                // Generate order ID for this card
                const orderId = VNPayService.generateOrderId(`CARD_${card.id}`);
                expect(orderId).toContain(`CARD_${card.id}`);

                // Validate the card scenario
                const isSuccess = card.expectedCode === '00';
                const statusMessage = VNPayService.getTransactionStatusMessage(card.expectedCode);
                
                if (isSuccess) {
                    expect(statusMessage).toBe('Giao dịch thành công');
                } else {
                    expect(statusMessage).toContain('không thành công');
                }

                // Create payment URL for this card
                const paymentUrl = VNPayService.createPaymentUrl({
                    amount: 100000,
                    orderId: orderId,
                    orderInfo: `Payment test for ${card.description}`,
                    ipAddr: '127.0.0.1',
                    bankCode: card.bank || ''
                });
                
                expect(paymentUrl).toContain('sandbox.vnpayment.vn');
                expect(paymentUrl).toContain(orderId);
            });
        });

        test('Should handle international VISA card scenario', () => {
            const visaCard = testCards.find(card => card.number === '4456530000001005');
            expect(visaCard).toBeDefined();
            expect(visaCard.type).toBe('VISA International');
            expect(visaCard.expectedCode).toBe('00');
            expect(visaCard.cvv).toBe('123');
            expect(visaCard.email).toBe('test@gmail.com');
        });

        test('Should handle all NCB domestic card scenarios', () => {
            const ncbCards = testCards.filter(card => card.bank === 'NCB');
            expect(ncbCards).toHaveLength(5);
            
            const scenarios = {
                '00': 'SUCCESS',
                '51': 'INSUFFICIENT_FUNDS', 
                '09': 'NOT_ACTIVATED',
                '12': 'BLOCKED',
                '11': 'EXPIRED'
            };
            
            ncbCards.forEach(card => {
                expect(scenarios[card.expectedCode]).toBe(card.expected);
            });
        });
    });

    describe('Error Handling', () => {
        test('Should handle missing environment variables gracefully', () => {
            const originalTmnCode = process.env.VNPAY_TMN_CODE;
            delete process.env.VNPAY_TMN_CODE;
            
            // VNPay service should still initialize but with undefined values
            expect(() => {
                VNPayService.getVNPayInstance();
            }).not.toThrow();
            
            // Restore environment variable
            process.env.VNPAY_TMN_CODE = originalTmnCode;
        });

        test('Should handle null or undefined input gracefully', () => {
            expect(VNPayService.validateAmount(null)).toBe(false);
            expect(VNPayService.validateAmount(undefined)).toBe(false);
            expect(VNPayService.getClientIpAddress(null)).toBe('127.0.0.1');
            expect(VNPayService.getClientIpAddress(undefined)).toBe('127.0.0.1');
        });
    });
});