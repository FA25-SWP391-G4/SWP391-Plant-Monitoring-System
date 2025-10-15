#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔒 Running Security and Error Handling Tests...\n');

// Ensure test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Create necessary directories
const testDirs = [
  path.join(__dirname, 'uploads/temp'),
  path.join(__dirname, 'uploads/encrypted'),
  path.join(__dirname, 'logs')
];

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created test directory: ${dir}`);
  }
});

// Run the security tests
const testProcess = spawn('npx', ['jest', 'tests/security-error-handling.test.js', '--verbose', '--detectOpenHandles'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`\n🔒 Security tests completed with exit code: ${code}`);
  
  if (code === 0) {
    console.log('✅ All security and error handling tests passed!');
    
    // Generate test summary
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Rate Limiting Tests');
    console.log('- ✅ Authentication Tests');
    console.log('- ✅ Input Validation and Sanitization Tests');
    console.log('- ✅ AI-Specific Security Validation Tests');
    console.log('- ✅ Error Handling and Fallback Tests');
    console.log('- ✅ Data Encryption and Privacy Tests');
    console.log('- ✅ Privacy Middleware Tests');
    console.log('- ✅ Data Retention Tests');
    console.log('- ✅ Security Headers and CORS Tests');
    console.log('- ✅ File Upload Security Tests');
    console.log('- ✅ Integration Security Tests');
    
    console.log('\n🛡️ Security Features Tested:');
    console.log('- Rate limiting (100 req/min general, 30 req/min chatbot, 10 req/min uploads)');
    console.log('- API key authentication and JWT token validation');
    console.log('- Input sanitization and XSS protection');
    console.log('- File upload validation and malware protection');
    console.log('- Data encryption (AES-256-GCM) and secure storage');
    console.log('- Privacy compliance (GDPR) and data anonymization');
    console.log('- Error handling with graceful degradation');
    console.log('- Data retention policies and automatic cleanup');
    console.log('- Security headers and CORS protection');
    console.log('- Content filtering for plant-related queries only');
    
  } else {
    console.log('❌ Some security tests failed. Please review the output above.');
  }
  
  // Cleanup test directories
  console.log('\n🧹 Cleaning up test files...');
  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
        console.log(`🗑️ Cleaned up: ${dir}`);
      } catch (error) {
        console.warn(`⚠️ Could not clean up ${dir}: ${error.message}`);
      }
    }
  });
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to run security tests:', error.message);
  process.exit(1);
});