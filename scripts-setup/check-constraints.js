const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT conname, contype, confrelid::regclass as foreign_table
      FROM pg_constraint 
      WHERE conrelid = 'ai_predictions'::regclass
    `);
    console.log('Current constraints on ai_predictions table:');
    console.log(result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkConstraints();