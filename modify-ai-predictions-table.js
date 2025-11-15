const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function modifyTable() {
  try {
    console.log('Modifying ai_predictions table to allow null plant_id for testing...');
    
    // Drop the foreign key constraint temporarily
    await pool.query('ALTER TABLE ai_predictions DROP CONSTRAINT IF EXISTS ai_predictions_plant_id_fkey');
    
    // Make plant_id nullable
    await pool.query('ALTER TABLE ai_predictions ALTER COLUMN plant_id DROP NOT NULL');
    
    console.log('✅ ai_predictions table modified successfully');
    console.log('Note: plant_id can now be null for testing purposes');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error modifying table:', error.message);
    process.exit(1);
  }
}

modifyTable();