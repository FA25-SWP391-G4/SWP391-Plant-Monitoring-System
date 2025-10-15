#!/usr/bin/env node

/**
 * Simple Database Connection Test
 */

require('dotenv').config();
const db = require('../config/db');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Environment variables:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  
  try {
    await db.connectDB();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await db.pool.query('SELECT NOW() as current_time');
    console.log('📅 Current time from DB:', result.rows[0].current_time);
    
    // Check if basic tables exist
    const tablesResult = await db.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();