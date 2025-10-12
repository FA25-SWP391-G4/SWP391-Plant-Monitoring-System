/**
 * Jest mock for nodemailer
 * This file mocks the nodemailer functionality for testing email functionality
 */

const mockSendMail = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    messageId: 'mock-message-id-12345',
    response: '250 OK: Message mock-message-id-12345 accepted'
  });
});

const mockTransporter = {
  sendMail: mockSendMail,
  verify: jest.fn().mockImplementation(() => Promise.resolve(true)),
  close: jest.fn()
};

const mockCreateTransport = jest.fn().mockImplementation(() => mockTransporter);

module.exports = {
  createTransport: mockCreateTransport,
  getTestMessageUrl: jest.fn().mockImplementation(() => 'https://ethereal.email/message/mock12345'),
  // Expose the mocked functions for testing
  __mock: {
    createTransport: mockCreateTransport,
    sendMail: mockSendMail,
    transporter: mockTransporter
  }
};