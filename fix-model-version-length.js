const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixModelVersionLength() {
  try {
    console.log('Fixing model_version column length...');
    
    // Increase the length of model_version column
    await pool.query('ALTER TABLE ai_predictions ALTER COLUMN model_version TYPE VARCHAR(50)');
    
    console.log('✅ model_version column length increased to 50 characters');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error fixing column length:', error.message);
    process.exit(1);
  }
}

fixModelVersionLength();