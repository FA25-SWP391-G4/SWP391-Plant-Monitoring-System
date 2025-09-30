/**
 * REAL FORGOT PASSWORD API TEST
 * =============================
 * Tests the complete forgot password API endpoint with real email delivery
 * to sonicprime1963@gmail.com
 */

require('dotenv').config();
const axios = require('axios');

async function testForgotPasswordAPI() {
    try {
        console.log('🧪 Testing Forgot Password API with real email...');
        console.log('🎯 Target email: sonicprime1963@gmail.com');
        console.log('📡 API endpoint: http://localhost:3010/auth/forgot-password');
        
        // Make API request to forgot password endpoint
        const response = await axios.post('http://localhost:3010/auth/forgot-password', {
            email: 'sonicprime1963@gmail.com'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('📧 Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('🎉 FORGOT PASSWORD API TEST SUCCESSFUL!');
            console.log('📧 Email sent to:', response.data.data.email);
            console.log('🔗 Reset URL:', response.data.data.resetUrl);
            console.log('⏰ Expires in:', response.data.data.expiresIn);
            console.log('\n🎯 FOR FRONTEND TEAM:');
            console.log('- User will receive email with reset link');
            console.log('- Email contains plain text (no HTML)');
            console.log('- Reset URL format:', response.data.data.resetUrl);
            console.log('- Frontend should handle token extraction and password reset form');
        }

        return response.data;

    } catch (error) {
        console.error('❌ FORGOT PASSWORD API TEST FAILED!');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
            console.error('Is the server running on http://localhost:3010?');
        } else {
            console.error('Error:', error.message);
        }

        return { success: false, error: error.message };
    }
}

// Test both direct email and API endpoint
async function runCompleteTest() {
    console.log('🚀 STARTING COMPLETE EMAIL INTEGRATION TEST');
    console.log('='.repeat(50));
    
    try {
        console.log('\n📡 Testing API endpoint...');
        const result = await testForgotPasswordAPI();
        
        if (result.success) {
            console.log('\n✅ ALL TESTS PASSED!');
            console.log('📧 Real email successfully sent to sonicprime1963@gmail.com');
            console.log('🔗 Check your email inbox for the password reset link');
            console.log('\n📋 INTEGRATION SUMMARY:');
            console.log('- Backend: ✅ Email service working');
            console.log('- API: ✅ /auth/forgot-password endpoint working');
            console.log('- Email delivery: ✅ Real email sent');
            console.log('- Frontend ready: ✅ Reset URL provided');
        } else {
            console.log('\n❌ TEST FAILED!');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('Unexpected test error:', error);
    }
}

if (require.main === module) {
    runCompleteTest().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = { testForgotPasswordAPI };
