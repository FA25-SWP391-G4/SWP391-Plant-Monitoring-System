/**
 * ============================================================================
 * TEST DATABASE SETUP AND UTILITIES
 * ============================================================================
 */

const { Pool } = require('pg');

/**
 * Test database configuration
 */
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'plant_system_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

let testPool;

/**
 * Initialize test database connection
 */
async function initTestDb() {
  testPool = new Pool(testDbConfig);
  
  try {
    await testPool.query('SELECT NOW()');
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
  
  return testPool;
}

/**
 * Clean database before tests
 */
async function cleanDatabase() {
  // TODO: Implement database cleanup
  // Delete all test data in reverse order of foreign key dependencies
  const cleanupQueries = [
    'DELETE FROM watering_history',
    'DELETE FROM pump_schedules',
    'DELETE FROM sensor_data',
    'DELETE FROM ai_predictions',
    'DELETE FROM image_analyses',
    'DELETE FROM alerts',
    'DELETE FROM chat_history',
    'DELETE FROM payments',
    'DELETE FROM subscriptions',
    'DELETE FROM plants',
    'DELETE FROM zones',
    'DELETE FROM devices',
    'DELETE FROM users WHERE email LIKE \'%test%\'',
    'DELETE FROM system_logs WHERE component = \'test\''
  ];

  for (const query of cleanupQueries) {
    try {
      await testPool.query(query);
    } catch (error) {
      console.warn(`Cleanup query failed: ${query}`, error.message);
    }
  }
}

/**
 * Seed test data
 */
async function seedTestData() {
  // TODO: Create test users, plants, zones, etc.
}

/**
 * Close test database connection
 */
async function closeTestDb() {
  if (testPool) {
    await testPool.end();
    console.log('Test database connection closed');
  }
}

/**
 * Execute query on test database
 */
async function queryTestDb(sql, params = []) {
  return await testPool.query(sql, params);
}

module.exports = {
  initTestDb,
  cleanDatabase,
  seedTestData,
  closeTestDb,
  queryTestDb,
  testPool: () => testPool
};
