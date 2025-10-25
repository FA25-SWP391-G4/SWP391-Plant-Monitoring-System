/**
 * ============================================================================
 * VNPAY PAYMENT SERVICE
 * =============================        // Create signature string using qs instead of querystring
        const signData = qs.stringify(sortedParams, { encode: false });
        console.log('IPN verification sign data:', signData);
        
        // Create secure hash
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('Received hash:', secureHash);
        console.log('Calculated hash:', calculatedHash);=========================================
 * 
 * This service provides integration with VNPay payment gateway:
 * - Creates payment URLs for redirection to VNPay
 * - Verifies IPN (Instant Payment Notification) from VNPay
 * - Verifies payment return URLs
 * - Provides utility methods for VNPay integration
 * 
 * SUPPORTS THESE USE CASES:
 * - UC19: Upgrade to Premium - Payment URL generation and processing
 * - UC22: Make Payment for Premium - Complete payment workflow
 */

const crypto = require('crypto');
const moment = require('moment');
require('moment-timezone');
const vnpayConfig = require('../config/vnpay');
const url = require('url');
// Using qs instead of querystring for better compatibility with VNPay requirements
let qs;
try {
    qs = require('qs');
    console.log('Successfully loaded qs module');
} catch (error) {
    console.error('Error loading qs module, falling back to querystring', error);
    qs = require('querystring');
}

class VNPayService {
    /**
     * Sort object by key for consistent hash generation
     */
    static sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        
        for (const key of keys) {
            if (obj[key] !== null && obj[key] !== undefined) {
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
                    sorted[key] = this.sortObject(obj[key]);
                } else {
                    sorted[key] = obj[key];
                }
            }
        }
        
        return sorted;
    }
    
    /**
     * Create payment URL for VNPay redirect
     */
    static createPaymentUrl({
        amount,
        orderId,
        orderInfo,
        orderType = vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE,
        bankCode = '',
        ipAddr = '127.0.0.1',
        returnUrl = vnpayConfig.vnp_ReturnUrl,
        locale = vnpayConfig.vnp_Locale
    }) {
        console.log('[VNPAY] Creating payment URL with params:', {
            amount,
            orderId,
            orderInfo: orderInfo?.substring(0, 30) + '...',
            orderType,
            bankCode: bankCode || 'Not provided',
            ipAddr,
            returnUrl,
            locale
        });
        
        // Validate required parameters
        if (!amount || !orderId || !orderInfo) {
            throw new Error('Missing required parameters for payment URL creation');
        }
        
        // Validate amount
        if (!this.validateAmount(amount)) {
            throw new Error('Invalid payment amount');
        }
        
        // Get current time in Vietnam timezone
        const createDate = moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
        const expireDate = moment().tz('Asia/Ho_Chi_Minh').add(15, 'minutes').format('YYYYMMDDHHmmss');
        
        // Create VNPay parameters
        let vnp_Params = {
            vnp_Version: vnpayConfig.vnp_Version,
            vnp_Command: vnpayConfig.vnp_Command,
            vnp_TmnCode: vnpayConfig.vnp_TmnCode,
            vnp_Amount: Math.round(amount) * 100, // Convert to smallest currency unit (e.g. cents)
            vnp_CreateDate: createDate,
            vnp_CurrCode: vnpayConfig.vnp_CurrCode,
            vnp_IpAddr: ipAddr,
            vnp_Locale: locale,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: orderType,
            vnp_ReturnUrl: returnUrl,
            vnp_TxnRef: orderId,
            vnp_ExpireDate: expireDate
        };
        
        // Add bank code if provided
        if (bankCode && bankCode !== '') {
            vnp_Params.vnp_BankCode = bankCode;
        }
        
        // Sort the parameters and create the signed query string
        vnp_Params = this.sortObject(vnp_Params);
        
        // Use qs module instead of querystring for better compatibility with VNPay
        const signData = qs.stringify(vnp_Params, { encode: false });
        console.log('Sign data:', signData);
        
        // Create secure hash
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('Secure hash:', secureHash);
        
        // Add secure hash to params
        vnp_Params.vnp_SecureHash = secureHash;
        
        // Build the complete payment URL - IMPORTANT: Don't encode the parameters in the final URL
        // Using qs.stringify with encode: false ensures spaces are not encoded as %20
        const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
        console.log('Payment URL created (first 100 chars):', paymentUrl.substring(0, 100) + '...');
        
        return {
            paymentUrl,
            orderId,
            amount,
            expireDate,
            createDate,
            vnp_Params
        };
    }
    
    /**
     * Verify Instant Payment Notification from VNPay
     */
    static verifyIPN(vnpParams) {
        // Extract the secure hash from the params
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        if (vnpParams.vnp_SecureHashType) {
            delete vnpParams.vnp_SecureHashType;
        }
        
        // Sort the parameters exactly as in the demo
        vnpParams = this.sortObject(vnpParams);
        
        // Create signature string
        const signData = querystring.stringify(vnpParams, { encode: false });
        
        // Create secure hash
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        // Check if the calculated hash matches the secure hash from VNPay
        const isValidSignature = secureHash === calculatedHash;
        
        // Extract payment information
        const orderId = vnpParams.vnp_TxnRef;
        const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert back to VND
        const responseCode = vnpParams.vnp_ResponseCode;
        const transactionNo = vnpParams.vnp_TransactionNo;
        const bankCode = vnpParams.vnp_BankCode;
        const payDate = vnpParams.vnp_PayDate;
        
        // Return verification result and payment details
        return {
            isValid: isValidSignature,
            orderId,
            amount,
            responseCode,
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
        const date = new Date();
        const timestamp = moment(date).format('YYYYMMDDHHmmss');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }
    
    /**
     * Get client IP address from request
     */
    static getClientIpAddress(req) {
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket?.remoteAddress ||
            '127.0.0.1';
            
        return ipAddr;
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
    
    /**
     * Parse VNPay query parameters from return URL or IPN
     */
    static parseVNPayParams(req) {
        let vnpParams = {};
        
        // Handle GET request (return URL)
        if (req.method === 'GET') {
            const parsedUrl = url.parse(req.url, true);
            vnpParams = { ...parsedUrl.query };
        } 
        // Handle POST request (IPN)
        else if (req.method === 'POST') {
            vnpParams = { ...req.body };
        }
        
        return vnpParams;
    }
}

module.exports = VNPayService;
