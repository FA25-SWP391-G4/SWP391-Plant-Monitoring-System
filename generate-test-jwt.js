const jwt = require('jsonwebtoken');

// Create a valid test JWT token
const JWT_SECRET = 'cd9f94297383bffbd6b3f8d7146d1bfb'; // Same as backend

const testPayload = {
  user_id: 'test-user-123',
  role: 'Premium',
  username: 'test-premium-user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
};

const testToken = jwt.sign(testPayload, JWT_SECRET);

console.log('🔑 Generated test JWT token:');
console.log(testToken);
console.log('\n📋 Token payload:');
console.log(JSON.stringify(testPayload, null, 2));

module.exports = { testToken, JWT_SECRET };