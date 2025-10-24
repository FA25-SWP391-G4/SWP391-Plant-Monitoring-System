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
     * This is the official VNPay implementation for sorting and encoding parameters
     */
    static sortObject(obj) {
        // Create an array of the object's keys
        const keys = Object.keys(obj);
        
        // Sort the keys alphabetically
        keys.sort();
        
        // Create a new sorted object
        const sorted = {};
        
        // Add each key-value pair to the new object in sorted order
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            // Ensure we're using the non-URL-encoded key name for accessing the original object
            // But use URL encoding for the values as required by VNPay
            if (obj[key] !== undefined && obj[key] !== null) {
                const encodedValue = encodeURIComponent(obj[key]).replace(/%20/g, "+");
                sorted[key] = encodedValue;
                console.log(`[VNPAY] Sorted param: ${key}=${encodedValue}`);
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
        
        // Add bank code (payment method) if provided
        if(bankCode !== null && bankCode !== ''){
            vnp_Params['vnp_BankCode'] = bankCode;
            console.log('[VNPAY] Adding bank code:', bankCode);
        }
        // Get the real public IP address instead of using localhost
        if (ipAddr === '127.0.0.1' || ipAddr === 'localhost' || ipAddr === '::1') {
            console.log('[VNPAY] Warning: Using localhost IP address. Consider using real IP for production.');
            // In production, you should use a service to get the real public IP
        }
        
        console.log('[VNPAY] Parameters before sorting:', JSON.stringify(vnp_Params));
        
        // Sort the parameters using VNPay's specific sorting algorithm
        vnp_Params = this.sortObject(vnp_Params);
        
        console.log('[VNPAY] Parameters after sorting:', JSON.stringify(vnp_Params));
        
        // Create the signed query string (using qs with encode=true as required by VNPay)
        const signData = qs.stringify(vnp_Params, { encode: false });
        console.log('[VNPAY] Sign data:', signData);
        
        // Create secure hash using SHA512 as required by VNPay 2.1.0
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('[VNPAY] Secure hash:', secureHash);
        
        // Add secure hash to original params (not the encoded ones)
        vnp_Params.vnp_SecureHash = secureHash;
        
        // Build the complete payment URL with proper encoding for VNPay
        const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
        console.log('[VNPAY] Payment URL created (first 100 chars):', paymentUrl.substring(0, 100) + '...');
        
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
        console.log('[VNPAY] Verifying IPN with params:', vnpParams);
        
        // Extract the secure hash from the params
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        if (vnpParams.vnp_SecureHashType) {
            delete vnpParams.vnp_SecureHashType;
        }
        
        // Sort the parameters using VNPay's required algorithm
        const sortedParams = this.sortObject(vnpParams);
        
        // Create signature string using qs (not querystring) with encode: true
        const signData = qs.stringify(sortedParams, { encode: true });
        console.log('[VNPAY] IPN verification sign data:', signData);
        
        // Create secure hash with SHA512 as required by VNPay 2.1.0
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        console.log('[VNPAY] Received hash:', secureHash);
        console.log('[VNPAY] Calculated hash:', calculatedHash);
        
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
     * This method extracts the real client IP address, considering proxy headers
     */
    static getClientIpAddress(req) {
        // Check for forwarded IP from proxy
        let ipAddr = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     req.connection.socket?.remoteAddress ||
                     '127.0.0.1';
        
        // Handle x-forwarded-for potentially having multiple IPs (client, proxy1, proxy2)
        if (ipAddr && ipAddr.includes(',')) {
            // The first IP is the client's real IP
            ipAddr = ipAddr.split(',')[0].trim();
        }
        
        // Remove IPv6 prefix if present
        if (ipAddr && ipAddr.startsWith('::ffff:')) {
            ipAddr = ipAddr.substring(7);
        }
        
        console.log('[VNPAY] Client IP address:', ipAddr);
            
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
    
    // The getClientIpAddress method is now implemented above
    
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
