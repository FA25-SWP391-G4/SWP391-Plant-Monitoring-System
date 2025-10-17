require('dotenv').config({ path: './ai_service/.env' });
const { Pool } = require('pg');

async function createChatTable() {
    console.log('🗄️  Creating Chat History Table...\n');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Test connection
        console.log('🔌 Testing database connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Create table
        console.log('🚀 Creating chat_history table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                chat_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                plant_id INTEGER,
                conversation_id VARCHAR(255),
                message TEXT NOT NULL,
                response TEXT,
                context JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created successfully');
        
        // Create indexes
        console.log('🔍 Creating indexes...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history (user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_history_conversation_id ON chat_history (conversation_id)');
        console.log('✅ Indexes created successfully');
        
        // Verify table
        console.log('🔍 Verifying table structure...');
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
        
        // Test insert
        console.log('🧪 Testing table with sample data...');
        await pool.query(`
            INSERT INTO chat_history (user_id, message, response, context) 
            VALUES (1, 'Test message', 'Test response', '{"test": true}')
            ON CONFLICT DO NOTHING
        `);
        
        const count = await pool.query('SELECT COUNT(*) FROM chat_history');
        console.log(`✅ Table test successful, ${count.rows[0].count} records`);
        
    } catch (error) {
        console.log('❌ Table creation failed:');
        console.log('Error:', error.message);
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed');
    }
}

createChatTable();