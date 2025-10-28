// VNPay Service Mock for Testing
// Simulates different payment card scenarios

const mockVNPayService = {
    // Test card data mapping
    TEST_CARDS: {
        '9704198526191432198': { // Success card
            responseCode: '00',
            status: 'SUCCESS',
            message: 'Giao dịch thành công'
        },
        '9704195798459170488': { // Insufficient funds
            responseCode: '51',
            status: 'FAILED',
            message: 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.'
        },
        '9704192181368742': { // Card not activated
            responseCode: '09',
            status: 'FAILED',
            message: 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.'
        },
        '9704193370791314': { // Card blocked
            responseCode: '12',
            status: 'FAILED',
            message: 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.'
        },
        '9704194841945513': { // Card expired
            responseCode: '11',
            status: 'FAILED',
            message: 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.'
        },
        '4456530000001005': { // International VISA
            responseCode: '00',
            status: 'SUCCESS',
            message: 'Giao dịch thành công'
        }
    },

    validateAmount: jest.fn((amount) => {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) && numAmount >= 5000 && numAmount <= 500000000;
    }),

    generateOrderId: jest.fn((prefix = 'PREMIUM') => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}`;
    }),

    getClientIpAddress: jest.fn((req) => {
        return req?.ip || '127.0.0.1';
    }),

    createPaymentUrl: jest.fn(({ amount, orderId, orderInfo, ipAddr, bankCode }) => {
        // Simulate payment URL creation
        const baseUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const params = new URLSearchParams({
            vnp_Amount: Math.round(amount * 100).toString(),
            vnp_Command: 'pay',
            vnp_OrderInfo: orderInfo,
            vnp_TxnRef: orderId,
            vnp_IpAddr: ipAddr,
            vnp_BankCode: bankCode || ''
        });
        
        return `${baseUrl}?${params.toString()}`;
    }),

    verifyReturnUrl: jest.fn((vnpayData) => {
        const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount, vnp_CardType } = vnpayData;
        
        // Simulate signature verification (always valid in tests unless specified)
        const isValid = vnpayData.vnp_SecureHash !== 'invalid_signature';
        
        if (!isValid) {
            return {
                isValid: false,
                message: 'Invalid signature'
            };
        }

        const transaction = {
            orderId: vnp_TxnRef,
            amount: parseFloat(vnp_Amount) / 100,
            orderInfo: vnpayData.vnp_OrderInfo,
            responseCode: vnp_ResponseCode,
            transactionNo: vnpayData.vnp_TransactionNo || 'TEST_TXN_' + Date.now(),
            bankCode: vnpayData.vnp_BankCode,
            payDate: vnpayData.vnp_PayDate || new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
            transactionStatus: vnpayData.vnp_TransactionStatus || vnp_ResponseCode,
            isSuccess: vnp_ResponseCode === '00',
            cardType: vnp_CardType
        };

        return {
            isValid: true,
            transaction
        };
    }),

    verifyIpnCall: jest.fn((vnpayData) => {
        // Similar to verifyReturnUrl but for IPN
        return mockVNPayService.verifyReturnUrl(vnpayData);
    }),

    getTransactionStatusMessage: jest.fn((responseCode) => {
        const statusMessages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
            '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
            '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
            '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
            '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
            '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
            '75': 'Ngân hàng thanh toán đang bảo trì.',
            '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
            '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách).'
        };

        return statusMessages[responseCode] || 'Lỗi không xác định';
    }),

    formatAmount: jest.fn((amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }),

    // Helper method to simulate card-specific responses
    simulateCardResponse: (cardNumber, orderId) => {
        const cardData = mockVNPayService.TEST_CARDS[cardNumber];
        if (!cardData) {
            return {
                vnp_ResponseCode: '99',
                vnp_TransactionStatus: '99',
                isSuccess: false
            };
        }

        return {
            vnp_TxnRef: orderId,
            vnp_ResponseCode: cardData.responseCode,
            vnp_TransactionStatus: cardData.responseCode,
            vnp_BankCode: cardNumber.startsWith('4456') ? 'INTCARD' : 'NCB',
            vnp_CardType: cardNumber.startsWith('4456') ? 'VISA' : 'ATM',
            isSuccess: cardData.status === 'SUCCESS'
        };
    }
};

module.exports = mockVNPayService;