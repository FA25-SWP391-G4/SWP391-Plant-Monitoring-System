/**
 * ============================================================================
 * VNPAY SERVICE - PAYMENT PROCESSING UTILITIES
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * - UC19: Upgrade to Premium - Payment URL generation and processing
 * - UC22: Make Payment for Premium - Complete payment workflow
 * 
 * FEATURES:
 * - Payment URL generation with secure hash
 * - IPN (Instant Payment Notification) verification
 * - Transaction status validation
 * - Signature verification for security
 */

const crypto = require('crypto');
const querystring = require('qs');
const dateFormat = require('dateformat').default;
const vnpayConfig = require('../config/vnpay');

class VNPayService {
    
    /**
     * Sort object parameters for VNPay signature generation
     */
    static sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }

    /**
     * Generate VNPay payment URL
     * 
     * SUPPORTS:
     * - UC19: Upgrade to Premium - Generate payment URL for subscription
     * - UC22: Make Payment for Premium - Create secure payment link
     */
    static createPaymentUrl(paymentData) {
        const {
            amount,
            orderId,
            orderInfo,
            orderType = vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE,
            bankCode = '',
            locale = vnpayConfig.vnp_Locale,
            ipAddr
        } = paymentData;

        // Validate required fields
        if (!amount || !orderId || !orderInfo || !ipAddr) {
            throw new Error('Missing required payment data: amount, orderId, orderInfo, ipAddr');
        }

        // Generate timestamps
        const date = new Date();
        const createDate = dateFormat(date, 'yyyymmddHHmmss');
        const expireDate = dateFormat(new Date(date.getTime() + 15 * 60 * 1000), 'yyyymmddHHmmss'); // 15 minutes

        // Build VNPay parameters
        let vnp_Params = {
            vnp_Version: vnpayConfig.vnp_Version,
            vnp_Command: vnpayConfig.vnp_Command,
            vnp_TmnCode: vnpayConfig.vnp_TmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: vnpayConfig.vnp_CurrCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: orderType,
            vnp_Amount: amount * 100, // VNPay requires amount in cents
            vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate
        };

        // Add bank code if specified
        if (bankCode) {
            vnp_Params.vnp_BankCode = bankCode;
        }

        // Sort parameters and generate signature
        vnp_Params = this.sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        vnp_Params.vnp_SecureHash = signed;
        
        // Build final payment URL
        const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
        
        return {
            paymentUrl,
            orderId,
            amount,
            createDate,
            expireDate
        };
    }

    /**
     * Verify VNPay IPN (Instant Payment Notification)
     * 
     * SUPPORTS:
     * - UC19: Upgrade to Premium - Verify payment completion
     * - UC22: Make Payment for Premium - Process payment callback
     */
    static verifyIPN(vnpParams) {
        const secureHash = vnpParams.vnp_SecureHash;
        
        // Remove hash fields for verification
        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;
        
        // Sort parameters and verify signature
        const sortedParams = this.sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        const isValidSignature = secureHash === signed;
        const orderId = vnpParams.vnp_TxnRef;
        const responseCode = vnpParams.vnp_ResponseCode;
        const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert back from cents
        const transactionNo = vnpParams.vnp_TransactionNo;
        const bankCode = vnpParams.vnp_BankCode;
        const payDate = vnpParams.vnp_PayDate;
        
        return {
            isValid: isValidSignature,
            orderId,
            responseCode,
            amount,
            transactionNo,
            bankCode,
            payDate,
            isSuccess: responseCode === vnpayConfig.RESPONSE_CODES.SUCCESS,
            message: this.getResponseMessage(responseCode)
        };
    }

    /**
     * Verify return URL from VNPay
     */
    static verifyReturnUrl(vnpParams) {
        return this.verifyIPN(vnpParams); // Same verification logic
    }

    /**
     * Get response message based on VNPay response code
     */
    static getResponseMessage(responseCode) {
        const messages = {
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
            '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
        };
        
        return messages[responseCode] || 'Lỗi không xác định';
    }

    /**
     * Generate unique order ID
     */
    static generateOrderId(prefix = 'ORDER') {
        const timestamp = dateFormat(new Date(), 'yyyymmddHHmmss');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Validate payment amount
     */
    static validateAmount(amount) {
        if (!amount || isNaN(amount) || amount <= 0) {
            return false;
        }
        
        // VNPay minimum amount is 5,000 VND
        if (amount < 5000) {
            return false;
        }
        
        // VNPay maximum amount is 500,000,000 VND
        if (amount > 500000000) {
            return false;
        }
        
        return true;
    }

    /**
     * Get client IP address
     */
    static getClientIpAddress(req) {
        return req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }
}

module.exports = VNPayService;
