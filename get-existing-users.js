require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getUsers() {
  try {
    const result = await pool.query('SELECT user_id, email, full_name, role FROM users LIMIT 5');
    console.log('Existing users:');
    result.rows.forEach(user => {
      console.log(`- ID: ${user.user_id}, Email: ${user.email}, Name: ${user.full_name}, Role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

getUsers();