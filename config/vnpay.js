/**
 * ============================================================================
 * VNPAY CONFIGURATION - PAYMENT GATEWAY INTEGRATION
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * - UC19: Upgrade to Premium - Premium subscription payment processing
 * - UC22: Make Payment for Premium - Payment gateway integration
 * 
 * VNPAY ENVIRONMENT: TEST/SANDBOX
 * - Terminal ID: CGW7KJK7
 * - Secret Key: VGTLQQIUPSSO4ERSSAMGVFS5RRSGBEHT
 * - Payment URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 * 
 * SECURITY FEATURES:
 * - HMAC-SHA512 signature for request/response validation
 * - Secure hash verification for IPN (Instant Payment Notification)
 * - Amount validation and transaction reference tracking
 */

const config = {
    // VNPay Environment Credentials from environment variables
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
    vnp_Url: process.env.VNPAY_URL,
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_IpnUrl: process.env.VNPAY_IPN_URL,
    
    // Payment Configuration
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    
    // Order Types
    ORDER_TYPES: {
        PREMIUM_UPGRADE: 'premium_upgrade',
        SUBSCRIPTION: 'subscription',
        FEATURE_ACCESS: 'feature_access'
    },
    
    // Response Codes
    RESPONSE_CODES: {
        SUCCESS: '00',
        FAIL_CHECKSUM: '97',
        TRANSACTION_NOT_FOUND: '91',
        INVALID_AMOUNT: '04',
        PAYMENT_TIMEOUT: '24'
    }
};

module.exports = config;
