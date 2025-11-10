// VNPay Service - Community Library Implementation
// Following documentation from https://vnpay.js.org/

const { VNPay, HashAlgorithm, VnpLocale, ProductCode, VnpCurrCode, dateFormat } = require('vnpay');

class VNPayService {
    static getVNPayInstance() {
        if (!this.vnpayInstance) {
            // Configure VNPay with proper settings for sandbox mode
            this.vnpayInstance = new VNPay({
                tmnCode: process.env.VNPAY_TMN_CODE || 'CGW7KJK7',
                secureSecret: process.env.VNPAY_HASH_SECRET || 'VGTLQQIUPSSO4ERSSAMGVFS5RRSGBEHT',
                vnpayHost: 'https://sandbox.vnpayment.vn', // Use the base URL, not the full payment URL
                testMode: true, // Always use test mode for sandbox
                hashAlgorithm: HashAlgorithm.SHA512,
                enableLog: true,  // Enable logging for debugging
            });

            console.log('[VNPAY SERVICE] Initialized with:', {
                tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
                vnpayHost: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn',
                testMode: true,
                returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
                hashAlgorithm: 'SHA512'
            });
        }
        return this.vnpayInstance;
    }

    static validateAmount(amount) {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) && numAmount >= 5000 && numAmount <= 500000000;
    }

    static generateOrderId(prefix = 'PREMIUM') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}`;
    }

    static getClientIpAddress(req) {
        if (!req) return '127.0.0.1';
        
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers?.['x-real-ip'] ||
                      '127.0.0.1';

        // Convert IPv6 localhost to IPv4 format for VNPay compatibility
        if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
            clientIP = '127.0.0.1';
        }

        // Remove IPv6 prefix if present
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }

        console.log('[VNPAY SERVICE] Original IP:', req.ip || 'unknown', 'Processed IP:', clientIP);
        return clientIP;
    }

    static createPaymentUrl({ amount, orderId, orderInfo, ipAddr, bankCode = '' }) {
        try {
            console.log('[VNPAY SERVICE] Creating payment URL:', {
                amount,
                orderId,
                orderInfo,
                ipAddr,
                bankCode: bankCode || 'All payment methods'
            });

            if (!this.validateAmount(amount)) {
                throw new Error('Invalid amount: Must be between 5,000 and 500,000,000 VND');
            }

            const vnpay = this.getVNPayInstance();

            // Build payment parameters exactly like the successful demo
            const paymentParams = {
                vnp_Amount: amount * 100, // VNPay expects amount in smallest currency unit
                vnp_CreateDate: dateFormat(new Date()), // Use dateFormat from vnpay library
                vnp_CurrCode: VnpCurrCode.VND,
                vnp_IpAddr: ipAddr,
                vnp_Locale: VnpLocale.VN,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
                vnp_TxnRef: orderId,
                // Add bank code conditionally like the demo
                ...(bankCode && bankCode.trim() !== '' && { vnp_BankCode: bankCode.trim() })
            };

            console.log('[VNPAY SERVICE] Using bank code:', bankCode || 'All payment methods');

            const paymentUrl = vnpay.buildPaymentUrl(paymentParams);

            console.log('[VNPAY SERVICE] Generated payment URL:', paymentUrl);
            console.log('[VNPAY SERVICE] Payment URL created successfully');
            return paymentUrl;

        } catch (error) {
            console.error('[VNPAY SERVICE] Error creating payment URL:', error);
            throw new Error('Failed to create payment URL: ' + error.message);
        }
    }

    // Format create date according to VNPay requirements: yyyyMMddHHmmss
    static formatCreateDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    static verifyIpnCall(vnpayData) {
        try {
            console.log('[VNPAY SERVICE] Verifying IPN call:', vnpayData);

            const vnpay = this.getVNPayInstance();
            const isValid = vnpay.verifyIpnCall(vnpayData);

            if (!isValid) {
                console.error('[VNPAY SERVICE] Invalid IPN signature');
                return {
                    isValid: false,
                    message: 'Invalid signature'
                };
            }

            const transaction = {
                orderId: vnpayData.vnp_TxnRef,
                amount: parseFloat(vnpayData.vnp_Amount) / 100,  // Amount from VNPay is in smallest unit, divide by 100
                orderInfo: vnpayData.vnp_OrderInfo,
                responseCode: vnpayData.vnp_ResponseCode,
                transactionNo: vnpayData.vnp_TransactionNo,
                bankCode: vnpayData.vnp_BankCode,
                payDate: vnpayData.vnp_PayDate,
                transactionStatus: vnpayData.vnp_TransactionStatus,
                isSuccess: vnpayData.vnp_ResponseCode === '00'
            };

            console.log('[VNPAY SERVICE] IPN verification successful:', transaction);

            return {
                isValid: true,
                transaction
            };

        } catch (error) {
            console.error('[VNPAY SERVICE] Error verifying IPN:', error);
            return {
                isValid: false,
                message: 'IPN verification failed: ' + error.message
            };
        }
    }

    static verifyReturnUrl(vnpayData) {
        try {
            console.log('[VNPAY SERVICE] Verifying return URL:', vnpayData);

            const vnpay = this.getVNPayInstance();
            
            // Use the library's verifyReturnUrl method which returns a verification object
            const verify = vnpay.verifyReturnUrl(vnpayData);
            
            console.log('[VNPAY SERVICE] VNPay library verification result:', {
                createdAt: new Date(),
                method: 'verifyReturnUrl',
                vnp_Amount: verify.vnp_Amount,
                vnp_BankCode: verify.vnp_BankCode,
                vnp_CardType: verify.vnp_CardType,
                vnp_OrderInfo: verify.vnp_OrderInfo,
                vnp_PayDate: verify.vnp_PayDate,
                vnp_TmnCode: verify.vnp_TmnCode,
                vnp_TransactionNo: verify.vnp_TransactionNo,
                vnp_TransactionStatus: verify.vnp_TransactionStatus,
                vnp_TxnRef: verify.vnp_TxnRef,
                isVerified: verify.isVerified,
                isSuccess: verify.isSuccess,
                message: verify.message,
                vnp_SecureHash: verify.vnp_SecureHash
            });

            const transaction = {
                orderId: verify.vnp_TxnRef || vnpayData.vnp_TxnRef,
                amount: (verify.vnp_Amount || parseFloat(vnpayData.vnp_Amount)) / 100, // Amount from VNPay is in smallest unit, divide by 100
                orderInfo: verify.vnp_OrderInfo || vnpayData.vnp_OrderInfo,
                responseCode: verify.vnp_ResponseCode || vnpayData.vnp_ResponseCode,
                transactionNo: verify.vnp_TransactionNo || vnpayData.vnp_TransactionNo,
                bankCode: verify.vnp_BankCode || vnpayData.vnp_BankCode,
                payDate: verify.vnp_PayDate || vnpayData.vnp_PayDate,
                transactionStatus: verify.vnp_TransactionStatus || vnpayData.vnp_TransactionStatus,
                isSuccess: verify.isVerified && verify.isSuccess
            };

            console.log('[VNPAY SERVICE] Return URL verification successful:', transaction);

            return {
                isValid: verify.isVerified,
                transaction
            };
        } catch (error) {
            console.error('[VNPAY SERVICE] Error verifying return URL:', error);
            return {
                isValid: false,
                message: 'Return URL verification failed: ' + error.message
            };
        }
    }

    static getTransactionStatusMessage(responseCode) {
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
    }

    static formatAmount(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

module.exports = VNPayService;
