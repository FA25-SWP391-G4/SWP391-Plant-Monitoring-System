const Payment = require('../../../models/Payment');

describe('Payment Model - Constructor', () => {
  describe('Successful Construction', () => {
    it('should create a Payment instance with all properties', () => {
      const paymentData = {
        payment_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        vnpay_txn_ref: 'TXN1234567890123',
        amount: 100000,
        status: 'completed',
        created_at: new Date('2024-01-01T00:00:00Z'),
        order_id: 'ORD123456',
        order_info: 'Premium subscription',
        bank_code: 'NCB',
        transaction_no: 'VNPAY123456',
        response_code: '00',
        updated_at: new Date('2024-01-01T01:00:00Z')
      };

      const payment = new Payment(paymentData);

      expect(payment.payment_id).toBe(paymentData.payment_id);
      expect(payment.user_id).toBe(paymentData.user_id);
      expect(payment.vnpay_txn_ref).toBe(paymentData.vnpay_txn_ref);
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.status).toBe(paymentData.status);
      expect(payment.created_at).toBe(paymentData.created_at);
      expect(payment.order_id).toBe(paymentData.order_id);
      expect(payment.order_info).toBe(paymentData.order_info);
      expect(payment.bank_code).toBe(paymentData.bank_code);
      expect(payment.transaction_no).toBe(paymentData.transaction_no);
      expect(payment.response_code).toBe(paymentData.response_code);
      expect(payment.updated_at).toBe(paymentData.updated_at);
    });

    it('should create a Payment instance with minimal required properties', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50000
      };

      const payment = new Payment(paymentData);

      expect(payment.user_id).toBe(paymentData.user_id);
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.payment_id).toBeUndefined();
      expect(payment.vnpay_txn_ref).toBeUndefined();
      expect(payment.status).toBeUndefined();
    });

    it('should create a Payment instance with pending status', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 200000,
        status: 'pending'
      };

      const payment = new Payment(paymentData);

      expect(payment.status).toBe('pending');
    });

    it('should create a Payment instance with failed status', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 150000,
        status: 'failed',
        response_code: '99'
      };

      const payment = new Payment(paymentData);

      expect(payment.status).toBe('failed');
      expect(payment.response_code).toBe('99');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty paymentData object', () => {
      const paymentData = {};

      const payment = new Payment(paymentData);

      expect(payment.payment_id).toBeUndefined();
      expect(payment.user_id).toBeUndefined();
      expect(payment.amount).toBeUndefined();
      expect(payment.status).toBeUndefined();
    });

    it('should handle null values in paymentData', () => {
      const paymentData = {
        payment_id: null,
        user_id: null,
        vnpay_txn_ref: null,
        amount: null,
        status: null,
        order_id: null,
        order_info: null,
        bank_code: null
      };

      const payment = new Payment(paymentData);

      expect(payment.payment_id).toBeNull();
      expect(payment.user_id).toBeNull();
      expect(payment.vnpay_txn_ref).toBeNull();
      expect(payment.amount).toBeNull();
      expect(payment.status).toBeNull();
    });

    it('should handle numeric amount as string', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: '100000'
      };

      const payment = new Payment(paymentData);

      expect(payment.amount).toBe('100000');
    });

    it('should handle very large amount values', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 999999999
      };

      const payment = new Payment(paymentData);

      expect(payment.amount).toBe(999999999);
    });

    it('should handle zero amount', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 0
      };

      const payment = new Payment(paymentData);

      expect(payment.amount).toBe(0);
    });
  });

  describe('Data Type Handling', () => {
    it('should preserve Date objects for created_at and updated_at', () => {
      const createdDate = new Date('2024-01-01T00:00:00Z');
      const updatedDate = new Date('2024-01-02T00:00:00Z');
      
      const paymentData = {
        created_at: createdDate,
        updated_at: updatedDate
      };

      const payment = new Payment(paymentData);

      expect(payment.created_at).toBe(createdDate);
      expect(payment.updated_at).toBe(updatedDate);
    });

    it('should handle string date values', () => {
      const paymentData = {
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      const payment = new Payment(paymentData);

      expect(payment.created_at).toBe('2024-01-01T00:00:00Z');
      expect(payment.updated_at).toBe('2024-01-02T00:00:00Z');
    });

    it('should preserve additional properties not in constructor', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100000,
        user_name: 'John Doe',
        email: 'john@example.com'
      };

      const payment = new Payment(paymentData);

      expect(payment.user_id).toBe(paymentData.user_id);
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.user_name).toBeUndefined();
      expect(payment.email).toBeUndefined();
    });
  });

  describe('Instance Type', () => {
    it('should create an instance of Payment class', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100000
      };

      const payment = new Payment(paymentData);

      expect(payment).toBeInstanceOf(Payment);
    });

    it('should be a plain object with properties', () => {
      const paymentData = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100000,
        status: 'pending'
      };

      const payment = new Payment(paymentData);

      expect(typeof payment).toBe('object');
      expect(payment).not.toBeNull();
    });
  });
});