/**
 * ============================================================================
 * VNPAY INTEGRATION TEST SCRIPT
 * ============================================================================
 * 
 * This script tests the VNPay integration components:
 * - Configuration validation
 * - Payment URL generation
 * - Signature verification
 * - Payment processing workflow
 * 
 * Run with: node tests/vnpay-test.js
 */

const VNPayService = require('../services/vnpayService');
const vnpayConfig = require('../config/vnpay');
const Payment = require('../models/Payment');

console.log('🚀 VNPay Integration Test Starting...\n');

// Test 1: Configuration Validation
console.log('📋 Test 1: Configuration Validation');
console.log('✓ Terminal ID (vnp_TmnCode):', vnpayConfig.vnp_TmnCode);
console.log('✓ Hash Secret Length:', vnpayConfig.vnp_HashSecret?.length || 0, 'characters');
console.log('✓ Payment URL:', vnpayConfig.vnp_Url);
console.log('✓ Return URL:', vnpayConfig.vnp_ReturnUrl);
console.log('✓ IPN URL:', vnpayConfig.vnp_IpnUrl);
console.log();

// Test 2: Order ID Generation
console.log('📋 Test 2: Order ID Generation');
const testOrderId = VNPayService.generateOrderId('TEST');
console.log('✓ Generated Order ID:', testOrderId);
console.log('✓ Order ID Format Valid:', /^TEST\d{14}\d{3}$/.test(testOrderId));
console.log();

// Test 3: Amount Validation
console.log('📋 Test 3: Amount Validation');
const testAmounts = [0, 4999, 5000, 299000, 500000000, 500000001];
testAmounts.forEach(amount => {
    const isValid = VNPayService.validateAmount(amount);
    console.log(`${isValid ? '✓' : '✗'} Amount ${amount.toLocaleString()} VND: ${isValid ? 'Valid' : 'Invalid'}`);
});
console.log();

// Test 4: Payment URL Generation
console.log('📋 Test 4: Payment URL Generation');
try {
    const paymentData = {
        amount: 299000,
        orderId: testOrderId,
        orderInfo: 'Test Premium Upgrade Payment',
        orderType: vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE,
        ipAddr: '127.0.0.1'
    };
    
    const result = VNPayService.createPaymentUrl(paymentData);
    console.log('✓ Payment URL Generated Successfully');
    console.log('✓ URL Length:', result.paymentUrl.length, 'characters');
    console.log('✓ Contains vnp_SecureHash:', result.paymentUrl.includes('vnp_SecureHash='));
    console.log('✓ Expiration Time:', result.expireDate);
    
    // Display URL for manual testing (truncated for readability)
    const truncatedUrl = result.paymentUrl.substring(0, 100) + '...';
    console.log('✓ Sample URL:', truncatedUrl);
    
} catch (error) {
    console.log('✗ Payment URL Generation Failed:', error.message);
}
console.log();

// Test 5: Response Message Mapping
console.log('📋 Test 5: Response Message Mapping');
const testResponseCodes = ['00', '07', '24', '51', '99'];
testResponseCodes.forEach(code => {
    const message = VNPayService.getResponseMessage(code);
    console.log(`✓ Code ${code}: ${message}`);
});
console.log();

// Test 6: Mock IPN Verification
console.log('📋 Test 6: Mock IPN Verification');
try {
    // Create a mock VNPay IPN response for testing
    const mockVnpParams = {
        vnp_Amount: '29900000', // 299,000 VND in cents
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Test Premium Upgrade Payment',
        vnp_ResponseCode: '00',
        vnp_TxnRef: testOrderId,
        vnp_TransactionNo: '14226112',
        vnp_PayDate: '20241225170112'
    };
    
    // Generate a valid signature for testing
    const crypto = require('crypto');
    const querystring = require('qs');
    
    const sortedParams = VNPayService.sortObject(mockVnpParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    mockVnpParams.vnp_SecureHash = signed;
    
    const verificationResult = VNPayService.verifyIPN(mockVnpParams);
    console.log('✓ IPN Verification Result:', verificationResult.isValid ? 'Valid' : 'Invalid');
    console.log('✓ Transaction Success:', verificationResult.isSuccess ? 'Yes' : 'No');
    console.log('✓ Amount:', verificationResult.amount.toLocaleString(), 'VND');
    console.log('✓ Message:', verificationResult.message);
    
} catch (error) {
    console.log('✗ IPN Verification Failed:', error.message);
}
console.log();

console.log('🎉 VNPay Integration Test Completed!');
console.log('');
console.log('💡 To test the complete payment flow:');
console.log('1. Start the server: npm start');
console.log('2. POST to /payment/create with test data');
console.log('3. Use the returned paymentUrl in a browser');
console.log('4. Complete payment in VNPay sandbox');
console.log('5. Check /payment/vnpay-return endpoint');
console.log('');
console.log('🔗 VNPay Sandbox Test Cards:');
console.log('- Visa: 9704 0000 0000 0018, Date: any future date, CVV: 123');
console.log('- MasterCard: 9704 0000 0000 0026, Date: any future date, CVV: 123');
console.log('- ATM: 9704 0000 0000 0034, Password: 123456');
console.log('');
console.log('📚 API Documentation:');
console.log('- POST /payment/create - Create payment URL');
console.log('- GET /payment/vnpay-return - Handle payment return');
console.log('- GET /payment/vnpay-ipn - Handle payment notification');
console.log('- GET /payment/status/:orderId - Check payment status');
console.log('- GET /payment/history - User payment history');
console.log('');
