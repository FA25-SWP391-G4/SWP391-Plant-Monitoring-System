/**
 * REAL EMAIL SENDING TEST
 * =======================
 * Tests actual email delivery to sonicprime1963@gmail.com
 * This will send a real email using the configured Gmail account
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter (same as in authController)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

async function testRealEmailSending() {
    try {
        console.log('🧪 Starting real email test...');
        console.log('📧 Target email:', 'sonicprime1963@gmail.com');
        console.log('📧 From email:', process.env.EMAIL_USER);
        
        // Generate a test reset token
        const testToken = crypto.randomBytes(32).toString('hex');
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${testToken}`;
        
        // Create transporter
        const transporter = createTransporter();
        
        // Test transporter configuration
        console.log('🔧 Testing transporter configuration...');
        await transporter.verify();
        console.log('✅ Transporter configuration is valid');
        
        // Email options - Same format as authController
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'sonicprime1963@gmail.com',
            subject: '🌱 Plant Monitoring System - Password Reset Test',
            text: `
Hello Test User,

This is a TEST email to verify that the Plant Monitoring System can successfully send emails to your address.

🔐 Test Password Reset Information:
- Reset URL: ${resetUrl}
- Test Token: ${testToken}
- Expires: 1 hour from now
- Sent at: ${new Date().toLocaleString()}

📧 Email Configuration Details:
- Service: ${process.env.EMAIL_SERVICE}
- From: ${process.env.EMAIL_USER}
- Environment: ${process.env.NODE_ENV}

If you received this email, the email system is working correctly! ✅

---
This is a TEST message from Plant Monitoring System.
Testing conducted on: ${new Date().toISOString()}
            `,
        };

        // Send the email
        console.log('📤 Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('🎉 EMAIL SENT SUCCESSFULLY!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📨 Response:', info.response);
        console.log('✅ Email delivered to: sonicprime1963@gmail.com');
        console.log('🔍 Check the inbox for the test email');

        return {
            success: true,
            messageId: info.messageId,
            response: info.response,
            targetEmail: 'sonicprime1963@gmail.com',
            testToken: testToken,
            resetUrl: resetUrl
        };

    } catch (error) {
        console.error('❌ EMAIL SENDING FAILED:');
        console.error('Error details:', error);
        
        if (error.code === 'EAUTH') {
            console.error('🔐 Authentication failed - check EMAIL_USER and EMAIL_PASS in .env');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🌐 Network error - check internet connection');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏰ Timeout error - Gmail server might be slow');
        }

        return {
            success: false,
            error: error.message,
            errorCode: error.code
        };
    }
}

// Test forgot password flow with real email
async function testForgotPasswordFlow() {
    try {
        console.log('\n🔄 Testing Full Forgot Password Flow...');
        
        // Simulate the forgot password request
        const result = await testRealEmailSending();
        
        if (result.success) {
            console.log('\n📋 FRONTEND INTEGRATION INFO:');
            console.log('- Reset URL format:', result.resetUrl);
            console.log('- Token format:', result.testToken);
            console.log('- Email successfully delivered to:', result.targetEmail);
            console.log('\n🎯 FOR REACT FRONTEND:');
            console.log('- User will receive email with reset link');
            console.log('- Link redirects to: http://localhost:3000/reset-password?token=...');
            console.log('- Frontend should extract token from URL params');
            console.log('- Frontend sends POST to /auth/reset-password with token + new password');
        }

        return result;
    } catch (error) {
        console.error('Flow test error:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
if (require.main === module) {
    testForgotPasswordFlow()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
                console.log('📧 Real email sent to sonicprime1963@gmail.com');
                process.exit(0);
            } else {
                console.log('\n❌ TEST FAILED!');
                console.log('Error:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testRealEmailSending, testForgotPasswordFlow };
