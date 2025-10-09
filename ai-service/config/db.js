const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'plant_monitoring',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Kiểm tra kết nối
pool.on('connect', () => {
  console.log('Kết nối thành công đến PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};