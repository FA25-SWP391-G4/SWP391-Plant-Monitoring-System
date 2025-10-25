/**
 * Email Test Script
 * 
 * This script tests the email sending functionality directly
 * Run with: node scripts/test-email.js [recipient-email]
 */

// Load environment variables
require('dotenv').config();

const nodemailer = require('nodemailer');

// Check if recipient is provided as command line argument
const recipientEmail = process.argv[2] || process.env.EMAIL_USER;

// Create email transporter
const createTransporter = () => {
    console.log('[EMAIL TEST] Creating email transporter with config:');
    console.log(`- Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
    console.log(`- Port: ${process.env.EMAIL_PORT || 587}`);
    console.log(`- Secure: false (required for port 587)`);
    console.log(`- User: ${process.env.EMAIL_USER ? `${process.env.EMAIL_USER}` : 'not set'}`);
    console.log(`- Recipient: ${recipientEmail}`);
    
    // Check for missing configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EMAIL ERROR] Missing email configuration. EMAIL_USER or EMAIL_PASS is not set.');
        process.exit(1);
    }
    
    const transporterConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // MUST be false for port 587, true only for port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true,
        logger: true
    };
    
    return nodemailer.createTransport(transporterConfig);
};

// Test sending email
async function testEmailSending() {
    try {
        console.log('\n[TEST] Starting email test...');
        
        // Create test email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'sonicprime1963@gmail.com', // Send to self for testing
            subject: 'Plant Monitoring System - Email Test',
            text: 'This is a test email to verify email functionality.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4CAF50;">Email Test</h2>
                    <p>This is a test email to verify email functionality.</p>
                    <p>If you received this email, the email sending configuration is working.</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated test from Plant Monitoring System.</p>
                    <p style="font-size: 12px; color: #666;">Environment: ${process.env.NODE_ENV || 'development'}</p>
                    <p style="font-size: 12px; color: #666;">Date: ${new Date().toISOString()}</p>
                </div>
            `
        };

        console.log(`\n[TEST] Creating transporter...`);
        const transporter = createTransporter();
        
        console.log(`\n[TEST] Sending test email to ${mailOptions.to}...`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('\n[TEST] Email sent successfully!');
        console.log('MessageID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
        // Additional info
        console.log('\n[TEST] Email configuration:');
        console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set (using development)');
        console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'Not set (using gmail)');
        
        console.log('\n[TEST] Email test completed successfully');
    } catch (error) {
        console.error('\n[TEST ERROR] Failed to send test email:', error);
        
        // Provide troubleshooting help
        console.log('\n[TROUBLESHOOTING]');
        console.log('1. Check your .env file has EMAIL_USER and EMAIL_PASS set correctly');
        console.log('2. If using Gmail:');
        console.log('   - Enable "Less secure app access" in your Google account settings');
        console.log('   - Or create an app password if using 2FA');
        console.log('3. Check your internet connection');
        console.log('4. Verify the email service provider is working');
        
        process.exit(1);
    }
}

// Run the test
testEmailSending();