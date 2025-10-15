#!/usr/bin/env node

/**
 * Check ai_models table structure
 */

require('dotenv').config();
const db = require('../../config/db');

async function checkAIModelsStructure() {
  try {
    console.log('🔍 Checking ai_models table structure...');
    
    const result = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_models' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 AI Models table columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check existing data
    const dataResult = await db.pool.query('SELECT * FROM ai_models LIMIT 5');
    console.log(`\n📋 Existing records: ${dataResult.rows.length}`);
    dataResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking ai_models table:', error);
    process.exit(1);
  }
}

checkAIModelsStructure();