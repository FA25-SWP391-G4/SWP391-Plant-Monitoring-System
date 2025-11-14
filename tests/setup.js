// Jest setup for backend tests
// Keep minimal to avoid impacting other tests

// Ensure JWT secret for auth middleware
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Optional: silence noisy logs during tests
const origLog = console.log;
const origError = console.error;

if (process.env.SILENCE_TEST_LOGS === 'true') {
  console.log = () => {};
  console.error = () => {};
}

afterAll(() => {
  // Restore logs if they were silenced
  console.log = origLog;
  console.error = origError;
});