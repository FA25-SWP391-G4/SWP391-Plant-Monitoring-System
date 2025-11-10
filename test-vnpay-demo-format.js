const VNPayService = require('./services/vnpayService');

console.log('Testing VNPay Service with Demo Format...\n');

// Set demo environment variables to avoid real credentials
process.env.VNPAY_TMN_CODE = 'DEMO123';
process.env.VNPAY_HASH_SECRET = 'DEMOSECRET123';
process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payment/vnpay-return';

// Test IP processing
console.log('1. Testing IP Address Processing:');
const testIPs = [
    { input: '::1', expected: '127.0.0.1' },
    { input: '::ffff:127.0.0.1', expected: '127.0.0.1' },
    { input: '192.168.1.1', expected: '192.168.1.1' },
    { input: '::ffff:192.168.1.1', expected: '192.168.1.1' }
];

testIPs.forEach(test => {
    const mockReq = { ip: test.input };
    const result = VNPayService.getClientIpAddress(mockReq);
    console.log(`  ${test.input} -> ${result} (Expected: ${test.expected}) ${result === test.expected ? '✅' : '❌'}`);
});

// Test payment URL generation (format check only)
console.log('\n2. Testing Payment URL Format:');
try {
    const testPaymentData = {
        amount: 50000,
        orderId: 'ORDER_123456789_TEST',
        orderInfo: 'Test payment - Demo format check',
        ipAddr: '127.0.0.1'
        // No bankCode - following demo pattern
    };
    
    console.log('Payment data:', testPaymentData);
    
    const paymentUrl = VNPayService.createPaymentUrl(testPaymentData);
    console.log('Generated URL:', paymentUrl);
    
    // Check URL format
    const url = new URL(paymentUrl);
    const params = url.searchParams;
    
    console.log('\n3. URL Parameter Analysis:');
    console.log('  vnp_Amount:', params.get('vnp_Amount'));
    console.log('  vnp_Command:', params.get('vnp_Command'));
    console.log('  vnp_CurrCode:', params.get('vnp_CurrCode'));
    console.log('  vnp_IpAddr:', params.get('vnp_IpAddr'));
    console.log('  vnp_Locale:', params.get('vnp_Locale'));
    console.log('  vnp_OrderType:', params.get('vnp_OrderType'));
    console.log('  vnp_Version:', params.get('vnp_Version'));
    console.log('  vnp_BankCode:', params.get('vnp_BankCode') || 'NOT INCLUDED ✅');
    
    // Verify key format matches demo
    const checks = [
        { name: 'vnp_Locale is "vn"', pass: params.get('vnp_Locale') === 'vn' },
        { name: 'vnp_OrderType is "other"', pass: params.get('vnp_OrderType') === 'other' },
        { name: 'vnp_Command is "pay"', pass: params.get('vnp_Command') === 'pay' },
        { name: 'vnp_CurrCode is "VND"', pass: params.get('vnp_CurrCode') === 'VND' },
        { name: 'vnp_Version is "2.1.0"', pass: params.get('vnp_Version') === '2.1.0' },
        { name: 'vnp_BankCode not included', pass: !params.has('vnp_BankCode') },
        { name: 'IP is IPv4 format', pass: params.get('vnp_IpAddr') === '127.0.0.1' }
    ];
    
    console.log('\n4. Format Verification:');
    checks.forEach(check => {
        console.log(`  ${check.name}: ${check.pass ? '✅' : '❌'}`);
    });
    
    const allPassed = checks.every(check => check.pass);
    console.log(`\nOverall format check: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
} catch (error) {
    console.error('❌ Payment URL generation error:', error.message);
}

console.log('\n5. Date Format Test:');
console.log('  Formatted date:', VNPayService.formatCreateDate(new Date()));

console.log('\nDemo format compatibility test complete!');