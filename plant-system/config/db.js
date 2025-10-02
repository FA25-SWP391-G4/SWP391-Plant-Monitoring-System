const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL Connected successfully');
        client.release();
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
};

module.exports = { pool, connectDB };
