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

// Initialize connection when this module is loaded so callers don't need to invoke connectDB()
(async function initDbOnLoad() {
    try {
        console.log('config/db.js: initializing PostgreSQL connection...');
        // Log the database URL for debugging (only in non-production)
        if (process.env.NODE_ENV !== 'production') {
            console.log('config/db.js: DATABASE_URL=', process.env.DATABASE_URL);
        }
        await connectDB();
        console.log('config/db.js: PostgreSQL initialization complete');
    } catch (err) {
        console.error('config/db.js: failed to initialize PostgreSQL:', err);
        // connectDB already exits on error, but ensure exit here too
        try { process.exit(1); } catch (e) {}
    }
})();

module.exports = { pool, connectDB };
