#!/usr/bin/env node

/**
 * Plant Profiles Data Migration Script
 * Populates the plant_profiles table with 150+ real plant species
 * 
 * Usage: node run-plant-profiles-migration.js [--rollback]
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/plant_system',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Plant Profiles migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'populate_plant_profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute the migration
    console.log('📊 Executing plant profiles data insertion...');
    await client.query(migrationSQL);
    
    // Verify the data was inserted
    const result = await client.query('SELECT COUNT(*) as count FROM Plant_Profiles');
    const plantCount = parseInt(result.rows[0].count);
    
    console.log(`✅ Successfully inserted ${plantCount} plant species!`);
    
    // Show some sample data
    const sampleResult = await client.query(`
      SELECT species_name, ideal_moisture, LEFT(description, 80) || '...' as description 
      FROM Plant_Profiles 
      ORDER BY species_name 
      LIMIT 5
    `);
    
    console.log('\n📝 Sample plant profiles:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.species_name} (${row.ideal_moisture}% moisture)`);
      console.log(`   ${row.description}\n`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Plant Profiles migration completed successfully!');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back Plant Profiles migration...');
    
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE Plant_Profiles RESTART IDENTITY');
    await client.query('COMMIT');
    
    console.log('✅ Plant Profiles table cleared successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function showStatistics() {
  const client = await pool.connect();
  
  try {
    console.log('📈 Plant Profiles Statistics:');
    
    // Total count
    const totalResult = await client.query('SELECT COUNT(*) as total FROM Plant_Profiles');
    console.log(`Total species: ${totalResult.rows[0].total}`);
    
    // Moisture distribution
    const moistureResult = await client.query(`
      SELECT 
        CASE 
          WHEN ideal_moisture <= 25 THEN 'Very Low (≤25%)'
          WHEN ideal_moisture <= 50 THEN 'Low (26-50%)'
          WHEN ideal_moisture <= 75 THEN 'Medium (51-75%)'
          ELSE 'High (>75%)'
        END as moisture_category,
        COUNT(*) as count
      FROM Plant_Profiles 
      WHERE ideal_moisture IS NOT NULL
      GROUP BY moisture_category
      ORDER BY MIN(ideal_moisture)
    `);
    
    console.log('\nMoisture Requirements Distribution:');
    moistureResult.rows.forEach(row => {
      console.log(`  ${row.moisture_category}: ${row.count} species`);
    });
    
    // Sample species by category
    const categoriesResult = await client.query(`
      SELECT species_name, ideal_moisture
      FROM Plant_Profiles 
      WHERE ideal_moisture IS NOT NULL
      ORDER BY ideal_moisture DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 High-Moisture Plants:');
    categoriesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.species_name} (${row.ideal_moisture}%)`);
    });
    
  } catch (error) {
    console.error('❌ Failed to get statistics:', error.message);
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
      await rollbackMigration();
    } else if (args.includes('--stats')) {
      await showStatistics();
    } else {
      await runMigration();
      await showStatistics();
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await pool.end();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { runMigration, rollbackMigration, showStatistics };