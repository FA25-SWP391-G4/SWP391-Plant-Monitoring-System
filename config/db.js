const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'plant_system',
    password: String(process.env.DB_PASSWORD || '123'),
    port: parseInt(process.env.DB_PORT || '5432'),
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
