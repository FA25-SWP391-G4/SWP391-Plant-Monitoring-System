require('dotenv').config({ path: './ai_service/.env' });
const { Pool } = require('pg');
const fs = require('fs');

async function runMigration() {
    console.log('🗄️  Running Chat History Migration...\n');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Test connection
        console.log('🔌 Testing database connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Read migration file
        console.log('📄 Reading migration file...');
        const migrationSQL = fs.readFileSync('./migrations/create_chat_history_table.sql', 'utf8');
        console.log('✅ Migration file loaded');
        
        // Run migration
        console.log('🚀 Executing migration...');
        await pool.query(migrationSQL);
        console.log('✅ Migration executed successfully');
        
        // Verify table creation
        console.log('🔍 Verifying table creation...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'chat_history' 
            ORDER BY ordinal_position
        `);
        
        console.log('✅ Chat history table structure:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (error) {
        console.log('❌ Migration failed:');
        console.log('Error:', error.message);
        
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Table might already exist, checking...');
            try {
                const result = await pool.query("SELECT COUNT(*) FROM chat_history");
                console.log('✅ Table exists and is accessible');
            } catch (checkError) {
                console.log('❌ Table check failed:', checkError.message);
            }
        }
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed');
    }
}

runMigration();