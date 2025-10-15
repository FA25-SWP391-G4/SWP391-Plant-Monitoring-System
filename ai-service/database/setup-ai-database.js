#!/usr/bin/env node

/**
 * Enhanced Database Setup Script for AI Features
 * Tạo enhanced database schema cho AI features
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database configuration chung
const db = require('../../config/db');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const result = await db.pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure PostgreSQL is running and check your configuration:');
    console.log('   DB_HOST=' + (process.env.DB_HOST || 'localhost'));
    console.log('   DB_PORT=' + (process.env.DB_PORT || '5432'));
    console.log('   DB_NAME=' + (process.env.DB_NAME || 'plant_monitoring'));
    console.log('   DB_USER=' + (process.env.DB_USER || 'postgres'));
    return false;
  }
}

async function runMigration() {
  console.log('\n📋 Running AI features database migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'ai-schema-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.pool.query(migrationSQL);
    console.log('✅ AI features database migration completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying created tables and indexes...');
  
  try {
    // Check if all required tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_analyses', 'ai_feedback', 'plant_disease_images', 'ai_models', 'chat_histories')
      ORDER BY table_name
    `;
    
    const tablesResult = await db.pool.query(tableCheckQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    const requiredTables = ['ai_analyses', 'ai_feedback', 'plant_disease_images', 'ai_models', 'chat_histories'];
    
    console.log('📊 Table verification:');
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
      }
    }
    
    // Check indexes
    const indexCheckQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;
    
    const indexesResult = await db.pool.query(indexCheckQuery);
    console.log(`\n📈 Created ${indexesResult.rows.length} performance indexes`);
    
    // Check views
    const viewCheckQuery = `
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_analysis_summary', 'chat_session_summary')
    `;
    
    const viewsResult = await db.pool.query(viewCheckQuery);
    console.log(`📊 Created ${viewsResult.rows.length} summary views`);
    
    // Check AI models
    const modelsResult = await db.pool.query('SELECT model_name, model_type, version, is_active FROM ai_models ORDER BY model_type, model_name');
    console.log(`\n🤖 AI Models configured:`);
    for (const model of modelsResult.rows) {
      const status = model.is_active ? '🟢 Active' : '🔴 Inactive';
      console.log(`   ${status} ${model.model_name} (${model.model_type}) v${model.version}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Table verification failed:', error.message);
    return false;
  }
}

async function insertSampleData() {
  console.log('\n🌱 Checking for sample data...');
  
  try {
    // Check if plants table has data
    const plantsCount = await db.pool.query('SELECT COUNT(*) FROM plants');
    const plantCount = parseInt(plantsCount.rows[0].count);
    
    if (plantCount === 0) {
      console.log('📝 Inserting sample plants...');
      
      const insertPlantsQuery = `
        INSERT INTO plants (name, type, description, user_id, location, status) VALUES
        ('Cà chua Cherry', 'tomato', 'Cà chua cherry ngọt, dễ trồng trong chậu', 'user123', 'Ban công', 'healthy'),
        ('Xà lách xoăn', 'lettuce', 'Xà lách xoăn tươi ngon, phát triển nhanh', 'user123', 'Vườn nhỏ', 'growing'),
        ('Ớt chuông', 'pepper', 'Ớt chuông ngọt, màu sắc đẹp', 'user123', 'Chậu lớn', 'flowering')
        RETURNING id, name
      `;
      
      const plantsResult = await db.pool.query(insertPlantsQuery);
      console.log(`✅ Inserted ${plantsResult.rows.length} sample plants`);
      
      // Insert sample sensor data
      for (const plant of plantsResult.rows) {
        const sensorDataQuery = `
          INSERT INTO sensor_data (plant_id, temperature, soil_moisture, humidity, light_level, soil_ph)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await db.pool.query(sensorDataQuery, [
          plant.id,
          22 + Math.random() * 8, // 22-30°C
          40 + Math.random() * 40, // 40-80%
          50 + Math.random() * 30, // 50-80%
          2000 + Math.random() * 3000, // 2000-5000 lux
          6.0 + Math.random() * 1.5 // 6.0-7.5 pH
        ]);
      }
      
      console.log('✅ Sample sensor data inserted');
      
      // Insert sample AI analysis
      const sampleAnalysisQuery = `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, confidence_score)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await db.pool.query(sampleAnalysisQuery, [
        plantsResult.rows[0].id,
        'user123',
        'irrigation_prediction',
        JSON.stringify({ soil_moisture: 45, temperature: 25, humidity: 60 }),
        JSON.stringify({ should_water: false, hours_until_water: 12, confidence: 0.85 }),
        0.85
      ]);
      
      console.log('✅ Sample AI analysis inserted');
      
    } else {
      console.log(`📊 Found ${plantCount} existing plants, skipping sample data insertion`);
    }
    
  } catch (error) {
    console.error('❌ Error with sample data:', error.message);
  }
}

async function showDatabaseStats() {
  console.log('\n📊 Database Statistics:');
  
  try {
    const tables = [
      'plants', 'sensor_data', 'chat_histories', 'ai_analyses', 
      'ai_feedback', 'plant_disease_images', 'ai_models'
    ];
    
    for (const table of tables) {
      try {
        const result = await db.pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`   📋 ${table.padEnd(20)} ${count.padStart(6)} records`);
      } catch (error) {
        console.log(`   📋 ${table.padEnd(20)}      - table not found`);
      }
    }
    
    // Show AI model stats
    const aiStats = await db.pool.query(`
      SELECT 
        model_type,
        COUNT(*) as model_count,
        COUNT(CASE WHEN is_active THEN 1 END) as active_count
      FROM ai_models 
      GROUP BY model_type
      ORDER BY model_type
    `);
    
    if (aiStats.rows.length > 0) {
      console.log('\n🤖 AI Models Summary:');
      for (const stat of aiStats.rows) {
        console.log(`   ${stat.model_type.padEnd(20)} ${stat.active_count}/${stat.model_count} active`);
      }
    }
    
    // Show recent activity
    const recentActivity = await db.pool.query(`
      SELECT 
        analysis_type,
        COUNT(*) as count,
        MAX(created_at) as last_analysis
      FROM ai_analyses 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      GROUP BY analysis_type
      ORDER BY count DESC
    `);
    
    if (recentActivity.rows.length > 0) {
      console.log('\n📈 Recent AI Activity (Last 7 days):');
      for (const activity of recentActivity.rows) {
        console.log(`   ${activity.analysis_type.padEnd(20)} ${activity.count} analyses`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
  }
}

async function main() {
  console.log('🚀 AI Features Database Setup');
  console.log('===============================\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Run migration
  const migrationSuccess = await runMigration();
  if (!migrationSuccess) {
    console.log('\n❌ Migration failed, cannot proceed');
    process.exit(1);
  }
  
  // Verify tables
  const verificationSuccess = await verifyTables();
  if (!verificationSuccess) {
    console.log('\n⚠️  Table verification had issues, but continuing...');
  }
  
  // Insert sample data
  await insertSampleData();
  
  // Show stats
  await showDatabaseStats();
  
  console.log('\n✅ AI Features Database Setup completed successfully!');
  console.log('🤖 Enhanced AI features are now ready:');
  console.log('   • AI Analysis tracking');
  console.log('   • User feedback collection');
  console.log('   • Disease image storage');
  console.log('   • Model metadata management');
  console.log('   • Enhanced chat history');
  console.log('   • Performance optimized indexes');
  console.log('   • Automated cleanup functions');
  
  process.exit(0);
}

// Run setup
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { testConnection, runMigration, verifyTables };