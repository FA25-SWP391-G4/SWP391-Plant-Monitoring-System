const { pool } = require('../config/db');
require('dotenv').config();

async function testDatabaseConnection() {
    console.log('Testing PostgreSQL database connection...');
    
    try {
        console.log('PostgreSQL URL:', process.env.DATABASE_URL);
        const client = await pool.connect();
        console.log('✅ PostgreSQL connection successful!');
        
        // Test if Users table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Users table found in PostgreSQL!');
            
            // Test if password reset fields exist
            const columnCheck = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('password_reset_token', 'password_reset_expires');
            `);
            
            if (columnCheck.rows.length === 2) {
                console.log('✅ Password reset fields found in Users table!');
            } else {
                console.log('⚠️  Password reset fields not found. Run migration: migrations/add_password_reset_fields.sql');
            }
        } else {
            console.log('⚠️  Users table not found. You may need to run the database schema.');
        }
        
        client.release();
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
        return false;
    }
    
    return true;
}

function testEnvironmentVariables() {
    console.log('\nTesting environment variables...');
    
    const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'EMAIL_SERVICE',
        'EMAIL_USER',
        'EMAIL_PASS',
        'FRONTEND_URL'
    ];
    
    const missing = [];
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        } else {
            console.log(`✅ ${varName}: ${varName.includes('PASS') || varName.includes('SECRET') ? '[HIDDEN]' : process.env[varName]}`);
        }
    });
    
    if (missing.length > 0) {
        console.error('❌ Missing environment variables:', missing.join(', '));
        console.error('Please configure these in your .env file');
        return false;
    }
    
    console.log('✅ All required environment variables are set!');
    return true;
}

async function runTests() {
    console.log('🧪 Starting Plant System Password Reset Setup Tests (PostgreSQL Only)\n');
    
    // Test environment variables first
    const envOk = testEnvironmentVariables();
    
    if (!envOk) {
        console.log('\n❌ Environment test failed. Please fix the issues above before running the application.');
        process.exit(1);
    }
    
    // Test database connection
    const dbOk = await testDatabaseConnection();
    
    console.log('\n🎉 Setup tests completed!');
    console.log('\nNext steps:');
    if (!dbOk) {
        console.log('1. 🔴 Fix PostgreSQL connection first');
        console.log('2. Ensure PostgreSQL is running');
        console.log('3. Verify DATABASE_URL in .env file');
    } else {
        console.log('1. ✅ Database connection successful');
    }
    console.log('2. Run database migration: migrations/add_password_reset_fields.sql');
    console.log('3. Start server: npm start');
    console.log('4. Run tests: npm test');
    console.log('5. Test APIs using: tests/password-reset-tests.md');
    
    console.log('\n📚 Documentation:');
    console.log('- Implementation summary: IMPLEMENTATION_COMPLETE.md');
    console.log('- API testing guide: tests/password-reset-tests.md');
    console.log('- Jest tests: npm test');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDatabaseConnection, testEnvironmentVariables };
