// Load environment variables first
require('dotenv').config();

// Check settings in database directly
const { pool } = require('./config/db');

async function checkUserSettings() {
  try {
    console.log('Starting database query...');
    
    // Get user settings from database
    const result = await pool.query(
      'SELECT user_id, email, settings FROM users WHERE email = $1',
      ['dangheonghai@gmail.com']
    );
    
    console.log('Query completed, rows found:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('User found:', result.rows[0].email);
      console.log('User ID:', result.rows[0].user_id);
      console.log('Settings in DB:', result.rows[0].settings);
      
      if (result.rows[0].settings) {
        const parsed = JSON.parse(result.rows[0].settings);
        console.log('Parsed settings:');
        console.log('- Dashboard:', parsed.dashboard);
        console.log('- Widgets:', parsed.widgets);
      } else {
        console.log('No settings found in database');
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserSettings();