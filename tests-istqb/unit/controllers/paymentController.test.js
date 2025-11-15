const Payment = require('../../../models/Payment');
const SystemLog = require('../../../models/SystemLog');
const PaymentController = require('../../../controllers/paymentController');
const Payment = require('../../../models/Payment');
const VNPayService = require('../../../services/vnpayService');
const PaymentController = require('../../../controllers/paymentController');
const Payment = require('../../../models/Payment');
const PaymentController = require('../../../controllers/paymentController');

    test('should handle errors gracefully', async () => {
      const req = {
        user: { user_id: 1 },
        query: { page: 1, limit: 10 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      
      Payment.findByUserId = jest.fn().mockRejectedValue(new Error('Database error'));
      SystemLog.error = jest.fn().mockResolvedValue();

      await PaymentController.getPaymentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to get payment history',
        message: 'Database error'
      });
      expect(SystemLog.error).toHaveBeenCalledWith(
        'payment',
        'get_history',
        'Database error',
        1
      );
    });

    test('should format payment amounts correctly', async () => {
      const req = {
        user: { user_id: 1 },
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn()
      };

      const mockPayments = [
        {
          payment_id: 1,
          amount: 100000,
          response_code: '00',
          status: 'SUCCESS'
        }
      ];

      
      Payment.findByUserId = jest.fn().mockResolvedValue(mockPayments);
      VNPayService.formatAmount = jest.fn().mockReturnValue('100,000 VND');
      VNPayService.getTransactionStatusMessage = jest.fn().mockReturnValue('Success');

      await PaymentController.getPaymentHistory(req, res);

      expect(VNPayService.formatAmount).toHaveBeenCalledWith(100000);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        payments: [{
          payment_id: 1,
          amount: 100000,
          response_code: '00',
          status: 'SUCCESS',
          formatted_amount: '100,000 VND',
          status_message: 'Success'
        }]
      });
    });

    test('should apply pagination parameters', async () => {
      const req = {
        user: { user_id: 1 },
        query: { page: '2', limit: '20' }
      };
      const res = {
        json: jest.fn()
      };

      Payment.findByUserId = jest.fn().mockResolvedValue([]);

      await PaymentController.getPaymentHistory(req, res);

      expect(Payment.findByUserId).toHaveBeenCalledWith(1, {
        page: 2,
        limit: 20
      });
    });