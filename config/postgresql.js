/**
 * Mock PostgreSQL Configuration for Testing
 */
const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
};

module.exports = {
  pool: mockPool,
  connectDB: jest.fn().mockResolvedValue(true),
};