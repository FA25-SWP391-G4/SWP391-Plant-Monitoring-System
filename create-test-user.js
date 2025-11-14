require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING user_id, email, full_name, role
    `, [email, hashedPassword, name, 'Regular']);
    
    console.log('Test user created successfully:');
    console.log(result.rows[0]);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    if (error.code === '23505') {
      console.log('User already exists, trying to login with existing user...');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

createTestUser();