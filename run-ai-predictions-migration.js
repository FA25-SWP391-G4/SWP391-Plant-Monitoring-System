const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    console.log('Running ai_predictions table migration...');
    const sql = fs.readFileSync('migrations/create_ai_predictions_table.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ ai_predictions table created successfully');
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating ai_predictions table:', error.message);
    process.exit(1);
  }
}

runMigration();