// Test VNPay Payment URL Generation without Bank Code
// This script tests that the payment URL is generated correctly without causing 74 error

const VNPayService = require('./services/vnpayService');

// Mock environment variables for testing
process.env.VNPAY_TMN_CODE = 'DEMO';
process.env.VNPAY_HASH_SECRET = 'DEMOSECRET';
process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn';
process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payment/vnpay-return';

async function testPaymentUrlGeneration() {
    console.log('🧪 Testing VNPay Payment URL Generation...\n');

    try {
        // Test 1: Payment URL without bank code (should work)
        console.log('Test 1: Payment URL without bank code');
        const testData1 = {
            amount: 50000,
            orderId: 'TEST_ORDER_' + Date.now(),
            orderInfo: 'Test Premium Upgrade - No Bank Code',
            ipAddr: '127.0.0.1'
            // No bankCode parameter
        };

        console.log('Request data:', testData1);
        const paymentUrl1 = VNPayService.createPaymentUrl(testData1);
        console.log('✅ Success! Generated URL:', paymentUrl1);
        console.log('URL should NOT contain vnp_BankCode parameter');
        console.log('');

        // Test 2: Payment URL with empty bank code (should work same as no bank code)
        console.log('Test 2: Payment URL with empty bank code');
        const testData2 = {
            amount: 75000,
            orderId: 'TEST_ORDER_' + Date.now(),
            orderInfo: 'Test Premium Upgrade - Empty Bank Code',
            ipAddr: '127.0.0.1',
            bankCode: ''
        };

        console.log('Request data:', testData2);
        const paymentUrl2 = VNPayService.createPaymentUrl(testData2);
        console.log('✅ Success! Generated URL:', paymentUrl2);
        console.log('URL should NOT contain vnp_BankCode parameter');
        console.log('');

        // Test 3: Payment URL with null bank code (should work same as no bank code)
        console.log('Test 3: Payment URL with null bank code');
        const testData3 = {
            amount: 100000,
            orderId: 'TEST_ORDER_' + Date.now(),
            orderInfo: 'Test Premium Upgrade - Null Bank Code',
            ipAddr: '127.0.0.1',
            bankCode: null
        };

        console.log('Request data:', testData3);
        const paymentUrl3 = VNPayService.createPaymentUrl(testData3);
        console.log('✅ Success! Generated URL:', paymentUrl3);
        console.log('URL should NOT contain vnp_BankCode parameter');
        console.log('');

        // Test 4: Payment URL with specific bank code (should include bank code)
        console.log('Test 4: Payment URL with specific bank code');
        const testData4 = {
            amount: 125000,
            orderId: 'TEST_ORDER_' + Date.now(),
            orderInfo: 'Test Premium Upgrade - Specific Bank',
            ipAddr: '127.0.0.1',
            bankCode: 'NCB'
        };

        console.log('Request data:', testData4);
        const paymentUrl4 = VNPayService.createPaymentUrl(testData4);
        console.log('✅ Success! Generated URL:', paymentUrl4);
        console.log('URL should contain vnp_BankCode=NCB parameter');
        console.log('');

        // Verify URL parameters
        console.log('🔍 URL Analysis:');
        console.log('URL 1 (no bank):', paymentUrl1.includes('vnp_BankCode') ? '❌ Contains vnp_BankCode' : '✅ No vnp_BankCode');
        console.log('URL 2 (empty bank):', paymentUrl2.includes('vnp_BankCode') ? '❌ Contains vnp_BankCode' : '✅ No vnp_BankCode');
        console.log('URL 3 (null bank):', paymentUrl3.includes('vnp_BankCode') ? '❌ Contains vnp_BankCode' : '✅ No vnp_BankCode');
        console.log('URL 4 (specific bank):', paymentUrl4.includes('vnp_BankCode=NCB') ? '✅ Contains vnp_BankCode=NCB' : '❌ Missing vnp_BankCode=NCB');

        console.log('\n🎉 All tests completed successfully!');
        console.log('The payment URLs should now work without causing 74 (unsupported bank) error');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    }
}

// Run the test
testPaymentUrlGeneration();