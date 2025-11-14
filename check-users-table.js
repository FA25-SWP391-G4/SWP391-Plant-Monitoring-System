require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsersTable() {
  try {
    console.log('Checking users table...');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('Users table structure:');
      structure.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Count users
      const count = await pool.query('SELECT COUNT(*) FROM users');
      console.log('Number of users:', count.rows[0].count);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();