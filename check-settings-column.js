const { Pool } = require('pg');

async function checkSettingsColumn() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:0@localhost:5432/plant_system'
  });
  
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'settings'
    `);
    
    console.log('Settings column exists:', result.rows.length > 0);
    
    if (result.rows.length === 0) {
      console.log('Running migration to add settings column...');
      await pool.query('ALTER TABLE Users ADD COLUMN settings JSONB');
      await pool.query('CREATE INDEX idx_users_settings ON Users USING GIN (settings)');
      console.log('Settings column added successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

checkSettingsColumn();