require('dotenv').config({ path: './ai_service/.env' });
const { Pool } = require('pg');

async function createTableStepByStep() {
    console.log('🗄️  Creating Chat History Table Step by Step...\n');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Test connection
        console.log('🔌 Testing database connection...');
        const now = await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful:', now.rows[0].now);
        
        // Drop table if exists (for clean start)
        console.log('🧹 Dropping existing table if exists...');
        await pool.query('DROP TABLE IF EXISTS chat_history');
        console.log('✅ Table dropped');
        
        // Create table
        console.log('🚀 Creating chat_history table...');
        await pool.query(`
            CREATE TABLE chat_history (
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
        
        // Create indexes one by one
        console.log('🔍 Creating user_id index...');
        await pool.query('CREATE INDEX idx_chat_history_user_id ON chat_history (user_id)');
        console.log('✅ User ID index created');
        
        console.log('🔍 Creating conversation_id index...');
        await pool.query('CREATE INDEX idx_chat_history_conversation_id ON chat_history (conversation_id)');
        console.log('✅ Conversation ID index created');
        
        // Verify table structure
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
        const insertResult = await pool.query(`
            INSERT INTO chat_history (user_id, message, response, conversation_id, context) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING chat_id
        `, [1, 'Test message', 'Test response', 'test-conv-123', JSON.stringify({test: true})]);
        
        console.log('✅ Sample data inserted, chat_id:', insertResult.rows[0].chat_id);
        
        const count = await pool.query('SELECT COUNT(*) FROM chat_history');
        console.log(`✅ Table test successful, ${count.rows[0].count} records total`);
        
    } catch (error) {
        console.log('❌ Operation failed:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed');
    }
}

createTableStepByStep();