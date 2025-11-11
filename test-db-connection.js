const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/plant_monitoring'
  });

  try {
    const result = await pool.query('SELECT version()');
    console.log('✅ Database connected:', result.rows[0].version);
    
    // Check if Alerts table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'alerts'
      );
    `);
    
    console.log('Alerts table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'alerts'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nCurrent Alerts table columns:');
      columnsCheck.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();