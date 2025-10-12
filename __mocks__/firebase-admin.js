// Mock firebase-admin for tests
module.exports = {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn(),
        applicationDefault: jest.fn()
    },
    messaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('message-id'),
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
        sendToDevice: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 })
    })
};