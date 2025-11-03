/**
 * Run database migration to add settings column to Users table
 */

const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Running migration: add_user_settings_column.sql');
        
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'add_user_settings_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await client.query(migrationSQL);
        
        console.log('✅ Migration completed successfully');
        console.log('   - Added settings column to Users table');
        console.log('   - Created GIN index on settings column');
        
    } catch (error) {
        if (error.code === '42701') {
            console.log('ℹ️  Settings column already exists, migration skipped');
        } else {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('Migration process completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration process failed:', error);
        process.exit(1);
    });