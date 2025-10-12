require('dotenv').config();
const { pool, connectDB } = require('../config/db');

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Test connection
connectDB()
  .then(() => {
    // Try a simple query
    return pool.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query result:', res.rows[0]);
    console.log('Database connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });