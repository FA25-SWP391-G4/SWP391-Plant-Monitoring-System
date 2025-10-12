/**
 * ============================================================================
 * VNPAY SERVICE MOCK - PAYMENT PROCESSING TEST UTILITIES
 * ============================================================================
 */

const querystring = require('qs');
const crypto = require('crypto');

class VNPayService {
    // Mock VNPay configuration
    static config = {
        vnp_TmnCode: 'CGW7KJK7',
        vnp_HashSecret: 'VGTLQQIUPSSO4ERSSAMGVFS5RRSGBEHT',
        vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        vnp_ReturnUrl: 'http://localhost:3000/payment/vnpay-return',
        vnp_IpnUrl: 'http://localhost:3000/payment/vnpay-ipn',
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_CurrCode: 'VND',
        vnp_Locale: 'vn',
        ORDER_TYPES: {
            PREMIUM_UPGRADE: 'premium_upgrade',
            SUBSCRIPTION: 'subscription',
            FEATURE_ACCESS: 'feature_access'
        },
        RESPONSE_CODES: {
            SUCCESS: '00',
            FAIL_CHECKSUM: '97',
            TRANSACTION_NOT_FOUND: '91',
            INVALID_AMOUNT: '04',
            PAYMENT_TIMEOUT: '24'
        }
    };
    
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
     * Generate a random order ID for testing
     */
    static generateOrderId(prefix = 'TEST') {
        const now = new Date();
        const timestamp = 
            now.getFullYear().toString() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2) +
            ('0' + now.getSeconds()).slice(-2);
        
        const random = Math.floor(Math.random() * 900 + 100).toString();
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Validate amount for VNPay payment
     */
    static validateAmount(amount) {
        return amount >= 5000 && amount <= 500000000;
    }

    /**
     * Create payment URL for VNPay
     */
    static createPaymentUrl(paymentData) {
        const { amount, orderId, orderInfo, orderType, ipAddr, bankCode } = paymentData;
        
        // Validate amount
        if (!this.validateAmount(amount)) {
            throw new Error('Invalid payment amount. Must be between 5,000 and 500,000,000 VND');
        }
        
        // Create date objects
        const createDate = new Date();
        const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000); // 15 minutes expiry
        
        // Format dates for VNPay
        const createDateFormat = 
            createDate.getFullYear().toString() +
            ('0' + (createDate.getMonth() + 1)).slice(-2) +
            ('0' + createDate.getDate()).slice(-2) +
            ('0' + createDate.getHours()).slice(-2) +
            ('0' + createDate.getMinutes()).slice(-2) +
            ('0' + createDate.getSeconds()).slice(-2);
            
        // Build VNPay parameters
        const vnpParams = {
            vnp_Version: this.config.vnp_Version,
            vnp_Command: this.config.vnp_Command,
            vnp_TmnCode: this.config.vnp_TmnCode,
            vnp_Locale: this.config.vnp_Locale,
            vnp_CurrCode: this.config.vnp_CurrCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: orderType || 'premium_upgrade',
            vnp_Amount: amount * 100, // Convert to cents
            vnp_ReturnUrl: this.config.vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDateFormat
        };
        
        // Add optional bank code if provided
        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }
        
        // Create signature
        const sortedParams = this.sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        // Add secure hash to params
        vnpParams.vnp_SecureHash = signed;
        
        // Generate the full URL
        const paymentUrl = `${this.config.vnp_Url}?${querystring.stringify(vnpParams, { encode: false })}`;
        
        return {
            paymentUrl,
            orderId,
            amount,
            expireDate
        };
    }

    /**
     * Verify the IPN (Instant Payment Notification) from VNPay
     */
    static verifyIPN(vnpParams) {
        // Extract secure hash from params for verification
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        
        // Re-generate secure hash for comparison
        const sortedParams = this.sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        // Check hash match and response code
        const isValid = secureHash === calculatedHash;
        const isSuccess = vnpParams.vnp_ResponseCode === this.config.RESPONSE_CODES.SUCCESS;
        const amount = parseInt(vnpParams.vnp_Amount, 10) / 100; // Convert back from cents
        
        return {
            isValid,
            isSuccess,
            amount,
            message: this.getResponseMessage(vnpParams.vnp_ResponseCode)
        };
    }

    /**
     * Get response message for VNPay response code
     */
    static getResponseMessage(responseCode) {
        const messages = {
            '00': 'Payment successful',
            '07': 'Suspected fraud transaction',
            '09': 'Transaction is pending bank confirmation',
            '10': 'Customer canceled the payment',
            '11': 'Payment timeout',
            '12': 'Transaction failed due to wallet balance',
            '24': 'Customer canceled the transaction',
            '51': 'Insufficient balance',
            '65': 'User bank account limit exceeded',
            '75': 'Bank is under maintenance',
            '79': 'User canceled OTP authentication',
            '99': 'Unknown error from payment gateway'
        };
        
        return messages[responseCode] || 'Unknown response code';
    }
}

module.exports = VNPayService;