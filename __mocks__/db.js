/**
 * Database connection pool mock for testing
 * This mock prevents actual database connections during tests
 * and provides a clean interface for Jest testing
 */

// Create mock functions that work without jest global
const createMockFn = (returnValue) => {
    const fn = (...args) => returnValue;
    fn.mockResolvedValueOnce = (value) => {
        fn.nextReturnValue = Promise.resolve(value);
        return fn;
    };
    fn.mockRejectedValueOnce = (error) => {
        fn.nextReturnValue = Promise.reject(error);
        return fn;
    };
    fn.mockImplementationOnce = (impl) => {
        fn.nextImpl = impl;
        return fn;
    };
    return fn;
};

const mockPool = {
    query: createMockFn(Promise.resolve({ rows: [], rowCount: 0 })),
    connect: createMockFn(Promise.resolve({
        query: createMockFn(Promise.resolve({ rows: [], rowCount: 0 })),
        release: createMockFn(Promise.resolve())
    })),
    end: createMockFn(Promise.resolve()),
    on: createMockFn(),
    removeListener: createMockFn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0
};

// Mock the pg Pool constructor
jest.mock('pg', () => ({
    Pool: jest.fn(() => mockPool),
    Client: jest.fn(() => ({
        connect: jest.fn(() => Promise.resolve()),
        query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
        end: jest.fn(() => Promise.resolve()),
        on: jest.fn(),
        removeListener: jest.fn()
    }))
}));

// Export for use in tests
module.exports = { mockPool };