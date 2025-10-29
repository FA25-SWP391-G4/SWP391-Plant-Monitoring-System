/**
 * Test database connection after fixing the configuration
 */

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...\n');
    
    try {
        const { Pool } = require('pg');
        
        // Test the fixed configuration
        const pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || '127.0.0.1',
            database: process.env.DB_NAME || 'plant_system',
            password: String(process.env.DB_PASSWORD || '123'),
            port: parseInt(process.env.DB_PORT || '5432'),
            ssl: false
        });
        
        console.log('📋 Connection Configuration:');
        console.log(`  Host: ${process.env.DB_HOST || '127.0.0.1'}`);
        console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
        console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
        console.log(`  Database: ${process.env.DB_NAME || 'plant_system'}`);
        console.log(`  Password: ${String(process.env.DB_PASSWORD || '123')} (type: ${typeof String(process.env.DB_PASSWORD || '123')})`);
        
        // Test connection
        console.log('\n🔌 Attempting to connect...');
        const client = await pool.connect();
        
        // Test query
        console.log('📊 Testing query...');
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        
        console.log('✅ Database connection successful!');
        console.log(`📅 Current time: ${result.rows[0].current_time}`);
        console.log(`🗄️ PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
        
        // Test if our tables exist
        console.log('\n🔍 Checking existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('📋 Existing tables:');
            tablesResult.rows.forEach(row => {
                console.log(`  • ${row.table_name}`);
            });
        } else {
            console.log('⚠️ No tables found in database');
        }
        
        client.release();
        await pool.end();
        
        return {
            success: true,
            message: 'Database connection working perfectly'
        };
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        if (error.message.includes('SCRAM-SERVER-FIRST-MESSAGE')) {
            console.log('\n💡 This is the password string error we fixed!');
            console.log('   The fix should prevent this error.');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 PostgreSQL server is not running.');
            console.log('   Please start PostgreSQL service.');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n💡 Database does not exist.');
            console.log('   Please create the database first.');
        }
        
        return {
            success: false,
            message: error.message
        };
    }
}

// Run the test
if (require.main === module) {
    testDatabaseConnection()
        .then((result) => {
            if (result.success) {
                console.log('\n🎉 Database test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n⚠️ Database test failed but this may be expected if PostgreSQL is not running');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Test script failed:', error);
            process.exit(1);
        });
}

module.exports = testDatabaseConnection;