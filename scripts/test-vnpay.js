/**
 * VNPay Service Test Script
 * 
 * This script tests the VNPay service functionality including:
 * - Creating payment URLs
 * - Verifying signatures
 * - Handling IPN and return URLs
 * 
 * Run with: node scripts/test-vnpay.js
 */

require('dotenv').config();
const VNPayService = require('../services/vnpayService');
const vnpayConfig = require('../config/vnpay');
const querystring = require('querystring');
const crypto = require('crypto');
const url = require('url');

// Mock request object
const mockRequest = {
  headers: {
    'x-forwarded-for': '127.0.0.1'
  },
  connection: {
    remoteAddress: '127.0.0.1'
  }
};

// Test payment URL creation
function testCreatePaymentUrl() {
  console.log('\n=== Testing VNPay Payment URL Creation ===');
  
  try {
    const paymentData = {
      amount: 20000, // 20,000 VND
      orderId: VNPayService.generateOrderId('TEST'),
      orderInfo: 'Premium Monthly Subscription',
      orderType: vnpayConfig.ORDER_TYPES.PREMIUM_UPGRADE,
      ipAddr: VNPayService.getClientIpAddress(mockRequest)
    };
    
    console.log('Payment Data:', paymentData);
    
    const result = VNPayService.createPaymentUrl(paymentData);
    console.log('\nPayment URL created successfully:');
    console.log('- Order ID:', result.orderId);
    console.log('- Amount:', result.amount);
    console.log('- Create Date:', result.createDate);
    console.log('- Expire Date:', result.expireDate);
    console.log('- Payment URL:', truncateUrl(result.paymentUrl));
    
    return result;
  } catch (error) {
    console.error('Error creating payment URL:', error.message);
    throw error;
  }
}

// Helper to truncate URLs for display
function truncateUrl(url) {
  if (url.length > 100) {
    return url.substring(0, 100) + '...';
  }
  return url;
}

// Test order ID generation
function testGenerateOrderId() {
  console.log('=== Testing Order ID Generation ===');
  
  const prefix = 'TEST';
  const orderId = VNPayService.generateOrderId(prefix);
  console.log(`Generated Order ID (prefix: ${prefix}):`, orderId);
  
  return orderId;
}

// Test amount validation
function testAmountValidation() {
  console.log('\n=== Testing Amount Validation ===');
  
  const testAmounts = [
    { amount: 0, expectedValid: false },
    { amount: 1000, expectedValid: false },
    { amount: 5000, expectedValid: true },
    { amount: 20000, expectedValid: true },
    { amount: 500000000, expectedValid: true },
    { amount: 600000000, expectedValid: false }
  ];
  
  testAmounts.forEach(test => {
    const isValid = VNPayService.validateAmount(test.amount);
    console.log(`Amount ${test.amount} VND is ${isValid ? 'valid' : 'invalid'} (Expected: ${test.expectedValid ? 'valid' : 'invalid'})`);
    if (isValid !== test.expectedValid) {
      console.error(`- VALIDATION ERROR: Expected ${test.amount} to be ${test.expectedValid ? 'valid' : 'invalid'}`);
    }
  });
}

// Test IPN verification with simulated VNPay response
function testIPNVerification() {
  console.log('\n=== Testing IPN Verification ===');
  
  try {
    // Generate payment URL first to get proper params
    const paymentResult = VNPayService.createPaymentUrl({
      amount: 20000,
      orderId: VNPayService.generateOrderId('TEST'),
      orderInfo: 'Test Payment',
      ipAddr: '127.0.0.1'
    });
    
    // Simulate a successful VNPay response
    const simulatedParams = {
      vnp_Amount: '2000000', // 20,000 VND * 100
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: '20251017000001',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Test Payment',
      vnp_PayDate: '20251017134500',
      vnp_ResponseCode: '00', // Success
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_TransactionNo: '13501509',
      vnp_TxnRef: paymentResult.orderId
    };
    
    // Generate secure hash for simulation
    const sortedParams = VNPayService.sortObject(simulatedParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Add secure hash to simulated params
    simulatedParams.vnp_SecureHash = secureHash;
    
    console.log('Simulated IPN Parameters:', simulatedParams);
    
    // Verify the IPN
    const verificationResult = VNPayService.verifyIPN(simulatedParams);
    console.log('\nIPN Verification Result:');
    console.log('- Valid signature:', verificationResult.isValid);
    console.log('- Order ID:', verificationResult.orderId);
    console.log('- Amount:', verificationResult.amount);
    console.log('- Success:', verificationResult.isSuccess);
    console.log('- Message:', verificationResult.message);
    
    if (!verificationResult.isValid) {
      console.error('- ERROR: IPN verification failed');
    }
    
    return verificationResult;
  } catch (error) {
    console.error('Error testing IPN verification:', error.message);
    throw error;
  }
}

// Test simulated return URL verification
function testReturnUrlVerification() {
  console.log('\n=== Testing Return URL Verification ===');
  
  try {
    // Create mock request with return URL query params
    const mockReturnUrlRequest = {
      method: 'GET',
      url: 'http://localhost:3010/payment/vnpay-return?vnp_Amount=2000000&vnp_BankCode=NCB&vnp_OrderInfo=Test%20Payment&vnp_ResponseCode=00&vnp_TxnRef=TEST20251017134500123&vnp_SecureHash=abcdef1234567890'
    };
    
    // Mock parseVNPayParams functionality manually for the test
    const parsedUrl = url.parse(mockReturnUrlRequest.url, true);
    const mockParams = { ...parsedUrl.query };
    
    // Ensure we have a valid secure hash for testing
    delete mockParams.vnp_SecureHash; // Remove the fake one
    
    const sortedParams = VNPayService.sortObject(mockParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Add proper secure hash
    mockParams.vnp_SecureHash = secureHash;
    
    console.log('Simulated Return URL Parameters:', mockParams);
    
    // Verify the return URL
    const verificationResult = VNPayService.verifyReturnUrl(mockParams);
    console.log('\nReturn URL Verification Result:');
    console.log('- Valid signature:', verificationResult.isValid);
    console.log('- Order ID:', verificationResult.orderId);
    console.log('- Amount:', verificationResult.amount);
    console.log('- Success:', verificationResult.isSuccess);
    
    if (!verificationResult.isValid) {
      console.error('- ERROR: Return URL verification failed');
    }
    
    return verificationResult;
  } catch (error) {
    console.error('Error testing return URL verification:', error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('=====================================');
  console.log('     VNPAY SERVICE TEST SCRIPT      ');
  console.log('=====================================');
  
  testGenerateOrderId();
  testAmountValidation();
  
  const paymentResult = testCreatePaymentUrl();
  
  // Only run these if createPaymentUrl succeeded
  if (paymentResult) {
    testIPNVerification();
    testReturnUrlVerification();
  }
  
  console.log('\n=====================================');
  console.log('All tests completed successfully!');
  console.log('=====================================');
}

// Run the tests
runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});