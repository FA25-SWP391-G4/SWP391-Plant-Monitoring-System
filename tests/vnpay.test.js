/**
 * VNPay Payment Tests
 */
const VNPayService = require('../__mocks__/vnpayService');

describe('VNPay Payment Integration', () => {
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    // Mock request and response objects
    mockRequest = {
      body: {},
      params: {},
      ip: '127.0.0.1',
      user: {
        id: 'user123',
        email: 'test@example.com'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('Creating VNPay Payments', () => {
    it('should create a payment URL', () => {
      // Setup test data
      const testOrderId = VNPayService.generateOrderId('TEST');
      const paymentData = {
        amount: 299000,
        orderId: testOrderId,
        orderInfo: 'Test Premium Upgrade Payment',
        orderType: 'premium_upgrade',
        ipAddr: '127.0.0.1'
      };
      
      // Create payment URL
      const result = VNPayService.createPaymentUrl(paymentData);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.paymentUrl).toBeDefined();
      expect(result.paymentUrl.includes('vnp_SecureHash=')).toBeTruthy();
      expect(result.orderId).toBe(testOrderId);
      expect(result.amount).toBe(299000);
    });
    
    it('should handle payment errors', () => {
      // Setup test data with invalid amount
      const testOrderId = VNPayService.generateOrderId('TEST');
      const paymentData = {
        amount: 1000, // Below minimum amount
        orderId: testOrderId,
        orderInfo: 'Test Premium Upgrade Payment',
        orderType: 'premium_upgrade',
        ipAddr: '127.0.0.1'
      };
      
      // Attempt to create payment URL with invalid amount
      expect(() => {
        VNPayService.createPaymentUrl(paymentData);
      }).toThrow('Invalid payment amount');
    });
  });
  
  describe('Payment Return Handler', () => {
    it('should handle successful payment return', () => {
      // Setup mock VNPay return data
      const testOrderId = VNPayService.generateOrderId('TEST');
      const vnpParams = {
        vnp_Amount: '29900000', // 299,000 VND in cents
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Test Premium Upgrade Payment',
        vnp_ResponseCode: '00',
        vnp_TxnRef: testOrderId,
        vnp_TransactionNo: '13876543',
        vnp_PayDate: '20241008104523'
      };
      
      // Add secure hash
      const querystring = require('qs');
      const crypto = require('crypto');
      const sortedParams = VNPayService.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', VNPayService.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams.vnp_SecureHash = signed;
      
      // Verify IPN
      const result = VNPayService.verifyIPN(vnpParams);
      
      // Check verification result
      expect(result.isValid).toBeTruthy();
      expect(result.isSuccess).toBeTruthy();
      expect(result.amount).toBe(299000);
      expect(result.message).toBe('Payment successful');
    });
    
    it('should handle invalid payment return', () => {
      // Setup mock VNPay return data with invalid response code
      const testOrderId = VNPayService.generateOrderId('TEST');
      const vnpParams = {
        vnp_Amount: '29900000', // 299,000 VND in cents
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Test Premium Upgrade Payment',
        vnp_ResponseCode: '51', // Insufficient balance
        vnp_TxnRef: testOrderId,
        vnp_TransactionNo: '13876544',
        vnp_PayDate: '20241008104530'
      };
      
      // Add secure hash
      const querystring = require('qs');
      const crypto = require('crypto');
      const sortedParams = VNPayService.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', VNPayService.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams.vnp_SecureHash = signed;
      
      // Verify IPN
      const result = VNPayService.verifyIPN(vnpParams);
      
      // Check verification result
      expect(result.isValid).toBeTruthy();
      expect(result.isSuccess).toBeFalsy();
      expect(result.message).toBe('Insufficient balance');
    });
  });
  
  describe('VNPay IPN Handler', () => {
    it('should process valid IPN notification', () => {
      // Setup mock VNPay IPN notification
      const testOrderId = VNPayService.generateOrderId('TEST');
      const vnpParams = {
        vnp_Amount: '29900000', // 299,000 VND in cents
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Test Premium Upgrade Payment',
        vnp_ResponseCode: '00',
        vnp_TxnRef: testOrderId,
        vnp_TransactionNo: '13876545',
        vnp_PayDate: '20241008104545'
      };
      
      // Add secure hash
      const querystring = require('qs');
      const crypto = require('crypto');
      const sortedParams = VNPayService.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', VNPayService.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams.vnp_SecureHash = signed;
      
      // Verify IPN
      const result = VNPayService.verifyIPN(vnpParams);
      
      // Check verification result
      expect(result.isValid).toBeTruthy();
      expect(result.isSuccess).toBeTruthy();
    });
    
    it('should handle invalid IPN notification', () => {
      // Setup mock VNPay IPN notification with tampered hash
      const testOrderId = VNPayService.generateOrderId('TEST');
      const vnpParams = {
        vnp_Amount: '29900000', // 299,000 VND in cents
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Test Premium Upgrade Payment',
        vnp_ResponseCode: '00',
        vnp_TxnRef: testOrderId,
        vnp_TransactionNo: '13876546',
        vnp_PayDate: '20241008104600',
        vnp_SecureHash: 'invalid_hash_value'
      };
      
      // Verify IPN
      const result = VNPayService.verifyIPN(vnpParams);
      
      // Check verification result
      expect(result.isValid).toBeFalsy();
    });
  });
});