/**
 * PostgreSQL Pool Configuration
 */
const { Pool } = require('pg');

// Connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Connect to the PostgreSQL database
const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully');
    
    // Create sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    
    // Create index on expire to improve session cleanup performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire)
    `);
    
    return true;
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
    throw err;
  }
};

module.exports = {
  pool,
  connectDB
};