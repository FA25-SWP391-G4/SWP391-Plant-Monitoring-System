#!/usr/bin/env node

/**
 * Payment Tests Runner
 * Runs comprehensive Jest tests for VNPay payment integration
 * Tests all provided test card scenarios
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Payment Tests with VNPay Test Cards');
console.log('=' .repeat(60));

// Test card information for reference
const testCards = [
    {
        bank: 'NCB',
        number: '9704198526191432198',
        holder: 'NGUYEN VAN A',
        expiry: '07/15',
        otp: '123456',
        expected: 'SUCCESS',
        description: 'Successful payment'
    },
    {
        bank: 'NCB', 
        number: '9704195798459170488',
        holder: 'NGUYEN VAN A',
        expiry: '07/15',
        expected: 'INSUFFICIENT_FUNDS',
        description: 'Card with insufficient balance'
    },
    {
        bank: 'NCB',
        number: '9704192181368742', 
        holder: 'NGUYEN VAN A',
        expiry: '07/15',
        expected: 'NOT_ACTIVATED',
        description: 'Card not activated for internet banking'
    },
    {
        bank: 'NCB',
        number: '9704193370791314',
        holder: 'NGUYEN VAN A', 
        expiry: '07/15',
        expected: 'BLOCKED',
        description: 'Blocked card'
    },
    {
        bank: 'NCB',
        number: '9704194841945513',
        holder: 'NGUYEN VAN A',
        expiry: '07/15', 
        expected: 'EXPIRED',
        description: 'Expired card'
    },
    {
        type: 'VISA International',
        number: '4456530000001005',
        cvv: '123',
        holder: 'NGUYEN VAN A',
        expiry: '12/26',
        email: 'test@gmail.com',
        address: '22 Lang Ha, Ha Noi',
        expected: 'SUCCESS',
        description: 'International VISA card'
    }
];

console.log('Test Cards Configuration:');
testCards.forEach((card, index) => {
    console.log(`${index + 1}. ${card.description}`);
    console.log(`   Card: ${card.number} (${card.bank || card.type})`);
    console.log(`   Expected: ${card.expected}`);
});

console.log('=' .repeat(60));

// Run Jest tests for payment functionality
const testFiles = [
    'tests/paymentController.test.js',
    'tests/paymentIntegration.test.js'
];

const jestArgs = [
    '--testTimeout=30000',
    '--verbose',
    '--colors',
    '--coverage',
    '--detectOpenHandles',
    '--forceExit',
    ...testFiles
];

console.log('Running Jest with args:', jestArgs.join(' '));
console.log('=' .repeat(60));

const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
});

jestProcess.on('close', (code) => {
    console.log('=' .repeat(60));
    if (code === 0) {
        console.log('✅ All payment tests passed successfully!');
        console.log('📊 Test coverage report generated in ./coverage directory');
        console.log('🎯 All VNPay test card scenarios validated');
    } else {
        console.log('❌ Some payment tests failed. Exit code:', code);
        console.log('💡 Check the test output above for details');
    }
    console.log('=' .repeat(60));
    process.exit(code);
});

jestProcess.on('error', (error) => {
    console.error('❌ Error running payment tests:', error);
    process.exit(1);
});