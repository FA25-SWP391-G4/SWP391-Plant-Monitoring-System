/**
 * Email Service
 *
 * Centralized email sending functionality for the Plant Monitoring System
 * Uses nodemailer for SMTP email delivery with rate limiting
 */

const nodemailer = require('nodemailer');
const { SystemLog } = require('../models');

// Email configuration cache
let transporter = null;
let lastTransporterCreated = null;

// Email queue implementation to prevent simultaneous sends
const emailQueue = [];
let isProcessingQueue = false;
const EMAIL_RATE_LIMIT_MS = 1000; // 1 second between emails
let lastEmailSent = 0;

/**
 * Create and configure the email transporter
 * @returns {Object} Configured nodemailer transporter
 */
const createTransporter = () => {
  // Log the email configuration attempt
  console.log('[EMAIL DEBUG] Creating email transporter');

  // Check for required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    const config = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || '587',
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : 'not set',
      pass: process.env.EMAIL_PASS ? 'set' : 'not set',
      secure: process.env.EMAIL_PORT === '465'
    };
    
    // Debug output - show all email-related env vars to help diagnose issues
    console.log('[EMAIL DEBUG] All email environment variables:');
    const allKeys = Object.keys(process.env);
    allKeys.forEach(key => {
      if (key.includes('EMAIL') || key.includes('Mail') || key.includes('MAIL')) {
        console.log(`  ${key}: ${key.includes('PASS') ? '[MASKED]' : process.env[key]}`);
      }
    });
    
    console.log('[EMAIL DEBUG] Creating email transporter with config:', config);
    console.log('[EMAIL DEBUG] WARNING: Missing email configuration. EMAIL_USER or EMAIL_PASSWORD is not set.');
    
    // Instead of throwing error, create a dummy transporter that logs emails but doesn't send them
    // This allows the application to continue without email functionality in development
    return {
      sendMail: async (mailOptions) => {
        console.log('[EMAIL DEBUG] Email sending skipped due to missing credentials');
        console.log('[EMAIL DEBUG] Would have sent email to:', mailOptions.to);
        console.log('[EMAIL DEBUG] Email subject:', mailOptions.subject);
        
        // Log to system log for tracking
        await SystemLog.warn('emailService', 'sendMail', 
          `Email sending skipped (missing credentials) - To: ${mailOptions.to}, Subject: ${mailOptions.subject}`).catch(err => {
          console.error('[SYSTEM] Failed to log email skip:', err);
        });
        
        // Return mock successful response
        return { 
          messageId: `mock-${Date.now()}`,
          skipped: true,
          reason: 'Missing email credentials'
        };
      },
      verify: async () => {
        console.log('[EMAIL DEBUG] Email verification skipped due to missing credentials');
        return false;
      }
    };
  }

  // Create the transporter with provided configuration
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const secure = port === 465;
  
  const transporterConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, // MUST be false for port 587, true only for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Also try EMAIL_PASS as alternative
    },
    pool: true, // Use pooled connections
    maxConnections: 1, // Limit to one connection at a time
    rateDelta: 1000, // Minimum time between messages in ms
    rateLimit: 3 // Max 3 messages per rateDelta
  };
  
  // Log full configuration
  console.log('[EMAIL DEBUG] Email transporter configuration:', {
    ...transporterConfig,
    auth: {
      user: transporterConfig.auth.user,
      pass: transporterConfig.auth.pass ? '********' : 'not set'
    }
  });

  // Add debug options in development environment
  if (process.env.NODE_ENV !== 'production') {
    transporterConfig.debug = true;
    transporterConfig.logger = true;
  }

  lastTransporterCreated = Date.now();
  return nodemailer.createTransport(transporterConfig);
};

/**
 * Get the transporter instance (create if doesn't exist or is stale)
 * @returns {Object} Nodemailer transporter
 */
const getTransporter = () => {
  // If no transporter exists or it's been more than 15 minutes since last creation, create a new one
  if (!transporter || !lastTransporterCreated || Date.now() - lastTransporterCreated > 15 * 60 * 1000) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Process the email queue to ensure rate limiting
 */
const processEmailQueue = async () => {
  // If already processing or queue is empty, do nothing
  if (isProcessingQueue || emailQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  try {
    // Process emails with rate limiting
    while (emailQueue.length > 0) {
      const { mailOptions, resolve, reject } = emailQueue.shift();

      // Calculate time to wait before sending next email
      const now = Date.now();
      const timeToWait = Math.max(0, EMAIL_RATE_LIMIT_MS - (now - lastEmailSent));

      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }

      try {
        // Get or create transporter
        const emailTransporter = getTransporter();

        // Send the email
        console.log(`[EMAIL] Processing queued email to ${mailOptions.to} with subject "${mailOptions.subject}"`);
        const info = await emailTransporter.sendMail(mailOptions);

        // Update last sent timestamp
        lastEmailSent = Date.now();

        // Log success
        console.log(`[EMAIL] Email sent successfully: ${info.messageId}`);

        // Log to system logs
        await SystemLog.info('emailService', 'sendEmail', `Email sent to ${mailOptions.to}`);

        resolve(info);
      } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send email to ${mailOptions.to}:`, error.message);
        reject(error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
};

/**
 * Send an email (queued to prevent multiple simultaneous sends)
 * @param {Object} mailOptions - Email options (from, to, subject, text, html)
 * @returns {Promise<Object>} Email sending result
 */
const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields
      if (!mailOptions.to || !mailOptions.subject || (!mailOptions.text && !mailOptions.html)) {
        reject(new Error('Invalid email options: missing required fields (to, subject, text/html)'));
        return;
      }

      // Set default from address if not provided
      if (!mailOptions.from) {
        mailOptions.from = process.env.EMAIL_USER;
      }

      // Add to queue
      console.log(`[EMAIL] Queueing email to ${mailOptions.to} with subject "${mailOptions.subject}"`);
      emailQueue.push({ mailOptions, resolve, reject });

      // Start processing queue if not already processing
      processEmailQueue();
    } catch (error) {
      console.error('[EMAIL ERROR] Error queueing email:', error);
      reject(error);
    }
  });
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} True if connection is successful
 */
const verifyConnection = async () => {
  try {
    const emailTransporter = getTransporter();
    await emailTransporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] SMTP connection verification failed:', error);
    await SystemLog.error('emailService', 'verifyConnection', `SMTP verification failed: ${error.message}`).catch(err => {
      console.error('[SYSTEM] Failed to log verification error:', err);
    });
    return false;
  }
};

/**
 * Send a test email to verify configuration
 * @param {string} testRecipient - Email address to send test to
 * @returns {Promise<Object>} Email sending result
 */
const sendTestEmail = async (testRecipient) => {
  const recipient = testRecipient || process.env.EMAIL_USER;

  const mailOptions = {
    to: recipient,
    subject: 'Plant Monitoring System - Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4CAF50;">Email Configuration Test</h2>
        <p>This is a test email to verify that the email sending configuration is working properly.</p>
        <p>If you received this email, the email service is functioning correctly.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This is an automated test from Plant Monitoring System</p>
        <p style="font-size: 12px; color: #666;">Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p style="font-size: 12px; color: #666;">Date: ${new Date().toISOString()}</p>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  verifyConnection,
  sendTestEmail
};
