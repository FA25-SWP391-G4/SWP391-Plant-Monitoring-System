#!/usr/bin/env node

/**
 * Check existing database tables
 */

require('dotenv').config();
const db = require('../../config/db');

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables...');
    
    const result = await db.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Existing tables:');
    if (result.rows.length === 0) {
      console.log('   No tables found');
    } else {
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check if plants table exists
    const plantsCheck = await db.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'plants'
      );
    `);
    
    console.log(`\n🌱 Plants table exists: ${plantsCheck.rows[0].exists}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();