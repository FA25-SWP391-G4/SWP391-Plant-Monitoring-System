const fs = require('fs');
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/plant_monitoring'
  });

  try {
    const migrationSQL = fs.readFileSync('./migrations/enhance-notifications-table.sql', 'utf8');
    console.log('Running notification table enhancement migration...');
    
    await pool.query(migrationSQL);
    console.log('✅ Notification table enhancement completed successfully!');
    
    // Test the new functionality
    console.log('\n📊 Testing new notification functions...');
    
    // Test notification stats
    const statsResult = await pool.query('SELECT * FROM get_notification_stats()');
    console.log('Notification stats:', statsResult.rows[0]);
    
    // Test creating a test notification
    await pool.query(`
      SELECT create_notification(
        1, 
        'system', 
        'Welcome!', 
        'enhanced', 
        'Your notification system has been successfully enhanced with new features!',
        'info',
        'normal'
      );
    `);
    
    console.log('✅ Test notification created successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();