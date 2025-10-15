#!/usr/bin/env node

/**
 * Database Setup Script for AI Service
 * Tạo các bảng cần thiết cho AI service
 */

const db = require('../config/db');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const result = await db.pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure PostgreSQL is running and check your .env configuration:');
    console.log('   DB_HOST=' + (process.env.DB_HOST || 'localhost'));
    console.log('   DB_PORT=' + (process.env.DB_PORT || '5432'));
    console.log('   DB_NAME=' + (process.env.DB_NAME || 'plant_monitoring'));
    console.log('   DB_USER=' + (process.env.DB_USER || 'postgres'));
    return false;
  }
}

async function createTables() {
  console.log('\n📋 Creating database tables...');
  
  try {
    // Tạo bảng chatbot_logs
    const chatbotLogsTable = `
      CREATE TABLE IF NOT EXISTS chatbot_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        plant_id INTEGER,
        session_id VARCHAR(255),
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        language VARCHAR(10) DEFAULT 'vi',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.pool.query(chatbotLogsTable);
    console.log('✅ chatbot_logs table created/verified');
    
    // Tạo bảng plants (nếu chưa có)
    const plantsTable = `
      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        description TEXT,
        user_id VARCHAR(255),
        location VARCHAR(255),
        planted_date DATE,
        status VARCHAR(50) DEFAULT 'healthy',
        image_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.pool.query(plantsTable);
    console.log('✅ plants table created/verified');
    
    // Tạo bảng sensor_data
    const sensorDataTable = `
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER,
        temperature DECIMAL(5,2),
        soil_moisture DECIMAL(5,2),
        humidity DECIMAL(5,2),
        light_level INTEGER,
        soil_ph DECIMAL(3,1),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.pool.query(sensorDataTable);
    console.log('✅ sensor_data table created/verified');
    
    // Tạo bảng alerts
    const alertsTable = `
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER,
        user_id VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_by VARCHAR(255),
        acknowledged_at TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.pool.query(alertsTable);
    console.log('✅ alerts table created/verified');
    
    // Tạo bảng watering_history
    const wateringHistoryTable = `
      CREATE TABLE IF NOT EXISTS watering_history (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER,
        amount INTEGER NOT NULL,
        duration INTEGER,
        method VARCHAR(50) DEFAULT 'manual',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.pool.query(wateringHistoryTable);
    console.log('✅ watering_history table created/verified');
    
    // Tạo indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_chatbot_user_id ON chatbot_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chatbot_plant_id ON chatbot_logs(plant_id)',
      'CREATE INDEX IF NOT EXISTS idx_chatbot_session_id ON chatbot_logs(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_chatbot_timestamp ON chatbot_logs(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_sensor_plant_timestamp ON sensor_data(plant_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_watering_plant_timestamp ON watering_history(plant_id, timestamp)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await db.pool.query(indexQuery);
      } catch (error) {
        // Index có thể đã tồn tại
      }
    }
    
    console.log('✅ Indexes created/verified');
    console.log('\n🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
}

async function insertSampleData() {
  console.log('\n🌱 Inserting sample data...');
  
  try {
    // Kiểm tra xem đã có dữ liệu chưa
    const existingPlants = await db.pool.query('SELECT COUNT(*) FROM plants');
    
    if (parseInt(existingPlants.rows[0].count) > 0) {
      console.log('📊 Sample data already exists, skipping...');
      return;
    }
    
    // Thêm cây mẫu
    const insertPlant = `
      INSERT INTO plants (name, type, description, user_id, location, status)
      VALUES 
        ('Cà chua Cherry', 'tomato', 'Cà chua cherry ngọt, dễ trồng trong chậu', 'user123', 'Ban công', 'healthy'),
        ('Xà lách xoăn', 'lettuce', 'Xà lách xoăn tươi ngon, phát triển nhanh', 'user123', 'Vườn nhỏ', 'growing'),
        ('Ớt chuông', 'pepper', 'Ớt chuông ngọt, màu sắc đẹp', 'user123', 'Chậu lớn', 'flowering')
      RETURNING id
    `;
    
    const plantResult = await db.pool.query(insertPlant);
    console.log('✅ Sample plants inserted');
    
    // Thêm dữ liệu cảm biến mẫu
    for (const plant of plantResult.rows) {
      const insertSensorData = `
        INSERT INTO sensor_data (plant_id, temperature, soil_moisture, humidity, light_level, soil_ph)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await db.pool.query(insertSensorData, [
        plant.id,
        22 + Math.random() * 8, // 22-30°C
        40 + Math.random() * 40, // 40-80%
        50 + Math.random() * 30, // 50-80%
        Math.floor(2000 + Math.random() * 3000), // 2000-5000 lux
        6.0 + Math.random() * 1.5 // 6.0-7.5 pH
      ]);
    }
    
    console.log('✅ Sample sensor data inserted');
    
    // Thêm lịch sử tưới nước mẫu
    for (const plant of plantResult.rows) {
      const insertWatering = `
        INSERT INTO watering_history (plant_id, amount, duration, method)
        VALUES ($1, $2, $3, $4)
      `;
      
      await db.pool.query(insertWatering, [
        plant.id,
        Math.floor(150 + Math.random() * 200), // 150-350ml
        Math.floor(10 + Math.random() * 20), // 10-30 seconds
        Math.random() > 0.5 ? 'automatic' : 'manual'
      ]);
    }
    
    console.log('✅ Sample watering history inserted');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
  }
}

async function showDatabaseInfo() {
  console.log('\n📊 Database Information:');
  
  try {
    // Hiển thị thông tin các bảng
    const tables = ['chatbot_logs', 'plants', 'sensor_data', 'alerts', 'watering_history'];
    
    for (const table of tables) {
      try {
        const result = await db.pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📋 ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`📋 ${table}: table not found`);
      }
    }
    
    // Hiển thị thống kê chatbot
    try {
      const chatStats = await db.pool.query(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT plant_id) as unique_plants
        FROM chatbot_logs
      `);
      
      if (chatStats.rows[0].total_messages > 0) {
        console.log('\n💬 Chatbot Statistics:');
        console.log(`   Total messages: ${chatStats.rows[0].total_messages}`);
        console.log(`   Unique users: ${chatStats.rows[0].unique_users}`);
        console.log(`   Plants discussed: ${chatStats.rows[0].unique_plants}`);
      }
    } catch (error) {
      // Bảng có thể chưa có dữ liệu
    }
    
  } catch (error) {
    console.error('❌ Error getting database info:', error.message);
  }
}

async function main() {
  console.log('🚀 AI Service Database Setup');
  console.log('============================\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Create tables
  await createTables();
  
  // Insert sample data
  await insertSampleData();
  
  // Show info
  await showDatabaseInfo();
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('🤖 AI Service is now ready to use with PostgreSQL database');
  
  process.exit(0);
}

// Run setup
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { testConnection, createTables, insertSampleData };