const VNPayService = require('../../../services/vnpayService');
const { VNPay, HashAlgorithm, VnpLocale, ProductCode } = require('vnpay');

// Mock the vnpay library
jest.mock('vnpay');

describe('VNPayService', () => {
  let mockVNPayInstance;

  beforeEach(() => {
    // Reset environment variables
    process.env.VNPAY_TMN_CODE = 'CGW7KJK7';
    process.env.VNPAY_HASH_SECRET = 'VGTLQQIUPSSO4ERSSAMGVFS5RRSGBEHT';
    process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payment/vnpay-return';

    // Reset the singleton instance
    VNPayService.vnpayInstance = null;

    // Mock VNPay instance
    mockVNPayInstance = {
      buildPaymentUrl: jest.fn(),
      verifyIpnCall: jest.fn(),
      verifyReturnUrl: jest.fn()
    };

    VNPay.mockImplementation(() => mockVNPayInstance);

    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getVNPayInstance', () => {
    it('should create a new VNPay instance with correct configuration', () => {
      const instance = VNPayService.getVNPayInstance();

      expect(VNPay).toHaveBeenCalledWith({
        tmnCode: 'TEST_TMN_CODE',
        secureSecret: 'TEST_SECRET',
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: HashAlgorithm.SHA512,
        enableLog: true
      });
      expect(instance).toBe(mockVNPayInstance);
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = VNPayService.getVNPayInstance();
      const instance2 = VNPayService.getVNPayInstance();

      expect(instance1).toBe(instance2);
      expect(VNPay).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateAmount', () => {
    it('should return true for valid amounts', () => {
      expect(VNPayService.validateAmount(5000)).toBe(true);
      expect(VNPayService.validateAmount(100000)).toBe(true);
      expect(VNPayService.validateAmount(500000000)).toBe(true);
    });

    it('should return false for amounts below minimum', () => {
      expect(VNPayService.validateAmount(4999)).toBe(false);
      expect(VNPayService.validateAmount(0)).toBe(false);
    });

    it('should return false for amounts above maximum', () => {
      expect(VNPayService.validateAmount(500000001)).toBe(false);
    });

    it('should return false for invalid amounts', () => {
      expect(VNPayService.validateAmount('invalid')).toBe(false);
      expect(VNPayService.validateAmount(NaN)).toBe(false);
      expect(VNPayService.validateAmount(null)).toBe(false);
    });

    it('should handle string numbers', () => {
      expect(VNPayService.validateAmount('10000')).toBe(true);
      expect(VNPayService.validateAmount('4999')).toBe(false);
    });
  });

  describe('generateOrderId', () => {
    it('should generate order ID with default prefix', () => {
      const orderId = VNPayService.generateOrderId();
      expect(orderId).toMatch(/^PREMIUM_\d+_\d+$/);
    });

    it('should generate order ID with custom prefix', () => {
      const orderId = VNPayService.generateOrderId('CUSTOM');
      expect(orderId).toMatch(/^CUSTOM_\d+_\d+$/);
    });

    it('should generate unique order IDs', () => {
      const orderId1 = VNPayService.generateOrderId();
      const orderId2 = VNPayService.generateOrderId();
      expect(orderId1).not.toBe(orderId2);
    });
  });

  describe('getClientIpAddress', () => {
    it('should return default IP when req is null', () => {
      expect(VNPayService.getClientIpAddress(null)).toBe('127.0.0.1');
    });

    it('should extract IP from forwarded header', () => {
      const req = { headers: { forwarded: '192.168.1.1' } };
      expect(VNPayService.getClientIpAddress(req)).toBe('192.168.1.1');
    });

    it('should extract IP from req.ip', () => {
      const req = { headers: {}, ip: '192.168.1.2' };
      expect(VNPayService.getClientIpAddress(req)).toBe('192.168.1.2');
    });

    it('should extract IP from socket.remoteAddress', () => {
      const req = { headers: {}, socket: { remoteAddress: '192.168.1.3' } };
      expect(VNPayService.getClientIpAddress(req)).toBe('192.168.1.3');
    });

    it('should extract IP from connection.remoteAddress', () => {
      const req = { headers: {}, connection: { remoteAddress: '192.168.1.4' } };
      expect(VNPayService.getClientIpAddress(req)).toBe('192.168.1.4');
    });

    it('should return default IP when no IP found', () => {
      const req = { headers: {} };
      expect(VNPayService.getClientIpAddress(req)).toBe('127.0.0.1');
    });
  });

  describe('createPaymentUrl', () => {
    it('should create payment URL successfully', () => {
      const mockUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000';
      mockVNPayInstance.buildPaymentUrl.mockReturnValue(mockUrl);

      const params = {
        amount: 10000,
        orderId: 'ORDER123',
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1'
      };

      const result = VNPayService.createPaymentUrl(params);

      expect(result).toBe(mockUrl);
      expect(mockVNPayInstance.buildPaymentUrl).toHaveBeenCalled();
    });

    it('should throw error for invalid amount', () => {
      const params = {
        amount: 1000,
        orderId: 'ORDER123',
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1'
      };

      expect(() => VNPayService.createPaymentUrl(params)).toThrow('Invalid amount');
    });

    it('should handle VNPay library errors', () => {
      mockVNPayInstance.buildPaymentUrl.mockImplementation(() => {
        throw new Error('VNPay error');
      });

      const params = {
        amount: 10000,
        orderId: 'ORDER123',
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1'
      };

      expect(() => VNPayService.createPaymentUrl(params)).toThrow('Failed to create payment URL');
    });
  });

  describe('formatCreateDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:45');
      const result = VNPayService.formatCreateDate(date);
      expect(result).toMatch(/^\d{14}$/);
      expect(result).toBe('20240115103045');
    });

    it('should pad single digits with zeros', () => {
      const date = new Date('2024-01-05T09:05:05');
      const result = VNPayService.formatCreateDate(date);
      expect(result).toBe('20240105090505');
    });
  });

  describe('verifyIpnCall', () => {
    it('should verify IPN call successfully', () => {
      mockVNPayInstance.verifyIpnCall.mockReturnValue(true);

      const vnpayData = {
        vnp_TxnRef: 'ORDER123',
        vnp_Amount: '1000000',
        vnp_OrderInfo: 'Test payment',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'TXN123',
        vnp_BankCode: 'NCB',
        vnp_PayDate: '20240115103045',
        vnp_TransactionStatus: '00'
      };

      const result = VNPayService.verifyIpnCall(vnpayData);

      expect(result.isValid).toBe(true);
      expect(result.transaction.orderId).toBe('ORDER123');
      expect(result.transaction.amount).toBe(10000);
      expect(result.transaction.isSuccess).toBe(true);
    });

    it('should return invalid for incorrect signature', () => {
      mockVNPayInstance.verifyIpnCall.mockReturnValue(false);

      const vnpayData = {
        vnp_TxnRef: 'ORDER123',
        vnp_Amount: '1000000'
      };

      const result = VNPayService.verifyIpnCall(vnpayData);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should handle verification errors', () => {
      mockVNPayInstance.verifyIpnCall.mockImplementation(() => {
        throw new Error('Verification failed');
      });

      const result = VNPayService.verifyIpnCall({});

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('IPN verification failed');
    });
  });

  describe('verifyReturnUrl', () => {
    it('should verify return URL successfully', () => {
      const mockVerify = {
        isVerified: true,
        isSuccess: true,
        vnp_TxnRef: 'ORDER123',
        vnp_Amount: 1000000,
        vnp_OrderInfo: 'Test payment',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'TXN123',
        vnp_BankCode: 'NCB',
        vnp_PayDate: '20240115103045',
        vnp_TransactionStatus: '00'
      };

      mockVNPayInstance.verifyReturnUrl.mockReturnValue(mockVerify);

      const vnpayData = { vnp_TxnRef: 'ORDER123' };
      const result = VNPayService.verifyReturnUrl(vnpayData);

      expect(result.isValid).toBe(true);
      expect(result.transaction.orderId).toBe('ORDER123');
      expect(result.transaction.isSuccess).toBe(true);
    });

    it('should handle verification failure', () => {
      mockVNPayInstance.verifyReturnUrl.mockReturnValue({
        isVerified: false,
        isSuccess: false
      });

      const result = VNPayService.verifyReturnUrl({});

      expect(result.isValid).toBe(false);
      expect(result.transaction.isSuccess).toBe(false);
    });

    it('should handle verification errors', () => {
      mockVNPayInstance.verifyReturnUrl.mockImplementation(() => {
        throw new Error('Verification error');
      });

      const result = VNPayService.verifyReturnUrl({});

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Return URL verification failed');
    });
  });

  describe('getTransactionStatusMessage', () => {
    it('should return correct message for success code', () => {
      expect(VNPayService.getTransactionStatusMessage('00')).toBe('Giao dịch thành công');
    });

    it('should return correct message for user cancellation', () => {
      expect(VNPayService.getTransactionStatusMessage('24')).toContain('Khách hàng hủy giao dịch');
    });

    it('should return default message for unknown code', () => {
      expect(VNPayService.getTransactionStatusMessage('999')).toBe('Lỗi không xác định');
    });
  });

  describe('formatAmount', () => {
    it('should format amount in Vietnamese currency', () => {
      const result = VNPayService.formatAmount(100000);
      expect(result).toContain('100.000');
      expect(result).toContain('₫');
    });

    it('should format large amounts correctly', () => {
      const result = VNPayService.formatAmount(1000000);
      expect(result).toContain('1.000.000');
    });

    it('should format zero correctly', () => {
      const result = VNPayService.formatAmount(0);
      expect(result).toContain('0');
    });
  });
});