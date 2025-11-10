const VNPayService = require('./services/vnpayService');

console.log('Testing VNPay Service...');

// Test 1: Validate amount
console.log('\n1. Testing amount validation:');
console.log('Valid amount (50000):', VNPayService.validateAmount(50000)); // Should be true
console.log('Invalid amount (1000):', VNPayService.validateAmount(1000)); // Should be false
console.log('Invalid amount (string):', VNPayService.validateAmount("invalid")); // Should be false

// Test 2: Generate Order ID
console.log('\n2. Testing order ID generation:');
console.log('Premium Order ID:', VNPayService.generateOrderId('PREMIUM'));
console.log('Ultimate Order ID:', VNPayService.generateOrderId('ULTIMATE'));

// Test 3: IP Address detection
console.log('\n3. Testing IP address detection:');
const mockReq = {
    ip: '192.168.1.1',
    headers: {
        'x-forwarded-for': '203.0.113.1, 203.0.113.2',
        'x-real-ip': '198.51.100.1'
    }
};
console.log('Detected IP:', VNPayService.getClientIpAddress(mockReq));

// Test 4: Create payment URL (without actual VNPay credentials)
console.log('\n4. Testing payment URL creation:');
try {
    // Set test environment variables if not already set
    process.env.VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || 'DEMO';
    process.env.VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'DEMOSECRET';
    process.env.VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn';
    process.env.VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return';
    
    const testPaymentData = {
        amount: 50000,
        orderId: VNPayService.generateOrderId('PREMIUM'),
        orderInfo: 'Premium subscription upgrade - Test',
        ipAddr: '192.168.1.1',
        bankCode: ''
    };
    
    console.log('Payment data:', testPaymentData);
    
    const paymentUrl = VNPayService.createPaymentUrl(testPaymentData);
    console.log('Generated payment URL:', paymentUrl);
    
    if (paymentUrl && paymentUrl.includes('sandbox.vnpayment.vn')) {
        console.log('✅ Payment URL generation SUCCESS');
    } else {
        console.log('❌ Payment URL generation FAILED');
    }
    
} catch (error) {
    console.error('❌ Payment URL generation error:', error.message);
}

console.log('\n5. Testing format functions:');
console.log('Format amount (50000):', VNPayService.formatAmount(50000));

// Test date formatting
console.log('\n6. Testing date formatting:');
console.log('Current date formatted:', VNPayService.formatCreateDate(new Date()));

console.log('\nVNPay Service test complete!');