require('dotenv').config({ path: './ai_service/.env' });

// Simple test runner since npm test might have issues with path
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running AI Service Tests...\n');

try {
    // Change to ai_service directory and run tests
    process.chdir('./ai_service');
    
    console.log('Current directory:', process.cwd());
    console.log('Running chatbot tests...\n');
    
    // Run specific test file
    const result = execSync('npx jest tests/chatbot.test.js --verbose', { 
        encoding: 'utf8',
        stdio: 'inherit'
    });
    
    console.log('\n✅ Tests completed successfully!');
    
} catch (error) {
    console.log('\n❌ Test execution failed:');
    console.log(error.message);
    
    // Try alternative approach
    console.log('\n🔄 Trying alternative test approach...');
    try {
        const openRouterService = require('./services/openRouterService');
        console.log('✅ OpenRouter service loaded successfully');
        console.log('Service status:', openRouterService.getServiceStatus());
    } catch (altError) {
        console.log('❌ Alternative test failed:', altError.message);
    }
}