const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkPlants() {
  try {
    const result = await pool.query('SELECT plant_id, custom_name FROM plants LIMIT 5');
    console.log('Available plants:');
    console.log(result.rows);
    
    if (result.rows.length === 0) {
      console.log('No plants found. Creating a test plant...');
      const insertResult = await pool.query(`
        INSERT INTO plants (custom_name, user_id, moisture_threshold, auto_watering_on) 
        VALUES ('Test Plant', 1, 50, true) 
        RETURNING plant_id, custom_name
      `);
      console.log('Created test plant:', insertResult.rows[0]);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPlants();