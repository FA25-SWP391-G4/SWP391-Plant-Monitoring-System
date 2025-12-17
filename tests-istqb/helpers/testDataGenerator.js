/**
 * ============================================================================
 * TEST DATA GENERATORS
 * ============================================================================
 * Utilities for generating test data
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate test user data
 */
function generateTestUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    user_id: uuidv4(),
    email: `test.user.${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: 'TestPassword123!',
    role: 'Regular',
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Generate test plant data
 */
function generateTestPlant(userId, overrides = {}) {
  const timestamp = Date.now();
  return {
    plant_id: uuidv4(),
    user_id: userId,
    plant_name: `Test Plant ${timestamp}`,
    species: 'Test Species',
    location: 'Test Location',
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Generate test zone data
 */
function generateTestZone(userId, overrides = {}) {
  const timestamp = Date.now();
  return {
    zone_id: timestamp,
    user_id: userId,
    zone_name: `Test Zone ${timestamp}`,
    description: 'Test zone for automated testing',
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Generate test sensor data
 */
function generateTestSensorData(plantId, deviceId, overrides = {}) {
  return {
    sensor_id: uuidv4(),
    plant_id: plantId,
    device_id: deviceId,
    moisture: Math.random() * 100,
    temperature: 20 + Math.random() * 15,
    humidity: 40 + Math.random() * 40,
    light: Math.random() * 1000,
    timestamp: new Date(),
    ...overrides
  };
}

/**
 * Generate test device data
 */
function generateTestDevice(userId, overrides = {}) {
  return {
    device_id: uuidv4(),
    user_id: userId,
    device_name: `Test Device ${Date.now()}`,
    device_type: 'ESP32',
    status: 'active',
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Generate test payment data
 */
function generateTestPayment(userId, planId, overrides = {}) {
  return {
    payment_id: uuidv4(),
    user_id: userId,
    plan_id: planId,
    amount: 99000,
    currency: 'VND',
    status: 'pending',
    transaction_id: `TEST${Date.now()}`,
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Generate test subscription data
 */
function generateTestSubscription(userId, planId, overrides = {}) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  return {
    subscription_id: uuidv4(),
    user_id: userId,
    plan_id: planId,
    sub_start: now,
    sub_end: endDate,
    is_active: true,
    ...overrides
  };
}

/**
 * Generate random string
 */
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random email
 */
function randomEmail() {
  return `test.${randomString()}@example.com`;
}

/**
 * Generate random UUID
 */
function randomUUID() {
  return uuidv4();
}

module.exports = {
  generateTestUser,
  generateTestPlant,
  generateTestZone,
  generateTestSensorData,
  generateTestDevice,
  generateTestPayment,
  generateTestSubscription,
  randomString,
  randomEmail,
  randomUUID
};
