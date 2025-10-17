# Email Debugging Guide

## Overview

This document provides instructions for debugging email sending issues in the Plant Monitoring System application. The system uses Nodemailer with Gmail for sending password reset emails, welcome emails, and other notifications.

## Checking Email Configuration

### 1. Environment Variables

Ensure these environment variables are correctly set:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Notes:
- If using Gmail, you'll need an "app password" if 2FA is enabled
- The EMAIL_SERVICE defaults to "gmail" if not specified

### 2. Running Email Test Script

Use the provided test script to verify your email configuration:

```
node scripts/test-email.js
```

This script:
- Tests the email transporter creation
- Attempts to send a test email to the configured EMAIL_USER
- Provides detailed logs of the SMTP communication

## Common Email Issues

### SMTP Authentication Issues

**Symptoms:**
- Error: "Invalid login" or "Authentication failed"
- Error: "Username and password not accepted"

**Solutions:**
- If using Gmail, ensure you're using an app password, not your regular password
- Check that EMAIL_USER and EMAIL_PASS are correct in your .env file
- For Gmail, verify that "Less secure app access" is enabled or use app passwords

### Connection Issues

**Symptoms:**
- Error: "Connection refused" or "Connection timeout"
- Error: "getaddrinfo ENOTFOUND smtp.gmail.com"

**Solutions:**
- Check your internet connection
- Verify that outbound SMTP traffic (port 465/587) is not blocked by firewall
- Try using a different EMAIL_SERVICE provider

### Rate Limiting

**Symptoms:**
- Emails work occasionally but fail with quota errors
- Error: "452 4.5.3 Too many emails per second"

**Solutions:**
- Implement retry logic with exponential backoff
- Reduce the frequency of email sending
- Consider using a transactional email service like SendGrid

## Debug Logs

Email debug logs have been added to:

1. `authController.js`: 
   - `forgotPassword()` function
   - `resetPassword()` function
   - `sendWelcomeEmail()` function
   - `createTransporter()` function

Look for log messages with the prefix `[EMAIL DEBUG]` for email-related debugging information.

## Testing in Different Environments

### Development

- Use the test script for quick verification
- Check console logs for detailed SMTP communication

### Production

- Verify that the correct EMAIL_USER and EMAIL_PASS are set in production
- Consider using a production-ready email service like SendGrid or Mailgun
- Implement proper error handling and retry logic

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Creating Google App Passwords](https://support.google.com/accounts/answer/185833)