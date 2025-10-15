/**
 * Database Configuration for AI Service
 * Enhanced PostgreSQL connection with AI features support
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'plant_monitoring',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || "password"),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
};

// Create connection pool
const pool = new Pool(dbConfig);

// Enhanced connection testing
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ PostgreSQL Connected successfully');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('💡 Connection details:');
    console.error('   Host:', dbConfig.host);
    console.error('   Port:', dbConfig.port);
    console.error('   Database:', dbConfig.database);
    console.error('   User:', dbConfig.user);
    return false;
  }
};

// Enhanced query method with error handling and logging
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️  Slow query detected (${duration}ms):`, text.substring(0, 100) + '...');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction error:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  connectDB,
  dbConfig
};