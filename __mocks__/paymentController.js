/**
 * Mock Payment Controller
 * This file mocks the payment controller for testing purposes
 */

// Mock payment records
const paymentRecords = [
    {
        id: 'pay123',
        userId: 'user123',
        amount: 100000,
        status: 'COMPLETED',
        orderInfo: 'Premium subscription',
        transactionNo: 'txn123',
        bankCode: 'NCB',
        cardType: 'ATM',
        createdAt: '2022-01-01T12:00:00Z',
        updatedAt: '2022-01-01T12:05:00Z'
    },
    {
        id: 'pay456',
        userId: 'user123',
        amount: 50000,
        status: 'PENDING',
        orderInfo: 'Plant monitoring service',
        createdAt: '2022-01-15T10:30:00Z',
        updatedAt: '2022-01-15T10:30:00Z'
    }
];

/**
 * Create a new payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPayment = async (req, res) => {
    const { amount, orderInfo, returnUrl } = req.body;
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment amount'
        });
    }
    
    // Generate a new payment record
    const newPayment = {
        id: `pay${Date.now()}`,
        userId,
        amount,
        status: 'CREATED',
        orderInfo: orderInfo || 'Payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // In a real implementation, this would be saved to the database
    
    // Generate a payment URL (mocking VNPay integration)
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${amount * 100}&vnp_OrderInfo=${encodeURIComponent(orderInfo)}&vnp_ReturnUrl=${encodeURIComponent(returnUrl)}&vnp_TxnRef=${newPayment.id}`;
    
    return res.json({
        success: true,
        paymentUrl,
        orderId: newPayment.id,
        amount: amount
    });
};

/**
 * Get payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentStatus = async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;
    
    // Find the payment in mock data
    const payment = paymentRecords.find(p => p.id === paymentId);
    
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    
    // Check if the payment belongs to the user
    if (payment.userId !== userId) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to payment information'
        });
    }
    
    return res.json({
        success: true,
        ...payment
    });
};

/**
 * Get payment history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentHistory = async (req, res) => {
    const userId = req.user.id;
    
    // Filter payments by userId
    const userPayments = paymentRecords.filter(p => p.userId === userId);
    
    return res.json(userPayments);
};

/**
 * Handle VNPay callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleVNPayCallback = async (req, res) => {
    const {
        vnp_ResponseCode,
        vnp_TxnRef,
        vnp_Amount,
        vnp_TransactionNo,
        vnp_BankCode,
        vnp_PayDate
    } = req.query;
    
    // Check if the payment was successful
    const isSuccessful = vnp_ResponseCode === '00';
    
    if (isSuccessful) {
        // In a real implementation, we would update the payment status in the database
        
        // Redirect to success page with parameters
        return res.redirect(`/payment/success?orderId=${vnp_TxnRef}&amount=${parseInt(vnp_Amount) / 100}`);
    } else {
        // Redirect to failure page with parameters
        return res.redirect(`/payment/failure?orderId=${vnp_TxnRef}&errorCode=${vnp_ResponseCode}`);
    }
};

/**
 * Process a refund request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refundPayment = async (req, res) => {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    // Find the payment in mock data
    const payment = paymentRecords.find(p => p.id === paymentId);
    
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    
    // Check if the payment belongs to the user
    if (payment.userId !== userId) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access to payment information'
        });
    }
    
    // Check if the payment can be refunded
    if (payment.status !== 'COMPLETED') {
        return res.status(400).json({
            success: false,
            message: 'Only completed payments can be refunded'
        });
    }
    
    // In a real implementation, we would process the refund through the payment gateway
    
    // Generate a refund ID
    const refundId = `ref${Date.now()}`;
    
    return res.json({
        success: true,
        refundId,
        message: 'Refund request processed successfully',
        payment: {
            id: payment.id,
            amount: payment.amount,
            status: 'REFUNDED'
        }
    });
};

module.exports = {
    createPayment,
    getPaymentStatus,
    getPaymentHistory,
    handleVNPayCallback,
    refundPayment
};