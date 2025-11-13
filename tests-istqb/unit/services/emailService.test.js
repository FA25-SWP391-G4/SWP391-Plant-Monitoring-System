const emailService = require('../../../services/emailService');
const nodemailer = require('nodemailer');
const { SystemLog } = require('../../../models');

// Mock dependencies
jest.mock('nodemailer');
jest.mock('../../../models');

describe('EmailService', () => {
  let mockTransporter;
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    
    // Reset module state
    jest.resetModules();
    jest.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn()
    };

    // Mock nodemailer.createTransport
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Mock SystemLog methods
    SystemLog.warning = jest.fn().mockResolvedValue({});
    SystemLog.info = jest.fn().mockResolvedValue({});
    SystemLog.error = jest.fn().mockResolvedValue({});

    // Mock console methods to reduce test output noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
    
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
    });

    it('should send email successfully with valid options', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      const mailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content'
      };

      const result = await emailService.sendEmail(mailOptions);

      expect(result.messageId).toBe('test-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        ...mailOptions,
        from: 'test@example.com'
      });
    });

    it('should reject when required fields are missing', async () => {
      const invalidOptions = {
        to: 'recipient@example.com'
        // Missing subject and text/html
      };

      await expect(emailService.sendEmail(invalidOptions)).rejects.toThrow(
        'Invalid email options: missing required fields (to, subject, text/html)'
      );
    });

    it('should reject when to field is missing', async () => {
      const invalidOptions = {
        subject: 'Test Subject',
        text: 'Test content'
        // Missing to field
      };

      await expect(emailService.sendEmail(invalidOptions)).rejects.toThrow(
        'Invalid email options: missing required fields (to, subject, text/html)'
      );
    });

    it('should set default from address when not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      const mailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };

      await emailService.sendEmail(mailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        ...mailOptions,
        from: 'test@example.com'
      });
    });

    it('should handle transporter sendMail errors', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const mailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content'
      };

      await expect(emailService.sendEmail(mailOptions)).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('sendEmail with missing credentials', () => {
    beforeEach(() => {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;
    });

    it('should return mock response when credentials are missing', async () => {
      const mailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content'
      };

      const result = await emailService.sendEmail(mailOptions);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('Missing email credentials');
      expect(result.messageId).toMatch(/^mock-\d+$/);
      expect(SystemLog.warning).toHaveBeenCalledWith(
        'emailService',
        'sendMail',
        expect.stringContaining('Email sending skipped (missing credentials)')
      );
    });
  });

  describe('verifyConnection', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
    });

    it('should return true when connection is verified successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false and log error when verification fails', async () => {
      const error = new Error('SMTP verification failed');
      mockTransporter.verify.mockRejectedValue(error);

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
      expect(SystemLog.error).toHaveBeenCalledWith(
        'emailService',
        'verifyConnection',
        'SMTP verification failed: SMTP verification failed'
      );
    });

    it('should handle SystemLog.error failure gracefully', async () => {
      const error = new Error('SMTP verification failed');
      mockTransporter.verify.mockRejectedValue(error);
      SystemLog.error.mockRejectedValue(new Error('Log failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '[SYSTEM] Failed to log verification error:',
        expect.any(Error)
      );
    });
  });

  describe('verifyConnection with missing credentials', () => {
    beforeEach(() => {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;
    });

    it('should return false when credentials are missing', async () => {
      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('sendTestEmail', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      process.env.NODE_ENV = 'test';
    });

    it('should send test email to specified recipient', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      const result = await emailService.sendTestEmail('custom@example.com');

      expect(result.messageId).toBe('test-123');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'custom@example.com',
        subject: 'Plant Monitoring System - Email Test',
        html: expect.stringContaining('Email Configuration Test'),
        from: 'test@example.com'
      });
    });

    it('should use EMAIL_USER as default recipient when none provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendTestEmail();

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Plant Monitoring System - Email Test',
        html: expect.stringContaining('Email Configuration Test'),
        from: 'test@example.com'
      });
    });

    it('should include environment information in test email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await emailService.sendTestEmail('test@example.com');

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('Environment: test');
      expect(emailCall.html).toContain('Date:');
    });
  });

  describe('transporter configuration', () => {
    it('should create transporter with correct SMTP settings for port 465', () => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_PORT = '465';

      emailService.verifyConnection();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'testpass123'
        },
        pool: true,
        maxConnections: 1,
        rateDelta: 1000,
        rateLimit: 3,
        debug: true,
        logger: true
      });
    });

    it('should create transporter with correct SMTP settings for port 587', () => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_PORT = '587';

      emailService.verifyConnection();

      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpass123'
        },
        pool: true,
        maxConnections: 1,
        rateDelta: 1000,
        rateLimit: 3,
        debug: true,
        logger: true
      });
    });

    it('should use default settings when environment variables are not set', () => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_PORT;

      emailService.verifyConnection();

      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'testpass123'
        },
        pool: true,
        maxConnections: 1,
        rateDelta: 1000,
        rateLimit: 3,
        debug: true,
        logger: true
      });
    });

    it('should not include debug options in production environment', () => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      process.env.NODE_ENV = 'production';

      emailService.verifyConnection();

      const transporterConfig = nodemailer.createTransporter.mock.calls[0][0];
      expect(transporterConfig.debug).toBeUndefined();
      expect(transporterConfig.logger).toBeUndefined();
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'testpass123';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process multiple emails with rate limiting', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      const promises = [
        emailService.sendEmail({
          to: 'test1@example.com',
          subject: 'Test 1',
          text: 'Content 1'
        }),
        emailService.sendEmail({
          to: 'test2@example.com',
          subject: 'Test 2',
          text: 'Content 2'
        })
      ];

      // Fast-forward timers to process queue
      jest.advanceTimersByTime(2000);

      await Promise.all(promises);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });
});