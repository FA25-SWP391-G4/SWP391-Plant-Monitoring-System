// VNPay Service - Community Library Implementation
// Following documentation from https://vnpay.js.org/

const { VNPay, HashAlgorithm, VnpLocale, ProductCode} = require('vnpay');

class VNPayService {
    static getVNPayInstance() {
        if (!this.vnpayInstance) {
            this.vnpayInstance = new VNPay({
                tmnCode: process.env.VNPAY_TMN_CODE,
                secureSecret: process.env.VNPAY_HASH_SECRET,
                vnpayHost: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn',
                testMode: process.env.NODE_ENV !== 'production',
                hashAlgorithm: HashAlgorithm.SHA512,
            });

            console.log('[VNPAY SERVICE] Initialized with:', {
                tmnCode: process.env.VNPAY_TMN_CODE,
                vnpayHost: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn',
                testMode: process.env.NODE_ENV !== 'production'
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
        
        return req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers?.['x-real-ip'] ||
               '127.0.0.1';
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

            const paymentParams = {
                vnp_Amount: Math.round(amount),
                vnp_Command: 'pay',
                vnp_CreateDate: new Date(),
                vnp_IpAddr: ipAddr,
                vnp_Locale: VnpLocale.VN,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
                vnp_TxnRef: orderId,
                vnp_Version: '2.1.0'
            };

            if (bankCode && bankCode.trim() !== '') {
                paymentParams.vnp_BankCode = bankCode;
                console.log('[VNPAY SERVICE] Using specific bank code:', bankCode);
            } else {
                console.log('[VNPAY SERVICE] No bank code - showing all payment methods');
            }

            const paymentUrl = vnpay.buildPaymentUrl(paymentParams);

            console.log(paymentUrl);

            console.log('[VNPAY SERVICE] Payment URL created successfully');
            return paymentUrl;

        } catch (error) {
            console.error('[VNPAY SERVICE] Error creating payment URL:', error);
            throw new Error('Failed to create payment URL: ' + error.message);
        }
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
                amount: parseFloat(vnpayData.vnp_Amount) / 100,
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
            const isValid = vnpay.verifyReturnUrl(vnpayData);

            if (!isValid) {
                console.error('[VNPAY SERVICE] Invalid return URL signature');
                return {
                    isValid: false,
                    message: 'Invalid signature'
                };
            }

            const transaction = {
                orderId: vnpayData.vnp_TxnRef,
                amount: parseFloat(vnpayData.vnp_Amount) / 100,
                orderInfo: vnpayData.vnp_OrderInfo,
                responseCode: vnpayData.vnp_ResponseCode,
                transactionNo: vnpayData.vnp_TransactionNo,
                bankCode: vnpayData.vnp_BankCode,
                payDate: vnpayData.vnp_PayDate,
                transactionStatus: vnpayData.vnp_TransactionStatus,
                isSuccess: vnpayData.vnp_ResponseCode === '00'
            };

            console.log('[VNPAY SERVICE] Return URL verification successful:', transaction);

            return {
                isValid: true,
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
