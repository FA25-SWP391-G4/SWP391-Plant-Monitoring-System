#!/usr/bin/env node

/**
 * Check plants table structure
 */

require('dotenv').config();
const db = require('../../config/db');

async function checkPlantsStructure() {
  try {
    console.log('🔍 Checking plants table structure...');
    
    const result = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'plants' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Plants table columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check primary key
    const pkResult = await db.pool.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'plants'::regclass AND i.indisprimary
    `);
    
    console.log('\n🔑 Primary key columns:');
    pkResult.rows.forEach(row => {
      console.log(`   - ${row.attname}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking plants table:', error);
    process.exit(1);
  }
}

checkPlantsStructure();