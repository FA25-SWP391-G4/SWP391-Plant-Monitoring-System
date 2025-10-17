# Email Configuration Guide

This document provides details on configuring and troubleshooting email functionality in the Plant Monitoring System.

## Configuration Options

Email settings are controlled through environment variables:

| Variable        | Description                                     | Default Value  |
|----------------|-------------------------------------------------|----------------|
| EMAIL_HOST     | SMTP server hostname                            | smtp.gmail.com |
| EMAIL_PORT     | SMTP server port                               | 587            |
| EMAIL_USER     | Email account username                          | -              |
| EMAIL_PASS     | Email account password or app password          | -              |
| EMAIL_SECURE   | Use SSL/TLS (set to 'false' for port 587)      | false          |

## Important Notes for Gmail Users

When using Gmail as your email service:

1. **App Password Required**: You must use an "App Password" instead of your regular Gmail password.
   - Go to your Google Account → Security → 2-Step Verification → App Passwords
   - Create a new app password for "Mail" and use it as your EMAIL_PASS

2. **Port and Security Settings**:
   - For port 587: Set `EMAIL_SECURE=false` (TLS connection)
   - For port 465: Set `EMAIL_SECURE=true` (SSL connection)

3. **Less Secure Apps**: The "Less secure apps" setting is no longer available. Use App Passwords instead.

## Testing Email Configuration

Use the provided test script to verify your email configuration:

```bash
# Test email with default settings (sends to EMAIL_USER)
node scripts/test-email.js

# Test email with specific recipient
node scripts/test-email.js recipient@example.com
```

## Common Email Issues and Solutions

### SSL/TLS Version Errors

Error: `SSL routines:tls_validate_record_header:wrong version number`

**Solution**:
- For port 587: Ensure `EMAIL_SECURE` is set to `false`
- For port 465: Ensure `EMAIL_SECURE` is set to `true`

### Authentication Failures

Error: `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solutions**:
1. Check that you're using an App Password (not your regular password)
2. Verify EMAIL_USER is your complete email address (e.g., user@gmail.com)
3. Check for typos in your credentials

### Connection Timeouts

Error: `Connection timeout`

**Solutions**:
1. Check your network/firewall isn't blocking outgoing SMTP connections
2. Verify the email server hostname and port are correct

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)